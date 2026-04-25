# Pickly — Launch Checklist (config externa)

Esta guía cubre lo que **NO** se hace por código y hay que configurar a mano
en consolas externas antes de anunciar el lanzamiento. Tachá de arriba a abajo.

> **Decisión de producto v1**: el único método de login es **Google OAuth**.
> No hay email+password ni magic link, así que **no hace falta SMTP propio
> ni Resend** — cero costo extra.
>
> Quien no tenga cuenta de Google sigue pudiendo crear y votar polls
> anónimamente desde el modal "Continuar sin cuenta".

> **Dónde se configura cada cosa:**
> - **Vercel** → DNS del dominio + variables de entorno.
> - **Supabase Dashboard** → URLs de redirect (`Site URL`, `Redirect URLs`)
>   y prender el provider de Google con las credenciales que te dé Google Cloud.
> - **Google Cloud Console** → SOLO para generar el `Client ID` + `Client Secret`
>   de Google OAuth. Esos dos strings los pegás en Supabase.

---

## 0) Estado actual del repo

Ya hecho en código:

- [x] Metadata Pickly en root layout (title, description, OG, manifest, icons).
- [x] OpenGraph dinámico por poll en `/votes`, `/ranking`, `/ratings`, `/versus` con token.
- [x] Login simplificado: solo botón "Continuar con Google".
- [x] `/privacy` y `/terms` linkeados desde el footer.
- [x] Hotfixes SQL: `delete_poll_rpc`, `delete_tournament_rpc`, `close_poll_rpc`.
- [x] AnonCreateModal explícito (login / continuar sin cuenta).
- [x] OnboardingScreen filtrado por ruta.

---

## 1) Dominio `letspicky.com` en Vercel

Ya está apuntando — solo doble check:

- [ ] **DNS** del registrar apunta a Vercel:
    - `A` record en `@` → `76.76.21.21`
    - `CNAME` en `www` → `cname.vercel-dns.com`
- [ ] En **Vercel → Project → Settings → Domains**:
    - `letspicky.com` y `www.letspicky.com` agregados.
    - Uno marcado como "Primary" (recomendado: el bare `letspicky.com`).
    - El otro con redirect 308 al primary.
- [ ] HTTPS activo (Vercel emite cert automático con Let's Encrypt).
- [ ] Probar `https://letspicky.com` en navegador limpio (sin cache).

### Variables de entorno en Vercel

En **Settings → Environment Variables** (Production + Preview):

- [ ] `NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>`

(no necesitamos `SERVICE_ROLE` — todo lo sensible va por RPC con SECURITY DEFINER).

---

## 2) Supabase — URL Configuration (OBLIGATORIO)

Cómo llegar:

1. https://supabase.com/dashboard → entrar al proyecto Pickly.
2. Sidebar izquierdo → ícono de **escudo** = "Authentication".
3. Sub-menú dentro de Authentication → **URL Configuration**.

Setear:

- [ ] **Site URL** = `https://letspicky.com` (un solo valor, sin wildcard).
- [ ] **Redirect URLs** (lista, una por línea — el `/**` con doble asterisco
      cubre cualquier path):
    ```
    https://letspicky.com/**
    https://www.letspicky.com/**
    http://localhost:3000/**
    ```
- [ ] **Save**.

> Si solo ponés `https://www.letspicky.com/**`, el redirect post-login a
> `letspicky.com` (sin www) no matchea y rompe el flow. Por eso van los dos.

En **Authentication → Providers**:

- [ ] **Email** → desactivado (no lo usamos en v1).
- [ ] **Google** → habilitado, con Client ID + Client Secret de Google Cloud
      (ver paso 3).

---

## 3) Google Cloud OAuth

En [Google Cloud Console](https://console.cloud.google.com/) → tu proyecto
(o creá uno nuevo si no tenés):

- [ ] **APIs & Services → OAuth consent screen**:
    - User type: **External**.
    - App name: `Pickly`.
    - User support email: `hola@letspicky.com` (o tu email).
    - Authorized domains: `letspicky.com`, `supabase.co`.
    - Scopes: `openid`, `email`, `profile`.
    - Test users: agregá tu email mientras esté en "Testing".
- [ ] **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**:
    - Application type: **Web application**.
    - Authorized JavaScript origins:
      ```
      https://letspicky.com
      https://www.letspicky.com
      http://localhost:3000
      ```
    - Authorized redirect URIs (uno solo, el de Supabase):
      ```
      https://<tu-proyecto>.supabase.co/auth/v1/callback
      ```
- [ ] Copiar **Client ID + Client Secret** → pegarlos en
      Supabase → Auth → Providers → Google → Save.
- [ ] Cuando esté testeado, en OAuth consent screen → **Publish app**
      (sale del modo Testing, lo puede usar cualquiera).

---

## 4) Subir migraciones SQL

En **Supabase Dashboard → SQL Editor** (en orden, una por una):

- [ ] `supabase/privacy-migration.sql` *(si no se corrió antes)*.
- [ ] `supabase/hotfix-close-poll.sql`.
- [ ] `supabase/hotfix-delete-ownership.sql`.
- [ ] `supabase/anti-fraud-v6.sql` — agrega `rate_limits`, RPCs nuevas,
      cierra policies abiertas de `duel_votes`, agenda purge en pg_cron.
- [ ] Verificar smoke tests al final de cada archivo.

> ⚠️ `anti-fraud-v6.sql` requiere que la extensión `pg_cron` esté habilitada
> (Database → Extensions → buscar `pg_cron` → Enable). Si nunca corriste
> migraciones que usen cron, hacelo antes de aplicar este archivo.

---

## 4.b) Cloudflare Turnstile (anti-trampa)

Setup gratis, sin tarjeta, sin cookies. El widget es invisible en
"Managed mode" — el usuario no ve nada salvo que el sistema lo detecte
sospechoso.

1. https://dash.cloudflare.com → cuenta personal (o crearla con email).
2. Sidebar → **Turnstile** → **Add Site**.
3. Settings:
    - **Site name**: Pickly
    - **Domain**: `letspicky.com` (Cloudflare permite múltiples; agregá
      también `www.letspicky.com` y `localhost` si querés probar local).
    - **Widget Mode**: `Managed` (recomendado) o `Invisible`.
4. Copiá las dos claves que te genera:
    - `Site Key` (pública) → va al cliente.
    - `Secret Key` (privada) → va al server.

En **Vercel → Settings → Environment Variables** (Production + Preview):

- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY=<site key>` (sí, expone al browser).
- [ ] `TURNSTILE_SECRET=<secret key>` (NO `NEXT_PUBLIC_*`, server-only).
- [ ] `IP_HASH_SALT=<string random largo>` — sal para hashear los IPs en
      los rate limits. Generá con `openssl rand -hex 32` o cualquier random
      de 32+ caracteres. Si rota, el rate limit "se resetea" para todos —
      no es problema.

Para **probar local sin Cloudflare** podés usar las test keys oficiales
(siempre pasan, nunca bloquean):

```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET=1x0000000000000000000000000000000AA
```

Si las env vars no están seteadas en absoluto, el código degrada silencioso:
el cliente no muestra captcha y el server acepta sin verificar. Útil en dev,
PELIGROSO en prod — por eso este checkbox.

---

## 5) Smoke tests end-to-end (post-deploy)

Probar en `https://letspicky.com` con un navegador en incógnito:

- [ ] Crear poll **sin login** → votar desde otro navegador → cerrar poll.
- [ ] Crear poll **logueado** con Google → borrarlo desde el menú (⋮).
- [ ] Login con Google funciona y redirige a home.
- [ ] Logout → redirect a home, sin sesión.
- [ ] Compartir un poll → abrir el link en WhatsApp o pegarlo en un chat
      con previews → el preview tiene título, descripción e imagen del poll
      (no el genérico "Pickly").
- [ ] Visitar `/privacy` y `/terms` desde el footer.

---

## 6) Limitaciones del plan free de Supabase (saber esto)

- **500 MB** de storage en DB.
- **1 GB** de bandwidth/mes.
- **50.000 MAU** (Monthly Active Users) en Auth — más que suficiente para empezar.
- **El proyecto se pausa después de 7 días sin actividad**. Si lanzás y nadie
  entra unos días, la app se cae sola hasta que vos vuelvas al dashboard
  y le des "Restore". No es problema con tráfico real, pero las primeras
  semanas hay que estar atento.

---

## 7) Anuncio

- [ ] Capturas / screenshots de las 4 verticales.
- [ ] Publicar en redes con la URL `https://letspicky.com`.
- [ ] Avisar al primer círculo (familia/amigos) y dejar 24-48h de buffer
      por si aparece algún hotfix urgente.

---

## 8) Post-launch (no bloquea)

- [x] **#38** — Stack anti-trampa: SQL `anti-fraud-v6.sql` + Turnstile
      invisible + rate limit por IP en RPC. Solo falta correr la migración
      y setear las 3 env vars (paso 4.b).
- [ ] **#4** — Versus dirección B (modo híbrido personal + agregado).
- [ ] **Email auth + magic link**: si la gente pide "no quiero usar Google",
      podemos volver a habilitar email+password agregando un SMTP propio
      (Resend free tier: 100 emails/día, 3.000/mes, sin tarjeta). Las
      funciones del lado del cliente están en el git history de
      `src/lib/auth.ts`.
- [ ] Sentry o LogRocket para capturar errores en prod.
- [ ] Plausible / Umami si querés analytics más detallado que Vercel Analytics.
