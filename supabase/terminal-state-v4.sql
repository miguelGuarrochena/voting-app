-- ============================================================
-- PICKLY — Migration v4: estado terminal explícito + auto-purge
-- Ejecutar en Supabase SQL Editor (una sola vez).
-- Idempotente: se puede correr N veces sin romper nada.
--
-- MOTIVACIÓN:
--   (1) "Cerrar ahora" hace UPDATE directo en polls, pero no existe
--       una UPDATE policy → RLS rechaza silencioso (no tira error).
--       Resultado: la UI cree que cerró pero la BD nunca cambió.
--   (2) Necesitamos distinguir "cerrada a mano" vs "expirada por tiempo"
--       para mostrar "🔒 Cerrada" en vez de "Tiempo restante: 23h".
--   (3) Hoy submit_response no valida el estado terminal. Cualquier
--       cliente puede postear respuestas a una encuesta cerrada.
--   (4) Las encuestas no se borran solas → auto-purga a 90 días.
--
-- CAMBIOS:
--   A) ADD COLUMN polls.closed_at timestamptz
--   B) Reemplazar get_poll_by_token: ya no filtra por expires_at
--      (el front distingue estado terminal y muestra podio)
--   C) RPC close_poll_rpc(token) — setea closed_at = now()
--   D) RPC update_poll_rpc(token, title, description, cover, options)
--      (reemplaza UPDATEs directos, sirve para edit completo)
--   E) RPC update_poll_title_rpc(token, title)
--      (sirve para el "Editar título" rápido del menú ⋮)
--   F) RPC submit_response_rpc(token, username, response)
--      — rechaza con error 'poll_closed' si está terminal
--   G) pg_cron job diario que borra polls WHERE
--      COALESCE(closed_at, expires_at) < now() - interval '90 days'
--      (requiere extensión pg_cron habilitada en Supabase)
-- ============================================================


-- ============================================================
-- A) COLUMNA closed_at
-- ============================================================
ALTER TABLE public.polls
  ADD COLUMN IF NOT EXISTS closed_at timestamptz;

-- Index para la purga diaria (barrido por fecha terminal)
CREATE INDEX IF NOT EXISTS polls_terminal_at_idx
  ON public.polls ((COALESCE(closed_at, expires_at)));


-- ============================================================
-- B) get_poll_by_token SIN filtro de expiración
--    Los polls terminales siguen siendo accesibles para mostrar
--    podio + banner "Cerrada". La purga a 90 días los limpia.
-- ============================================================
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
-- C) close_poll_rpc — cerrar manualmente
--    SECURITY DEFINER salta RLS.
--    Si ya está cerrada, no hace nada (idempotente).
-- ============================================================
CREATE OR REPLACE FUNCTION public.close_poll_rpc(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_found boolean;
BEGIN
  UPDATE public.polls
     SET closed_at = COALESCE(closed_at, now())
   WHERE token = p_token;

  GET DIAGNOSTICS v_found = ROW_COUNT;
  RETURN v_found > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.close_poll_rpc(text) TO anon, authenticated;


-- ============================================================
-- D) update_poll_rpc — edit completo (título/desc/cover/options)
--    Usa NULL como "no tocar". Bloquea edición si el poll está
--    terminal (closed_at o expires_at pasados).
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_poll_rpc(
  p_token       text,
  p_title       text        DEFAULT NULL,
  p_description text        DEFAULT NULL,
  p_cover       text        DEFAULT NULL,
  p_options     jsonb       DEFAULT NULL,
  p_clear_cover boolean     DEFAULT false,
  p_clear_desc  boolean     DEFAULT false
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_poll public.polls%ROWTYPE;
  v_rows int;
BEGIN
  SELECT * INTO v_poll FROM public.polls WHERE token = p_token;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'poll_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_poll.closed_at IS NOT NULL OR v_poll.expires_at <= now() THEN
    RAISE EXCEPTION 'poll_closed' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.polls
     SET title        = COALESCE(p_title, title),
         description  = CASE WHEN p_clear_desc  THEN NULL
                             WHEN p_description IS NOT NULL THEN p_description
                             ELSE description END,
         cover_image  = CASE WHEN p_clear_cover THEN NULL
                             WHEN p_cover       IS NOT NULL THEN p_cover
                             ELSE cover_image END,
         options      = COALESCE(p_options, options)
   WHERE token = p_token;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_poll_rpc(text, text, text, text, jsonb, boolean, boolean)
  TO anon, authenticated;


-- ============================================================
-- E) update_poll_title_rpc — shortcut del menú ⋮
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_poll_title_rpc(
  p_token text,
  p_title text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_title IS NULL OR length(trim(p_title)) = 0 THEN
    RAISE EXCEPTION 'empty_title' USING ERRCODE = 'P0001';
  END IF;

  RETURN public.update_poll_rpc(p_token => p_token, p_title => trim(p_title));
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_poll_title_rpc(text, text) TO anon, authenticated;


-- ============================================================
-- F) submit_response_rpc — con guard server-side
--    Rechaza si la encuesta está en estado terminal.
--    Hace upsert por (poll_token, username).
-- ============================================================
CREATE OR REPLACE FUNCTION public.submit_response_rpc(
  p_token    text,
  p_username text,
  p_response jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_poll public.polls%ROWTYPE;
BEGIN
  IF p_username IS NULL OR length(trim(p_username)) = 0 THEN
    RAISE EXCEPTION 'empty_username' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_poll FROM public.polls WHERE token = p_token;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'poll_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_poll.closed_at IS NOT NULL OR v_poll.expires_at <= now() THEN
    RAISE EXCEPTION 'poll_closed' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.poll_responses (poll_token, username, response)
  VALUES (p_token, p_username, p_response)
  ON CONFLICT (poll_token, username)
  DO UPDATE SET response = EXCLUDED.response;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_response_rpc(text, text, jsonb)
  TO anon, authenticated;


-- ============================================================
-- G) pg_cron — auto-purga a 90 días
--    Requiere la extensión pg_cron (en Supabase: Dashboard →
--    Database → Extensions → habilitar "pg_cron").
--    Si pg_cron no está disponible, este bloque falla pero el
--    resto de la migración queda aplicado. Podés correrlo aparte
--    después de habilitar la extensión.
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Borra el job anterior si existe, para idempotencia
DO $$
BEGIN
  PERFORM cron.unschedule('pickly_purge_old_polls');
EXCEPTION WHEN OTHERS THEN
  -- si no existía, ignorar
  NULL;
END $$;

-- Corre todos los días a las 03:00 UTC
SELECT cron.schedule(
  'pickly_purge_old_polls',
  '0 3 * * *',
  $CRON$
    DELETE FROM public.polls
     WHERE COALESCE(closed_at, expires_at) < now() - interval '90 days';
  $CRON$
);


-- ============================================================
-- SMOKE TESTS (opcionales, correr uno por uno desde el editor):
--
-- 1) Verificar columna closed_at:
-- SELECT column_name, data_type
--   FROM information_schema.columns
--  WHERE table_schema = 'public'
--    AND table_name   = 'polls'
--    AND column_name  = 'closed_at';
-- Esperado: 1 fila, timestamp with time zone.
--
-- 2) Verificar que las RPCs existen:
-- SELECT proname FROM pg_proc
--  WHERE pronamespace = 'public'::regnamespace
--    AND proname IN (
--      'close_poll_rpc',
--      'update_poll_rpc',
--      'update_poll_title_rpc',
--      'submit_response_rpc'
--    );
-- Esperado: 4 filas.
--
-- 3) Verificar el job de cron:
-- SELECT jobname, schedule
--   FROM cron.job
--  WHERE jobname = 'pickly_purge_old_polls';
-- Esperado: 1 fila con '0 3 * * *'.
-- ============================================================

-- ============================================================
-- FIN
-- ============================================================
