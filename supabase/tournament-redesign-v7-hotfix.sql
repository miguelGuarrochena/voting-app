-- ============================================================
-- PICKLY — Migration v7 HOTFIX: Tournament redesign fixes
-- Ejecutar en Supabase SQL Editor (una sola vez, DESPUÉS de v7).
-- Idempotente: se puede correr N veces sin romper nada.
--
-- MOTIVACIÓN:
--   El v7 inicial tiene 3 bugs críticos descubiertos en review:
--   (1) update_match_result_rpc desordena el array de matches al
--       hacer (v_matches || nuevo) seguido de (v_matches - idx).
--       Cada match actualizado se mueve al final, rompiendo el
--       avance del bracket que dependía de orden posicional.
--   (2) advance_bracket_round_rpc tiene el mismo bug + usa
--       matemática posicional (floor(i/2)) que se rompe en cuanto
--       (1) corrompe el orden. La solución es usar los campos
--       nextMatchId / nextMatchPosition que ya vienen en cada
--       BracketMatch desde el cliente (generados en lib/tournament.ts).
--   (3) Falta cron de purga: los torneos quedan en la DB
--       indefinidamente después de expirar.
--   (4) update_match_result_rpc no tiene rate limit.
--   (5) El CHECK de status no incluía 'expired'; closeTournament()
--       en el frontend lo usa, generando errores 23514.
--
-- CAMBIOS:
--   A) ALTER CHECK status: añadir 'expired' al constraint.
--   B) REPLACE update_match_result_rpc: jsonb_set por path,
--      no desordena array. Bloquea edits a torneos finished/expired
--      o si el match ya está en una ronda anterior a la actual.
--      Rate limit 30/min por torneo.
--   C) REPLACE advance_bracket_round_rpc: usa nextMatchId del match
--      origen para encontrar destino. Sin matemática posicional.
--      Marca status='finished' al completar la ronda final.
--   D) Cron job 'pickly-purge-expired-tournaments': borra cada hora
--      torneos con expires_at + 24h ya pasado.
-- ============================================================

-- ============================================================
-- A) Ampliar CHECK de status para incluir 'expired'
--    closeTournament() en frontend lo usa.
-- ============================================================

ALTER TABLE public.tournaments
  DROP CONSTRAINT IF EXISTS tournaments_status_check;

ALTER TABLE public.tournaments
  ADD CONSTRAINT tournaments_status_check
  CHECK (status IN ('active', 'finished', 'expired'));

-- ============================================================
-- B) update_match_result_rpc — fix desorden del array + rate limit
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_match_result_rpc(
  p_token text,
  p_match_id text,
  p_result jsonb
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
  -- Rate limit: 30 updates/min por torneo (anti-spam si el link se filtra)
  PERFORM public.check_and_bump_rate_limit_rpc(
    'tournament:' || p_token,
    30,
    60
  );

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
-- C) advance_bracket_round_rpc — usa nextMatchId / nextMatchPosition
--    en vez de matemática posicional
-- ============================================================

CREATE OR REPLACE FUNCTION public.advance_bracket_round_rpc(
  p_token        text,
  p_round_number int
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tournament   public.tournaments%ROWTYPE;
  v_matches      jsonb;
  v_match        jsonb;
  v_winner       jsonb;
  v_winner_key   text;
  v_next_id      text;
  v_next_pos     text;
  v_field        text;
  v_max_round    int := 0;
  v_final_done   boolean := true;
  v_final_count  int := 0;
BEGIN
  -- Validar torneo (debe ser bracket)
  SELECT * INTO v_tournament FROM public.tournaments
  WHERE token = p_token AND mode = 'bracket';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'tournament_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_tournament.status IN ('finished', 'expired') THEN
    RAISE EXCEPTION 'tournament_finished' USING ERRCODE = 'P0001';
  END IF;

  v_matches := v_tournament.matches;

  -- 1) Validar que TODOS los matches de p_round_number estén completados
  FOR i IN 0..jsonb_array_length(v_matches)-1 LOOP
    v_match := v_matches->i;
    IF (v_match->>'round')::int = p_round_number
       AND (v_match->>'status') != 'completed' THEN
      RAISE EXCEPTION 'round_not_complete' USING ERRCODE = 'P0001';
    END IF;
    IF (v_match->>'round')::int > v_max_round THEN
      v_max_round := (v_match->>'round')::int;
    END IF;
  END LOOP;

  -- 2) Para cada match completado de la ronda, escribir el ganador
  --    en el match destino (nextMatchId, nextMatchPosition).
  FOR i IN 0..jsonb_array_length(v_matches)-1 LOOP
    v_match := v_matches->i;
    IF (v_match->>'round')::int != p_round_number THEN CONTINUE; END IF;

    -- Determinar ganador segun tipo de result
    v_winner_key := NULL;
    IF (v_match->'result'->>'type') = 'score' THEN
      IF (v_match->'result'->>'scoreA')::int > (v_match->'result'->>'scoreB')::int THEN
        v_winner_key := 'A';
      ELSIF (v_match->'result'->>'scoreB')::int > (v_match->'result'->>'scoreA')::int THEN
        v_winner_key := 'B';
      END IF;
    ELSIF (v_match->'result'->>'type') = 'winloss' THEN
      IF (v_match->'result'->>'winner') = 'A' THEN v_winner_key := 'A';
      ELSIF (v_match->'result'->>'winner') = 'B' THEN v_winner_key := 'B';
      END IF;
    END IF;

    -- Empate en bracket → no puede avanzar nadie. Bloqueamos para que el
    -- usuario corrija el resultado (en bracket no hay empates posibles
    -- excepto error humano).
    IF v_winner_key IS NULL THEN
      RAISE EXCEPTION 'draw_not_allowed_in_bracket' USING ERRCODE = 'P0001';
    END IF;

    IF v_winner_key = 'A' THEN
      v_winner := v_match->'playerA';
    ELSE
      v_winner := v_match->'playerB';
    END IF;

    v_next_id  := v_match->>'nextMatchId';
    v_next_pos := v_match->>'nextMatchPosition';

    -- nextMatchId NULL → este match es el final, no hay donde escribir
    IF v_next_id IS NULL OR v_next_id = '' THEN CONTINUE; END IF;

    v_field := CASE WHEN v_next_pos = 'A' THEN 'playerA' ELSE 'playerB' END;

    -- Encontrar el match destino por id y escribir el ganador en el slot
    FOR j IN 0..jsonb_array_length(v_matches)-1 LOOP
      IF (v_matches->j->>'id') = v_next_id THEN
        v_matches := jsonb_set(v_matches, ARRAY[j::text, v_field], v_winner);
        EXIT;
      END IF;
    END LOOP;
  END LOOP;

  UPDATE public.tournaments
     SET matches = v_matches
   WHERE token = p_token;

  -- 3) Si la ronda que recién avanzó era la última, marcar finished.
  --    (En realidad: si la ronda final tiene 1 match completado, listo.)
  IF p_round_number >= v_max_round THEN
    -- p_round_number era ya la última, no hay donde avanzar; igual marcamos
    UPDATE public.tournaments SET status = 'finished' WHERE token = p_token;
  ELSE
    -- Verificar si ahora la ronda final ya está completa (caso raro pero
    -- posible si solo había 1 match posterior y se completó por home_and_away)
    v_final_count := 0;
    v_final_done := true;
    FOR i IN 0..jsonb_array_length(v_matches)-1 LOOP
      IF (v_matches->i->>'round')::int = v_max_round THEN
        v_final_count := v_final_count + 1;
        IF (v_matches->i->>'status') != 'completed' THEN
          v_final_done := false;
        END IF;
      END IF;
    END LOOP;
    IF v_final_done AND v_final_count = 1 THEN
      UPDATE public.tournaments SET status = 'finished' WHERE token = p_token;
    END IF;
  END IF;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.advance_bracket_round_rpc(text, int)
  TO anon, authenticated;

-- ============================================================
-- D) Cron de purga — elimina torneos 24h después de su expires_at
--    Si el plan free se queda corto, bajar el delay a 0h.
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Quitar job previo si existía (idempotente)
    PERFORM cron.unschedule(jobid)
      FROM cron.job
     WHERE jobname = 'pickly-purge-expired-tournaments';

    PERFORM cron.schedule(
      'pickly-purge-expired-tournaments',
      '0 * * * *', -- cada hora
      $cron$
        DELETE FROM public.tournaments
         WHERE expires_at < (now() - interval '24 hours');
      $cron$
    );
  END IF;
END $$;

-- ============================================================
-- SMOKE TESTS (correr uno por uno):
--
-- 1) CHECK de status acepta 'expired':
-- SELECT pg_get_constraintdef(oid)
--   FROM pg_constraint
--  WHERE conrelid = 'public.tournaments'::regclass
--    AND conname = 'tournaments_status_check';
-- Esperado: incluye 'expired'.
--
-- 2) Las RPCs siguen ahí (debería haber UNA versión de cada):
-- SELECT proname, pg_get_function_identity_arguments(oid)
--   FROM pg_proc
--  WHERE pronamespace = 'public'::regnamespace
--    AND proname IN ('update_match_result_rpc', 'advance_bracket_round_rpc');
-- Esperado: 2 filas.
--
-- 3) Cron job programado:
-- SELECT jobname, schedule, command
--   FROM cron.job
--  WHERE jobname = 'pickly-purge-expired-tournaments';
-- Esperado: 1 fila, schedule = '0 * * * *'.
-- ============================================================

-- ============================================================
-- FIN
-- ============================================================
