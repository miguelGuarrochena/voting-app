-- ============================================================
-- PICKLY — Hotfix #4 del rediseño v7 (Versus)
-- Ejecutar en Supabase SQL Editor (una sola vez).
-- Idempotente: se puede correr N veces sin romper nada.
--
-- MOTIVACIÓN:
--   El hotfix-1 (tournament-redesign-v7-hotfix.sql, línea 69) llama a:
--
--     PERFORM public.check_and_bump_rate_limit_rpc(
--       'tournament:' || p_token,  -- text
--       30,                        -- integer
--       60                         -- integer
--     );
--
--   Pero la firma REAL de check_and_bump_rate_limit_rpc, definida en
--   anti-fraud-v6.sql, es:
--
--     check_and_bump_rate_limit_rpc(p_ip_hash text, p_scope text, p_resource_token text)
--
--   Con limites hardcoded (20/min, 60/hora) — los args 2 y 3 NO son numericos.
--
--   Postgres entonces explota con:
--     "function public.check_and_bump_rate_limit_rpc(text, integer, integer)
--      does not exist"
--   cada vez que el usuario guarda el resultado de un partido.
--
-- DECISIÓN:
--   Sacamos la llamada al rate limit en update_match_result_rpc.
--
--   Justificación:
--     - El rate limit anti-fraude está pensado para spam de votos
--       (donde mil personas votan desde una misma red).
--     - Para edits de torneo: el daño máximo es que alguien spamee resultados
--       de un partido en un torneo cuyo link fue filtrado. No suma valor
--       real prevenirlo a costa de tener un endpoint roto.
--     - Si en el futuro queremos rate-limitar tournament edits, agregamos
--       un /api/versus/match endpoint que pase ip_hash como en submit_response.
--
-- CAMBIO:
--   REPLACE update_match_result_rpc sin el PERFORM al rate limit.
--   El resto de la función queda igual al hotfix-1.
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_match_result_rpc(
  p_token    text,
  p_match_id text,
  p_result   jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tournament public.tournaments%ROWTYPE;
  v_matches    jsonb;
  v_idx        int;
  v_match      jsonb;
BEGIN
  -- (rate limit removido — ver motivación arriba)

  -- Validar torneo
  SELECT * INTO v_tournament FROM public.tournaments WHERE token = p_token;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'tournament_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_tournament.status IN ('finished', 'expired') THEN
    RAISE EXCEPTION 'tournament_finished' USING ERRCODE = 'P0001';
  END IF;

  IF v_tournament.expires_at < now() THEN
    RAISE EXCEPTION 'tournament_expired' USING ERRCODE = 'P0001';
  END IF;

  v_matches := v_tournament.matches;
  v_idx := -1;

  -- Encontrar match por id (preservando posición)
  FOR i IN 0..jsonb_array_length(v_matches)-1 LOOP
    IF (v_matches->i->>'id') = p_match_id THEN
      v_idx := i;
      v_match := v_matches->i;
      EXIT;
    END IF;
  END LOOP;

  IF v_idx = -1 THEN
    RAISE EXCEPTION 'match_not_found' USING ERRCODE = 'P0002';
  END IF;

  -- Bloquear edits a matches con placeholder (TBD) — la ronda anterior
  -- todavía no avanzó, no tiene sentido cargar resultado acá.
  IF (v_match->'playerA'->>'id') IS NULL OR (v_match->'playerA'->>'id') = ''
     OR (v_match->'playerB'->>'id') IS NULL OR (v_match->'playerB'->>'id') = '' THEN
    RAISE EXCEPTION 'match_not_ready' USING ERRCODE = 'P0001';
  END IF;

  -- jsonb_set por path NO mueve el elemento — preserva orden e índices
  v_matches := jsonb_set(v_matches, ARRAY[v_idx::text, 'result'],  p_result);
  v_matches := jsonb_set(v_matches, ARRAY[v_idx::text, 'status'],  '"completed"'::jsonb);

  UPDATE public.tournaments
     SET matches = v_matches
   WHERE token = p_token;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_match_result_rpc(text, text, jsonb)
  TO anon, authenticated;

-- ============================================================
-- SMOKE TEST (correr después de aplicar):
--
-- SELECT proname, pg_get_function_arguments(oid)
--   FROM pg_proc
--  WHERE pronamespace = 'public'::regnamespace
--    AND proname = 'update_match_result_rpc';
-- Esperado: 1 fila con args = "p_token text, p_match_id text, p_result jsonb"
-- ============================================================
