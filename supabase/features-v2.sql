-- ============================================================
-- PICKLY — Migration v2: "Cerrar ahora" + "Editar título"
-- Ejecutar en Supabase SQL Editor (una sola vez).
-- Idempotente: se puede correr N veces sin romper nada.
--
-- Qué agrega:
--   1. Policy polls_update → permitir UPDATE sobre polls
--      (hasta ahora solo estaba INSERT y DELETE).
--   2. Redefine get_poll_by_token para NO filtrar por expiración.
--      Antes filtraba por expires_at > now() → si cerrabas un poll,
--      la página entera se rompía porque la RPC ya no lo devolvía.
--      El frontend ya sabe manejar el estado "expired" (banner, bloqueo
--      de voto, etc.), así que sacamos ese filtro acá.
--
-- Para tournaments NO hace falta cambiar nada:
--   - tourn_update ya existe (desde privacy-migration.sql).
--   - get_tournament_by_token nunca filtró por expires_at.
--
-- Modelo de seguridad:
--   Seguimos con "token = capability": cualquiera con el token puede
--   borrar / cerrar / editar el título. Es idéntico al modelo actual
--   de DELETE y es consistente. Si más adelante agregás auth real,
--   acá es donde endurecés con policies que chequeen auth.uid() = owner.
-- ============================================================

-- ------------------------------------------------------------
-- PASO 1 — polls_update: permitir UPDATE
-- ------------------------------------------------------------
DROP POLICY IF EXISTS polls_update ON public.polls;

CREATE POLICY polls_update ON public.polls
  FOR UPDATE TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- PASO 2 — Redefinir get_poll_by_token sin filtrar expirados
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_poll_by_token(p_token text)
RETURNS SETOF public.polls
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.polls
  WHERE token = p_token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_poll_by_token(text) TO anon, authenticated;

-- ============================================================
-- SMOKE TESTS (corré esto después de aplicar, debería pasar)
-- ============================================================

-- 1) Verificar policy polls_update
-- SELECT polname, polcmd FROM pg_policy WHERE polrelid = 'public.polls'::regclass;
--   Debería listar al menos: polls_insert (r), polls_update (w), polls_delete (d)
--
-- 2) Verificar que get_poll_by_token ya no filtra por expiración:
-- INSERT INTO public.polls (token, type, title, created_by, expires_at, options)
-- VALUES ('SMOKE01', 'vote', 'Smoke', 'tester', now() - interval '1 hour', '[]'::jsonb);
-- SELECT * FROM public.get_poll_by_token('SMOKE01');     -- ahora devuelve 1 fila (antes, 0)
-- DELETE FROM public.polls WHERE token = 'SMOKE01';
--
-- 3) Verificar que UPDATE funciona con la anon key:
-- (desde el cliente, no desde SQL editor)
--   supabase.from('polls').update({ title: 'nuevo' }).eq('token', 'XXX')
--   → no debería tirar 42501.
--
-- ============================================================
-- FIN
-- ============================================================
