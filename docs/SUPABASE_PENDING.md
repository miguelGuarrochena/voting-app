# Supabase — cambios pendientes

> **TL;DR** — el frontend está listo. Faltan **dos SQL**, cualquier orden,
> ambos idempotentes:
>
> 1. `supabase/features-v2.sql` — habilita "Cerrar ahora" + "Editar título"
>    + **"Editar poll completo"** (desde `/[token]/edit`).
> 2. `supabase/content-v3.sql` — persiste `description` y `cover_image` del
>    poll/torneo (antes el form los capturaba pero se perdían).
>
> Las pages nuevas `/votes/[token]/edit`, `/ranking/[token]/edit` y
> `/ratings/[token]/edit` usan `updatePoll()`, que hace `UPDATE polls …`.
> Todos los UPDATE dependen de la misma policy `polls_update` que se crea
> en `features-v2.sql`; por eso **no hace falta SQL adicional** para el
> flujo de edición completa.

---

## 0. `supabase/content-v3.sql` — persistir descripción + imagen de portada

### Qué hace

Agrega dos columnas a `polls` y a `tournaments`:

```sql
ALTER TABLE public.polls
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS cover_image text;

ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS cover_image text;
```

### Por qué

Durante toda la beta, `CreatePollForm` permitía cargar:

- una **descripción** (textarea),
- una **imagen de portada del poll** (`titleImage`).

Pero `createPoll()` nunca mandaba esos campos a la DB, así que se perdían
silenciosamente. Ahora el form los manda como `extras: { description,
coverImage }` y las detail pages los renderizan (hero image + párrafo
debajo del countdown).

### No requiere cambios en RPCs ni policies

- `get_poll_by_token` devuelve `SETOF public.polls` → las columnas nuevas
  aparecen automáticamente.
- Lo mismo para `get_tournament_by_token`.
- `polls_insert` / `polls_update` ya permitían setear columnas arbitrarias.

### Comportamiento si todavía no corriste la migración

El frontend solo incluye `description` / `cover_image` en el payload del
INSERT **si el usuario los completó**. Por eso, si no corriste este SQL
todavía, los polls "simples" (sin descripción ni foto del poll) se
siguen creando bien. Los que cargan descripción o foto del poll van a
tirar un error de Supabase (`column does not exist`) hasta aplicar
`content-v3.sql`.

### Rollback

```sql
ALTER TABLE public.polls       DROP COLUMN IF EXISTS description, DROP COLUMN IF EXISTS cover_image;
ALTER TABLE public.tournaments DROP COLUMN IF EXISTS description, DROP COLUMN IF EXISTS cover_image;
```

---

---

## 1. Qué se agregó en el frontend (ya mergeado)

### Nuevas acciones en el menú owner (kebab ⋮)

En las 4 pages `[token]` (votes, ranking, ratings, versus), cuando el
usuario es creator, el menú ⋮ ahora tiene tres acciones:

1. **Editar título** → abre `EditTitleModal`, guarda con Enter, Esc cancela.
2. **Cerrar ahora** → solo aparece si el poll no está expirado. Abre un
   `ConfirmModal` variant="warning" (naranja, no rojo).
3. **Borrar** → sin cambios.

Si el poll ya está expirado, "Cerrar ahora" desaparece del menú.

### Nuevos componentes

- `src/components/modals/EditTitleModal.tsx` — input + save/cancel,
  atajos de teclado, contador de chars.
- `ConfirmModal` ahora acepta `variant: 'danger' | 'warning' | 'primary'`
  (default `danger` para retrocompat).
- `OwnerMenu` refactorizado: ahora acepta `items: OwnerMenuItem[]` en vez
  de `onDelete` hardcodeado. Cada item tiene `label`, `onClick`, `variant`,
  `divider?`, `disabled?`.

### Nuevas funciones en `lib/db.ts`

- `closePoll(token)` → `UPDATE polls SET expires_at = now()`.
- `closeTournament(token)` → `UPDATE tournaments SET expires_at = now(), status = 'expired'`.
- `updatePollTitle(token, title)` → `UPDATE polls SET title = ?`.
- `updateTournamentTitle(token, title)` → `UPDATE tournaments SET title = ?`.

### Traducciones

Keys agregadas a `poll.json` (EN + ES):
`editTitle`, `editTitleSubtitle`, `titlePlaceholder`, `save`, `titleUpdated`,
`closeNow`, `closeNowTitle`, `closeNowConfirm`, `closeNowConfirmBtn`, `closedToast`.

Key nueva en `common.json`: `actions`.

---

## 2. Qué falta correr en Supabase

### Paso único: aplicar `supabase/features-v2.sql`

Abrí el **SQL Editor** de tu proyecto Supabase, copiá/pegá el contenido de
`supabase/features-v2.sql`, y correlo. Es idempotente, podés correrlo varias
veces sin romper nada.

### Qué hace ese SQL

1. **Crea la policy `polls_update`** (permitir UPDATE sobre `polls`).
   Hasta ahora solo había `polls_insert` y `polls_delete`, entonces cualquier
   UPDATE desde el cliente tiraba `42501` (RLS bloqueado).

2. **Redefine `get_poll_by_token`** para NO filtrar por `expires_at > now()`.
   Antes, apenas cerrabas un poll, la RPC dejaba de devolverlo y la página
   caía en `notFound`. Ahora siempre devuelve el poll aunque esté expirado.
   El frontend ya sabe renderizar el estado "expirado" (banner + bloqueo de voto).

Para **`tournaments` NO hay que tocar nada**:

- La policy `tourn_update` ya existe desde `privacy-migration.sql`.
- `get_tournament_by_token` nunca filtró por expiración.

---

## 3. Cómo probar

Después de correr el SQL:

1. `npm run dev` y abrí un poll creado por vos (vote/ranking/rating/versus).
2. Tocá el kebab ⋮ arriba a la derecha.
3. **Editar título** → cambiá el título, enter, debería persistir (refrescá
   y volvé a entrar, tiene que seguir ahí).
4. **Cerrar ahora** → debería pasar el banner a "expirado" al instante.
   Si refrescás, el poll sigue visible pero bloqueado para votar.
5. **Borrar** → sigue funcionando igual que antes.

### Tests a mano (opcionales, desde SQL editor de Supabase)

```sql
-- Verificar policies existentes
SELECT polname, polcmd
FROM pg_policy
WHERE polrelid = 'public.polls'::regclass;
-- Esperado: polls_insert (a), polls_update (w), polls_delete (d)

-- Verificar que get_poll_by_token devuelve polls expirados
INSERT INTO public.polls (token, type, title, created_by, expires_at, options)
VALUES ('SMOKE01', 'vote', 'Smoke', 'tester', now() - interval '1 hour', '[]'::jsonb);

SELECT token, expires_at > now() AS is_active
FROM public.get_poll_by_token('SMOKE01');
-- Esperado: 1 fila, is_active = false

DELETE FROM public.polls WHERE token = 'SMOKE01';
```

---

## 4. Modelo de seguridad (importante)

Estas policies siguen el mismo modelo "token = capability" que el resto de la
app: **cualquiera con el token puede editar / cerrar / borrar**. No hay auth.

Esto es consistente con lo que ya existía (DELETE también estaba abierto).
Cuando metas auth real más adelante, es acá donde endurecés las policies:

```sql
-- ejemplo cuando tengas auth.users
CREATE POLICY polls_update ON public.polls
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = created_by)
  WITH CHECK (auth.uid()::text = created_by);
```

---

## 5. Rollback

Si hace falta revertir:

```sql
-- Volver a la RPC que filtra expirados (comportamiento original)
CREATE OR REPLACE FUNCTION public.get_poll_by_token(p_token text)
RETURNS SETOF public.polls
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.polls
  WHERE token = p_token
    AND expires_at > now()
  LIMIT 1;
$$;

-- Sacar la policy de UPDATE
DROP POLICY IF EXISTS polls_update ON public.polls;
```

Esto solo rompe las dos acciones nuevas — el resto de la app sigue andando igual.
