-- ============================================================
-- HOTFIX: close_poll_rpc — operator does not exist: boolean > integer
--
-- Bug: v_found estaba declarada como boolean pero GET DIAGNOSTICS
-- ... = ROW_COUNT devuelve integer, y después hacíamos v_found > 0
-- (boolean > integer). Postgres tira operator does not exist.
--
-- Fix: declarar v_rows int.
--
-- Correr este bloque una sola vez en Supabase → SQL Editor.
-- Es idempotente (CREATE OR REPLACE) y también quedó corregido en
-- supabase/terminal-state-v4.sql para instalaciones nuevas.
-- ============================================================

CREATE OR REPLACE FUNCTION public.close_poll_rpc(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows int;
BEGIN
  UPDATE public.polls
     SET closed_at = COALESCE(closed_at, now())
   WHERE token = p_token;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.close_poll_rpc(text) TO anon, authenticated;

-- Smoke test (opcional): reemplazá 'TU_TOKEN_AQUI' por un token real.
-- SELECT public.close_poll_rpc('TU_TOKEN_AQUI');
-- Esperado: true la primera vez, true también la segunda (COALESCE + idempotente).
