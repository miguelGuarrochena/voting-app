-- ============================================================
-- PICKLY — Hotfix #5 del rediseño v7 (Versus)
-- Ejecutar en Supabase SQL Editor (una sola vez).
-- Idempotente: se puede correr N veces sin romper nada.
--
-- MOTIVACIÓN:
--   Bug 2 — "Per-match bracket advancement"
--
--   Hasta ahora, en modo bracket, el ganador de un partido NO aparecía
--   en su slot de la próxima ronda hasta que el usuario:
--     1) completara TODOS los partidos de la ronda actual
--     2) presionara el botón "Avanzar ronda" → llamaba a
--        advance_bracket_round_rpc, que recién ahí propagaba ganadores.
--
--   Esto era contra-intuitivo: el usuario carga el resultado de
--   semis-1 y semis-2 está en TBD aún, esperando el botón.
--
--   El cambio buscado: cuando se guarda el resultado de un partido,
--   el ganador aparece INMEDIATAMENTE en su slot de la próxima
--   ronda. Cada slot avanza independientemente.
--
--   El botón "Avanzar ronda" sigue existiendo y funcionando — sirve
--   para validar que toda la ronda esté completa y para marcar el
--   torneo como finished cuando se cierra la final. La propagación
--   por advance_bracket_round_rpc es idempotente (escribe el mismo
--   ganador al mismo slot).
--
-- DECISIÓN:
--   Ampliamos update_match_result_rpc para que, además de escribir
--   result + status='completed' en el match, también escriba el
--   ganador en el slot del match destino (nextMatchId / nextMatchPosition).
--
--   Lógica de "ganador" replicada de advance_bracket_round_rpc:
--     - type=score → comparar scoreA vs scoreB
--     - type=winloss → leer field 'winner' ('A' o 'B')
--     - empate → no propagamos (no rompemos: un empate en bracket
--       suele ser error humano y no queremos abortar el save).
--
--   Sin nextMatchId (es la final, o home_and_away) → no propagamos.
--   No marcamos torneo finished — eso lo sigue haciendo el botón
--   Avanzar ronda en la última ronda (preservamos UX existente).
--
-- CAMBIO:
--   REPLACE update_match_result_rpc.
--   Estructura idéntica al hotfix-4, pero con bloque nuevo de
--   propagación al final, antes del UPDATE de la tabla.
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
  v_winner_key text;
  v_winner     jsonb;
  v_next_id    text;
  v_next_pos   text;
  v_field      text;
BEGIN
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

  -- Bloquear edits a matches con placeholder (TBD)
  IF (v_match->'playerA'->>'id') IS NULL OR (v_match->'playerA'->>'id') = ''
     OR (v_match->'playerB'->>'id') IS NULL OR (v_match->'playerB'->>'id') = '' THEN
    RAISE EXCEPTION 'match_not_ready' USING ERRCODE = 'P0001';
  END IF;

  -- jsonb_set por path NO mueve el elemento — preserva orden e índices
  v_matches := jsonb_set(v_matches, ARRAY[v_idx::text, 'result'],  p_result);
  v_matches := jsonb_set(v_matches, ARRAY[v_idx::text, 'status'],  '"completed"'::jsonb);

  -- ============================================================
  -- NUEVO (hotfix-5): propagación per-match al slot destino
  -- ============================================================
  IF v_tournament.mode = 'bracket' THEN
    -- Determinar ganador del partido recién guardado
    v_winner_key := NULL;

    IF (p_result->>'type') = 'score' THEN
      IF (p_result->>'scoreA') IS NOT NULL AND (p_result->>'scoreB') IS NOT NULL THEN
        IF (p_result->>'scoreA')::int > (p_result->>'scoreB')::int THEN
          v_winner_key := 'A';
        ELSIF (p_result->>'scoreB')::int > (p_result->>'scoreA')::int THEN
          v_winner_key := 'B';
        END IF;
      END IF;
    ELSIF (p_result->>'type') = 'winloss' THEN
      IF (p_result->>'winner') = 'A' THEN
        v_winner_key := 'A';
      ELSIF (p_result->>'winner') = 'B' THEN
        v_winner_key := 'B';
      END IF;
    END IF;

    -- Si hay ganador definido Y este match tiene destino → propagar.
    -- Empate (v_winner_key NULL) → no propagamos pero no abortamos:
    -- el resultado igual se guarda. El usuario puede corregir luego
    -- y al guardar de nuevo se propaga. advance_bracket_round_rpc
    -- bloquea con 'draw_not_allowed_in_bracket' al cerrar la ronda.
    IF v_winner_key IS NOT NULL THEN
      v_next_id  := v_match->>'nextMatchId';
      v_next_pos := v_match->>'nextMatchPosition';

      IF v_next_id IS NOT NULL AND v_next_id != ''
         AND v_next_pos IS NOT NULL AND v_next_pos != '' THEN
        IF v_winner_key = 'A' THEN
          v_winner := v_match->'playerA';
        ELSE
          v_winner := v_match->'playerB';
        END IF;

        v_field := CASE WHEN v_next_pos = 'A' THEN 'playerA' ELSE 'playerB' END;

        -- Buscar match destino por id y sobrescribir el slot.
        -- Idempotente: si el slot ya tenía a este jugador (por una
        -- ejecución previa o por advance_bracket_round_rpc), queda
        -- igual; si tenía otro (corrección de resultado), lo
        -- actualizamos.
        FOR j IN 0..jsonb_array_length(v_matches)-1 LOOP
          IF (v_matches->j->>'id') = v_next_id THEN
            v_matches := jsonb_set(v_matches, ARRAY[j::text, v_field], v_winner);
            EXIT;
          END IF;
        END LOOP;
      END IF;
    END IF;
  END IF;
  -- ============================================================

  UPDATE public.tournaments
     SET matches = v_matches
   WHERE token = p_token;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_match_result_rpc(text, text, jsonb)
  TO anon, authenticated;

-- ============================================================
-- SMOKE TESTS (correr después de aplicar):
--
-- 1) Firma de la función:
-- SELECT proname, pg_get_function_arguments(oid)
--   FROM pg_proc
--  WHERE pronamespace = 'public'::regnamespace
--    AND proname = 'update_match_result_rpc';
-- Esperado: 1 fila, args = "p_token text, p_match_id text, p_result jsonb"
--
-- 2) En un torneo bracket existente, guardar un resultado de
--    ronda 1 y verificar que el ganador aparezca en el slot
--    correcto del match de ronda 2 ANTES de avanzar la ronda:
--
--    -- Pre: round 2 match X tiene playerA = TBD/null
--    SELECT update_match_result_rpc(
--      'TOKEN_TORNEO',
--      'ID_MATCH_R1',
--      '{"type":"winloss","winner":"A"}'::jsonb
--    );
--    -- Post: el match de ronda 2 al que apunta nextMatchId tiene
--    --       playerA = el ganador (ese mismo player que ganó R1).
--
-- 3) Idempotencia + corrección: re-llamar con winner='B' debe
--    propagar al mismo slot a B (sobrescribiendo a A).
-- ============================================================
