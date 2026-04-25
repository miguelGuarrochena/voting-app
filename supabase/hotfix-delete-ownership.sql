-- ============================================================
-- HOTFIX: delete con check de ownership real (cierra el bug)
--
-- CONTEXTO DEL BUG:
--   1) La policy polls_delete tenía USING (true): cualquiera con la
--      anon key podía borrar cualquier poll (no solo el dueño).
--   2) En paralelo el front mostraba "borrada exitosamente" pero a
--      veces no borraba nada — patrón típico de RLS silencioso (la
--      policy había sido cambiada / regenerada o el path no la
--      permitía y .delete() no devolvía error, solo afectaba 0 rows).
--
-- FIX:
--   - Dropear las policies abiertas polls_delete y tourn_delete.
--   - Routear delete por dos RPCs SECURITY DEFINER que validan
--     ownership en el server:
--       · Si el poll tiene user_id NOT NULL → solo el dueño puede
--         borrar (auth.uid() = user_id).
--       · Si user_id IS NULL (poll anónimo) → cualquiera con el
--         token puede borrar — mismo modelo que vote/edit anon.
--   - Las RPCs limpian dependencias antes de borrar para no asumir
--     ON DELETE CASCADE en las FKs (si no está configurado, el
--     borrado falla con FK violation).
--
-- IDEMPOTENTE: se puede correr N veces sin romper nada.
-- ============================================================


-- ------------------------------------------------------------
-- A) delete_poll_rpc — borra un poll si el caller es el dueño,
--    o si el poll es anónimo.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_poll_rpc(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_rows    int;
BEGIN
  SELECT user_id INTO v_user_id FROM public.polls WHERE token = p_token;

  -- Borrar algo que no existe = no-op exitoso (idempotencia).
  IF NOT FOUND THEN
    RETURN true;
  END IF;

  -- Poll con dueño: solo el dueño puede borrar.
  IF v_user_id IS NOT NULL AND v_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'P0001';
  END IF;

  -- Limpiar dependencias antes (no asumimos FK ON DELETE CASCADE).
  DELETE FROM public.poll_responses WHERE poll_token = p_token;
  DELETE FROM public.polls          WHERE token      = p_token;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_poll_rpc(text) TO anon, authenticated;


-- ------------------------------------------------------------
-- B) delete_tournament_rpc — mismo patrón para tournaments.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_tournament_rpc(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_rows    int;
BEGIN
  SELECT user_id INTO v_user_id FROM public.tournaments WHERE token = p_token;

  IF NOT FOUND THEN
    RETURN true;
  END IF;

  IF v_user_id IS NOT NULL AND v_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'P0001';
  END IF;

  DELETE FROM public.duel_votes  WHERE tournament_token = p_token;
  DELETE FROM public.tournaments WHERE token            = p_token;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_tournament_rpc(text) TO anon, authenticated;


-- ------------------------------------------------------------
-- C) Cerrar la puerta abierta — dropear las policies USING (true)
--    Después de esto, no hay forma de DELETE directo via anon key.
--    Solo via las RPCs de arriba (que validan ownership).
-- ------------------------------------------------------------
DROP POLICY IF EXISTS polls_delete ON public.polls;
DROP POLICY IF EXISTS tourn_delete ON public.tournaments;


-- ============================================================
-- SMOKE TESTS (opcional, correr de a uno):
--
-- 1) Verificar que las RPCs existen y son SECURITY DEFINER:
-- SELECT proname, prosecdef
--   FROM pg_proc
--  WHERE pronamespace = 'public'::regnamespace
--    AND proname IN ('delete_poll_rpc', 'delete_tournament_rpc');
-- Esperado: 2 filas, prosecdef=t en ambas.
--
-- 2) Verificar que NO hay policy de DELETE abierta:
-- SELECT policyname, cmd, qual
--   FROM pg_policies
--  WHERE schemaname = 'public'
--    AND tablename IN ('polls', 'tournaments')
--    AND cmd = 'DELETE';
-- Esperado: 0 filas.
--
-- 3) Borrar un poll propio (logueado):
-- SELECT public.delete_poll_rpc('TU_TOKEN');
-- Esperado: true.
--
-- 4) Intentar borrar un poll ajeno (logueado con otro user):
-- SELECT public.delete_poll_rpc('TOKEN_DE_OTRO');
-- Esperado: ERROR: forbidden
-- ============================================================
