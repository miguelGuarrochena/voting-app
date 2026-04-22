-- ============================================================
-- PICKLY — Privacy migration
-- Ejecutar en Supabase SQL Editor (una sola vez)
-- Idempotente: se puede correr varias veces sin romper nada
-- ============================================================

-- ------------------------------------------------------------
-- PASO A — Borrar TODAS las policies previas (viejas y nuevas)
-- Así la migración es 100% idempotente: se puede correr N veces.
-- ------------------------------------------------------------
-- Viejas (versión permisiva inicial)
DROP POLICY IF EXISTS public_all    ON public.polls;
DROP POLICY IF EXISTS public_all    ON public.tournaments;
DROP POLICY IF EXISTS public_all    ON public.poll_responses;
DROP POLICY IF EXISTS public_all    ON public.duel_votes;

-- Nuevas (por si una corrida previa las dejó a medias)
DROP POLICY IF EXISTS polls_insert  ON public.polls;
DROP POLICY IF EXISTS polls_delete  ON public.polls;
DROP POLICY IF EXISTS tourn_insert  ON public.tournaments;
DROP POLICY IF EXISTS tourn_update  ON public.tournaments;
DROP POLICY IF EXISTS tourn_delete  ON public.tournaments;
DROP POLICY IF EXISTS resp_insert   ON public.poll_responses;
DROP POLICY IF EXISTS resp_update   ON public.poll_responses;
DROP POLICY IF EXISTS duel_insert   ON public.duel_votes;
DROP POLICY IF EXISTS duel_update   ON public.duel_votes;

-- ------------------------------------------------------------
-- PASO B — Asegurar RLS activo en todas las tablas
-- ------------------------------------------------------------
ALTER TABLE public.polls          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duel_votes     ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- PASO C — Policies de escritura
-- (al no existir policy de SELECT, NADIE puede hacer SELECT directo
--  con la anon key: ni listar, ni leer una fila. Solo via RPC.)
-- ------------------------------------------------------------

-- polls: permitir crear y borrar (quien tiene el token)
CREATE POLICY polls_insert ON public.polls
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY polls_delete ON public.polls
  FOR DELETE TO anon, authenticated
  USING (true);

-- tournaments: crear, actualizar el bracket, borrar
CREATE POLICY tourn_insert ON public.tournaments
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY tourn_update ON public.tournaments
  FOR UPDATE TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY tourn_delete ON public.tournaments
  FOR DELETE TO anon, authenticated
  USING (true);

-- poll_responses: upsert (insert + update on conflict)
CREATE POLICY resp_insert ON public.poll_responses
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY resp_update ON public.poll_responses
  FOR UPDATE TO anon, authenticated
  USING (true) WITH CHECK (true);

-- duel_votes: upsert
CREATE POLICY duel_insert ON public.duel_votes
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY duel_update ON public.duel_votes
  FOR UPDATE TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- PASO D — RPC functions (reads con SECURITY DEFINER)
-- Estas son las ÚNICAS formas de leer datos. Cada una exige token.
-- ------------------------------------------------------------

-- Trae un poll por token (solo si no expiró)
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

-- Trae un tournament por token
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

-- Trae las responses de un poll
CREATE OR REPLACE FUNCTION public.get_poll_responses_by_token(p_token text)
RETURNS SETOF public.poll_responses
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.poll_responses
  WHERE poll_token = p_token;
$$;

-- Trae los votos de duelos de un torneo
CREATE OR REPLACE FUNCTION public.get_duel_votes_by_token(p_token text)
RETURNS SETOF public.duel_votes
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.duel_votes
  WHERE tournament_token = p_token;
$$;

-- Chequea si un usuario ya votó en un duelo específico
CREATE OR REPLACE FUNCTION public.has_voted_in_duel(
  p_token   text,
  p_duel_id text,
  p_username text
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.duel_votes
    WHERE tournament_token = p_token
      AND duel_id          = p_duel_id
      AND username         = p_username
  );
$$;

-- ------------------------------------------------------------
-- PASO E — Permitir que anon y authenticated puedan ejecutar las RPCs
-- ------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.get_poll_by_token(text)             TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_tournament_by_token(text)       TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_poll_responses_by_token(text)   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_duel_votes_by_token(text)       TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_voted_in_duel(text, text, text) TO anon, authenticated;

-- ============================================================
-- FIN de la migración
--
-- Después de correr esto:
--   ✔ Nadie puede hacer SELECT directo en las 4 tablas
--   ✔ INSERTs y UPDATEs siguen funcionando (crear, votar, upsert)
--   ✔ Las lecturas solo pasan por las 5 RPC functions, que exigen token
--
-- SIGUIENTE PASO: refactorizar src/lib/db.ts para usar supabase.rpc(...)
-- en vez de supabase.from(...).select(...). Ver plan en AUDITORIA_voting-app.md
-- ============================================================
