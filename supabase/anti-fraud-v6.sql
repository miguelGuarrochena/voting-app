-- ============================================================
-- PICKLY — Anti-fraud stack v6
--
-- Agrega:
--   1) Tabla rate_limits: cuenta intentos por (ip_hash, scope, resource_token)
--      en buckets de 1 minuto. Usada para bloquear spam de votos desde un mismo IP.
--   2) RPC check_and_bump_rate_limit_rpc: increment-and-check atómico.
--   3) Versión nueva de submit_response_rpc que recibe ip_hash y aplica el guard.
--   4) RPC nueva submit_duel_vote_rpc (antes el voto en duel_votes era directo
--      al cliente, sin guard, vulnerable a fraude).
--   5) Cierra las policies abiertas de duel_votes (insert/update con USING true).
--   6) pg_cron job para limpiar rate_limits de hace > 1 hora (no necesitamos histórico).
--
-- Modelo:
--   - El cliente no llama estas RPCs directo. Lo hace via /api/submit/* (Next.js
--     edge route) que: a) valida Turnstile, b) extrae x-forwarded-for y hashea,
--     c) llama a la RPC pasando p_ip_hash.
--   - Si rate limit excedido → la RPC tira `rate_limited` (P0001).
--   - El edge route convierte el error en HTTP 429.
--
-- Limites por defecto (ajustables):
--   - Por minuto: 20 votos / IP / poll. Cubre "oficina entera vota desde el WiFi".
--   - Por hora: 60 votos / IP / poll. Cubre escuela / familia extendida.
--
-- IDEMPOTENTE: se puede correr N veces sin romper nada.
-- ============================================================


-- ------------------------------------------------------------
-- A) Tabla rate_limits
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_limits (
  ip_hash         text        NOT NULL,
  scope           text        NOT NULL, -- 'poll_response' | 'duel_vote'
  resource_token  text        NOT NULL, -- poll_token o tournament_token
  bucket_start    timestamptz NOT NULL, -- minuto truncado (date_trunc('minute', now()))
  count           int         NOT NULL DEFAULT 0,
  PRIMARY KEY (ip_hash, scope, resource_token, bucket_start)
);

-- Índice para limpiar buckets viejos rápido
CREATE INDEX IF NOT EXISTS rate_limits_bucket_idx
  ON public.rate_limits (bucket_start);

-- RLS: nadie puede leer ni escribir esta tabla via anon/auth.
-- Solo las RPCs SECURITY DEFINER tocan acá.
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- (no creamos policies → todos los accesos directos quedan denied)


-- ------------------------------------------------------------
-- B) check_and_bump_rate_limit_rpc
--    Atomic: incrementa el bucket actual, verifica los últimos N
--    minutos, devuelve true si OK, false si excedió límite.
--
--    Limites hardcoded (para cambiar, editar acá y reapply):
--      - 20 / minuto / IP / resource
--      - 60 / hora   / IP / resource
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_and_bump_rate_limit_rpc(
  p_ip_hash       text,
  p_scope         text,
  p_resource_token text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now           timestamptz := now();
  v_bucket_minute timestamptz := date_trunc('minute', v_now);
  v_count_minute  int;
  v_count_hour    int;
  c_limit_minute  CONSTANT int := 20;
  c_limit_hour    CONSTANT int := 60;
BEGIN
  -- Si no nos pasaron ip_hash (fallback dev / sin proxy), permitir pero
  -- no contar — no podemos hacer rate limit confiable sin IP.
  IF p_ip_hash IS NULL OR length(p_ip_hash) = 0 THEN
    RETURN true;
  END IF;

  -- 1) Incrementar (o crear) el bucket del minuto actual.
  INSERT INTO public.rate_limits (ip_hash, scope, resource_token, bucket_start, count)
  VALUES (p_ip_hash, p_scope, p_resource_token, v_bucket_minute, 1)
  ON CONFLICT (ip_hash, scope, resource_token, bucket_start)
  DO UPDATE SET count = public.rate_limits.count + 1;

  -- 2) Sumar los buckets del último minuto y de la última hora.
  SELECT COALESCE(SUM(count), 0)
    INTO v_count_minute
    FROM public.rate_limits
   WHERE ip_hash         = p_ip_hash
     AND scope           = p_scope
     AND resource_token  = p_resource_token
     AND bucket_start   >= v_now - interval '1 minute';

  SELECT COALESCE(SUM(count), 0)
    INTO v_count_hour
    FROM public.rate_limits
   WHERE ip_hash         = p_ip_hash
     AND scope           = p_scope
     AND resource_token  = p_resource_token
     AND bucket_start   >= v_now - interval '1 hour';

  -- 3) Verdadero si está dentro de los dos límites.
  RETURN (v_count_minute <= c_limit_minute) AND (v_count_hour <= c_limit_hour);
END;
$$;

-- Solo accesible vía las RPCs de submit (mismo schema). No la exponemos al
-- cliente directo — pero Supabase requiere GRANT para que puedan llamarse
-- entre sí. Lo dejamos a anon, que es como llegan los requests del edge.
GRANT EXECUTE ON FUNCTION
  public.check_and_bump_rate_limit_rpc(text, text, text) TO anon, authenticated;


-- ------------------------------------------------------------
-- C) submit_response_rpc — extendida con ip_hash + rate limit
--
--    Mantiene la firma vieja (3 args) creando un overload, así no
--    rompe llamadas legacy que pueda haber. Las nuevas llamadas usan
--    la firma de 4 args.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_response_rpc(
  p_token    text,
  p_username text,
  p_response jsonb,
  p_ip_hash  text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_poll public.polls%ROWTYPE;
  v_ok   boolean;
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

  -- Rate limit (no-op si p_ip_hash es null/empty).
  v_ok := public.check_and_bump_rate_limit_rpc(p_ip_hash, 'poll_response', p_token);
  IF NOT v_ok THEN
    RAISE EXCEPTION 'rate_limited' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.poll_responses (poll_token, username, response)
  VALUES (p_token, p_username, p_response)
  ON CONFLICT (poll_token, username)
  DO UPDATE SET response = EXCLUDED.response;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION
  public.submit_response_rpc(text, text, jsonb, text) TO anon, authenticated;


-- ------------------------------------------------------------
-- D) submit_duel_vote_rpc — NUEVA, reemplaza el INSERT directo.
--
--    Antes el cliente hacía supabase.from('duel_votes').upsert(...) bajo
--    una policy abierta. Ahora pasamos por una RPC con guard.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_duel_vote_rpc(
  p_tournament_token text,
  p_duel_id          text,
  p_username         text,
  p_option_id        text,
  p_ip_hash          text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ok boolean;
BEGIN
  IF p_username IS NULL OR length(trim(p_username)) = 0 THEN
    RAISE EXCEPTION 'empty_username' USING ERRCODE = 'P0001';
  END IF;
  IF p_duel_id IS NULL OR length(p_duel_id) = 0 THEN
    RAISE EXCEPTION 'empty_duel_id' USING ERRCODE = 'P0001';
  END IF;
  IF p_option_id IS NULL OR length(p_option_id) = 0 THEN
    RAISE EXCEPTION 'empty_option_id' USING ERRCODE = 'P0001';
  END IF;

  -- Existe el torneo?
  IF NOT EXISTS (SELECT 1 FROM public.tournaments WHERE token = p_tournament_token) THEN
    RAISE EXCEPTION 'tournament_not_found' USING ERRCODE = 'P0002';
  END IF;

  -- Rate limit por (ip, tournament).
  v_ok := public.check_and_bump_rate_limit_rpc(p_ip_hash, 'duel_vote', p_tournament_token);
  IF NOT v_ok THEN
    RAISE EXCEPTION 'rate_limited' USING ERRCODE = 'P0001';
  END IF;

  -- Upsert del voto. Confirmado en src/lib/db.ts:
  --   onConflict: 'tournament_token,duel_id,username'
  INSERT INTO public.duel_votes (tournament_token, duel_id, username, option_id)
  VALUES (p_tournament_token, p_duel_id, p_username, p_option_id)
  ON CONFLICT (tournament_token, duel_id, username)
  DO UPDATE SET option_id = EXCLUDED.option_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION
  public.submit_duel_vote_rpc(text, text, text, text, text) TO anon, authenticated;


-- ------------------------------------------------------------
-- E) Cerrar las policies abiertas de duel_votes
--    (mismo principio que el hotfix de delete: ahora todo va vía RPC).
-- ------------------------------------------------------------
DROP POLICY IF EXISTS duel_insert ON public.duel_votes;
DROP POLICY IF EXISTS duel_update ON public.duel_votes;


-- ------------------------------------------------------------
-- F) pg_cron — limpiar buckets viejos
--    No necesitamos histórico de rate limits. Solo el último 1h matters.
--    Borramos buckets de hace > 2 horas (margen).
-- ------------------------------------------------------------
DO $$
BEGIN
  PERFORM cron.unschedule('pickly_purge_rate_limits');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'pickly_purge_rate_limits',
  '*/15 * * * *',  -- cada 15 minutos
  $CRON$
    DELETE FROM public.rate_limits
     WHERE bucket_start < now() - interval '2 hours';
  $CRON$
);


-- ============================================================
-- SMOKE TESTS (correr de a uno):
--
-- 1) Verificar que la tabla rate_limits existe y tiene RLS:
-- SELECT relname, relrowsecurity
--   FROM pg_class
--  WHERE relname = 'rate_limits';
-- Esperado: 1 fila, relrowsecurity=t.
--
-- 2) Verificar que las RPCs nuevas existen y son SECDEFINER:
-- SELECT proname, prosecdef
--   FROM pg_proc
--  WHERE pronamespace = 'public'::regnamespace
--    AND proname IN (
--      'check_and_bump_rate_limit_rpc',
--      'submit_response_rpc',
--      'submit_duel_vote_rpc'
--    );
-- Esperado: 3+ filas, prosecdef=t.
--
-- 3) Test del rate limit (correr 21 veces para excederlo):
-- SELECT public.check_and_bump_rate_limit_rpc('test_ip', 'poll_response', 'tok');
-- Las primeras 20 → true. La 21 → false.
-- Después: DELETE FROM rate_limits WHERE ip_hash='test_ip';
--
-- 4) Verificar que duel_votes ya NO tiene policies de insert/update abiertas:
-- SELECT policyname, cmd
--   FROM pg_policies
--  WHERE schemaname='public' AND tablename='duel_votes' AND cmd IN ('INSERT','UPDATE');
-- Esperado: 0 filas.
--
-- 5) Verificar que el cron job está agendado:
-- SELECT jobname, schedule FROM cron.job WHERE jobname='pickly_purge_rate_limits';
-- ============================================================
