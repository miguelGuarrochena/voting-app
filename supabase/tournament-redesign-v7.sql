-- ============================================================
-- PICKLY — Migration v7: Tournament redesign (bracket/league modes)
-- Ejecutar en Supabase SQL Editor (una sola vez).
-- Idempotente: se puede correr N veces sin romper nada.
--
-- MOTIVACIÓN:
--   Rediseño completo del sistema de torneos Versus:
--   - Dos modos: Bracket (eliminación) y League (round robin)
--   - Resultados reales (no predicciones)
--   - Cualquier participante puede ingresar resultados
--   - Auto-eliminación a 24hs
--
-- CAMBIOS:
--   A) ADD COLUMN tournaments.mode, has_score, matches, status
--   B) DROP COLUMN tournaments.bracket, votes_to_win
--   C) DROP TABLE duel_votes (ya no se vota en predicciones)
--   D) RPC update_match_result_rpc - ingresar resultado de partido
--   E) RPC advance_bracket_round_rpc - avanzar ronda en bracket
--   F) Actualizar get_tournament_by_token para nueva estructura
-- ============================================================

-- ============================================================
-- A) Nuevas columnas en tournaments
-- ============================================================

ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS mode text CHECK (mode IN ('bracket', 'league')),
  ADD COLUMN IF NOT EXISTS has_score boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS matches jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS status text CHECK (status IN ('active', 'finished')) DEFAULT 'active';

-- Índice para status (para filtrar torneos activos)
CREATE INDEX IF NOT EXISTS tournaments_status_idx
  ON public.tournaments(status)
  WHERE status = 'active';

-- ============================================================
-- B) Remover columnas viejas
-- ============================================================

ALTER TABLE public.tournaments
  DROP COLUMN IF EXISTS bracket,
  DROP COLUMN IF EXISTS votes_to_win;

-- ============================================================
-- C) Drop tabla duel_votes (ya no se usa)
-- ============================================================

DROP TABLE IF EXISTS public.duel_votes;

-- ============================================================
-- D) RPC update_match_result_rpc
--    Permite a cualquier participante ingresar resultado de un partido
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
  v_matches jsonb;
  v_match_index int;
  v_match jsonb;
  v_rows int;
BEGIN
  -- Validar que el torneo existe
  SELECT * INTO v_tournament FROM public.tournaments WHERE token = p_token;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'tournament_not_found' USING ERRCODE = 'P0002';
  END IF;

  -- Validar que el torneo esté activo
  IF v_tournament.status = 'finished' THEN
    RAISE EXCEPTION 'tournament_finished' USING ERRCODE = 'P0001';
  END IF;

  -- Validar que el torneo no haya expirado
  IF v_tournament.expires_at < now() THEN
    RAISE EXCEPTION 'tournament_expired' USING ERRCODE = 'P0001';
  END IF;

  -- Encontrar el match en el array
  v_matches := v_tournament.matches;
  v_match_index := -1;

  FOR i IN 0..jsonb_array_length(v_matches)-1 LOOP
    IF (v_matches->i->>'id') = p_match_id THEN
      v_match_index := i;
      EXIT;
    END IF;
  END LOOP;

  IF v_match_index = -1 THEN
    RAISE EXCEPTION 'match_not_found' USING ERRCODE = 'P0002';
  END IF;

  -- Actualizar el resultado del match
  v_matches := v_matches || jsonb_build_array(
    jsonb_set(
      jsonb_set(
        v_matches->v_match_index,
        '{result}',
        p_result
      ),
      '{status}',
      '"completed"'::jsonb
    )
  );
  v_matches := v_matches - v_match_index;

  -- Actualizar el torneo
  UPDATE public.tournaments
     SET matches = v_matches
   WHERE token = p_token;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_match_result_rpc(text, text, jsonb)
  TO anon, authenticated;

-- ============================================================
-- E) RPC advance_bracket_round_rpc
--    Avanza los ganadores de una ronda a la siguiente en bracket
-- ============================================================

CREATE OR REPLACE FUNCTION public.advance_bracket_round_rpc(
  p_token text,
  p_round_number int
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tournament public.tournaments%ROWTYPE;
  v_matches jsonb;
  v_round_matches jsonb;
  v_next_round_matches jsonb;
  v_match jsonb;
  v_winner jsonb;
  v_rows int;
BEGIN
  -- Validar que el torneo existe y es bracket
  SELECT * INTO v_tournament FROM public.tournaments
  WHERE token = p_token AND mode = 'bracket';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'tournament_not_found' USING ERRCODE = 'P0002';
  END IF;

  -- Validar que el torneo esté activo
  IF v_tournament.status = 'finished' THEN
    RAISE EXCEPTION 'tournament_finished' USING ERRCODE = 'P0001';
  END IF;

  v_matches := v_tournament.matches;

  -- Encontrar matches de la ronda actual
  v_round_matches := '[]'::jsonb;
  v_next_round_matches := '[]'::jsonb;

  FOR i IN 0..jsonb_array_length(v_matches)-1 LOOP
    v_match := v_matches->i;
    IF (v_match->>'round')::int = p_round_number THEN
      v_round_matches := v_round_matches || v_match;
    ELSIF (v_match->>'round')::int = p_round_number + 1 THEN
      v_next_round_matches := v_next_round_matches || v_match;
    END IF;
  END LOOP;

  -- Validar que todos los matches de la ronda actual estén completados
  FOR i IN 0..jsonb_array_length(v_round_matches)-1 LOOP
    IF (v_round_matches->i->>'status') != 'completed' THEN
      RAISE EXCEPTION 'round_not_complete' USING ERRCODE = 'P0001';
    END IF;
  END LOOP;

  -- Avanzar ganadores a la siguiente ronda
  FOR i IN 0..jsonb_array_length(v_round_matches)-1 LOOP
    v_match := v_round_matches->i;
    
    -- Determinar ganador según el resultado
    IF (v_match->'result'->>'type') = 'score' THEN
      IF (v_match->'result'->>'scoreA')::int > (v_match->'result'->>'scoreB')::int THEN
        v_winner := v_match->'playerA';
      ELSIF (v_match->'result'->>'scoreB')::int > (v_match->'result'->>'scoreA')::int THEN
        v_winner := v_match->'playerB';
      ELSE
        -- Empate en bracket no debería pasar, pero si pasa, no avanza nadie
        CONTINUE;
      END IF;
    ELSIF (v_match->'result'->>'type') = 'winloss' THEN
      IF (v_match->'result'->>'winner') = 'A' THEN
        v_winner := v_match->'playerA';
      ELSIF (v_match->'result'->>'winner') = 'B' THEN
        v_winner := v_match->'playerB';
      ELSE
        -- Empate en bracket no debería pasar
        CONTINUE;
      END IF;
    ELSE
      CONTINUE;
    END IF;

    -- Colocar ganador en el match correspondiente de la siguiente ronda
    -- La posición i en la ronda actual va a la posición floor(i/2) en la siguiente
    -- Si i es par, va a playerA, si es impar, va a playerB
    DECLARE
      v_next_idx int := floor(i / 2);
      v_is_player_a boolean := (i % 2 = 0);
    BEGIN
      IF v_next_idx < jsonb_array_length(v_next_round_matches) THEN
        IF v_is_player_a THEN
          v_next_round_matches := v_next_round_matches || jsonb_build_array(
            jsonb_set(v_next_round_matches->v_next_idx, '{playerA}', v_winner)
          );
          v_next_round_matches := v_next_round_matches - v_next_idx;
        ELSE
          v_next_round_matches := v_next_round_matches || jsonb_build_array(
            jsonb_set(v_next_round_matches->v_next_idx, '{playerB}', v_winner)
          );
          v_next_round_matches := v_next_round_matches - v_next_idx;
        END IF;
      END IF;
    END;
  END LOOP;

  -- Reconstruir el array de matches con los actualizados
  v_matches := '[]'::jsonb;
  FOR i IN 0..jsonb_array_length(v_tournament.matches)-1 LOOP
    DECLARE
      v_old_match jsonb := v_tournament.matches->i;
      v_old_round int := (v_old_match->>'round')::int;
    BEGIN
      IF v_old_round = p_round_number + 1 THEN
        -- Usar el match actualizado de next_round_matches
        DECLARE
          v_idx int := -1;
        BEGIN
          FOR j IN 0..jsonb_array_length(v_next_round_matches)-1 LOOP
            IF (v_next_round_matches->j->>'id') = (v_old_match->>'id') THEN
              v_idx := j;
              EXIT;
            END IF;
          END LOOP;
          IF v_idx >= 0 THEN
            v_matches := v_matches || v_next_round_matches->v_idx;
          ELSE
            v_matches := v_matches || v_old_match;
          END IF;
        END;
      ELSE
        v_matches := v_matches || v_old_match;
      END IF;
    END;
  END LOOP;

  -- Actualizar el torneo
  UPDATE public.tournaments
     SET matches = v_matches
   WHERE token = p_token;

  -- Si es la última ronda y está completa, marcar como finished
  DECLARE
    v_final_round int;
    v_final_matches jsonb;
    v_all_complete boolean := true;
  BEGIN
    -- Encontrar la ronda máxima
    v_final_round := 0;
    FOR i IN 0..jsonb_array_length(v_matches)-1 LOOP
      IF (v_matches->i->>'round')::int > v_final_round THEN
        v_final_round := (v_matches->i->>'round')::int;
      END IF;
    END LOOP;

    -- Verificar si todos los matches de la ronda final están completos
    v_final_matches := '[]'::jsonb;
    FOR i IN 0..jsonb_array_length(v_matches)-1 LOOP
      IF (v_matches->i->>'round')::int = v_final_round THEN
        v_final_matches := v_final_matches || v_matches->i;
      END IF;
    END LOOP;

    FOR i IN 0..jsonb_array_length(v_final_matches)-1 LOOP
      IF (v_final_matches->i->>'status') != 'completed' THEN
        v_all_complete := false;
        EXIT;
      END IF;
    END LOOP;

    IF v_all_complete AND jsonb_array_length(v_final_matches) = 1 THEN
      UPDATE public.tournaments
         SET status = 'finished'
       WHERE token = p_token;
    END IF;
  END;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.advance_bracket_round_rpc(text, int)
  TO anon, authenticated;

-- ============================================================
-- F) Actualizar get_tournament_by_token para nueva estructura
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_tournament_by_token(p_token text)
RETURNS SETOF public.tournaments
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.tournaments
  WHERE token = p_token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_tournament_by_token(text) TO anon, authenticated;

-- ============================================================
-- G) Limpiar RPCs viejas que ya no se usan
-- ============================================================

DROP FUNCTION IF EXISTS public.get_duel_votes_by_token(text);
DROP FUNCTION IF EXISTS public.has_voted_in_duel(text, text, text);
DROP FUNCTION IF EXISTS public.submit_duel_vote_rpc(text, text, text, text, text);

-- ============================================================
-- SMOKE TESTS (opcionales, correr uno por uno desde el editor):
--
-- 1) Verificar nuevas columnas:
-- SELECT column_name, data_type
--   FROM information_schema.columns
--  WHERE table_schema = 'public'
--    AND table_name = 'tournaments'
--    AND column_name IN ('mode', 'has_score', 'matches', 'status');
-- Esperado: 4 filas.
--
-- 2) Verificar que las columnas viejas no existen:
-- SELECT column_name
--   FROM information_schema.columns
--  WHERE table_schema = 'public'
--    AND table_name = 'tournaments'
--    AND column_name IN ('bracket', 'votes_to_win');
-- Esperado: 0 filas.
--
-- 3) Verificar que duel_votes no existe:
-- SELECT table_name
--   FROM information_schema.tables
--  WHERE table_schema = 'public'
--    AND table_name = 'duel_votes';
-- Esperado: 0 filas.
--
-- 4) Verificar las nuevas RPCs:
-- SELECT proname
--   FROM pg_proc
--  WHERE pronamespace = 'public'::regnamespace
--    AND proname IN (
--      'update_match_result_rpc',
--      'advance_bracket_round_rpc'
--    );
-- Esperado: 2 filas.
-- ============================================================

-- ============================================================
-- FIN
-- ============================================================
