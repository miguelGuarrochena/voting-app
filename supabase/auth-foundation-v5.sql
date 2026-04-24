-- ============================================================
-- PICKLY — Migration v5: auth foundation (user_id + claim flow)
-- Ejecutar en Supabase SQL Editor (una sola vez).
-- Idempotente: se puede correr N veces sin romper nada.
--
-- CONTEXTO:
--   Hasta acá Pickly funcionó 100% sin cuentas: el token del link
--   era la "capability". Para el post-launch queremos permitir que
--   los creadores se logueen (Google / Magic Link / email+password)
--   como atajo útil, SIN romper el flujo anónimo.
--
-- DECISIONES:
--   - Login OPCIONAL. Crear/votar sin login sigue andando.
--   - polls.user_id nullable. Si NULL = anónimo, si no = dueño.
--   - Trigger BEFORE INSERT autoseta user_id = auth.uid() cuando
--     el request viene con JWT válido (no hay que tocar el front).
--   - claim_polls_rpc permite adoptar tokens creados antes del
--     login. Solo los que están huérfanos (user_id IS NULL).
--   - get_my_polls_rpc / get_my_tournaments_rpc para el listado
--     cross-device del usuario logueado.
--
-- NO CAMBIA:
--   - RLS policies existentes (polls_insert / polls_delete / etc.)
--   - get_poll_by_token sigue trayendo por token para cualquiera.
--   - submit_response_rpc sigue siendo abierto (el token es el
--     capability para votar).
-- ============================================================


-- ============================================================
-- A) COLUMNA user_id en polls y tournaments
-- ============================================================
ALTER TABLE public.polls
  ADD COLUMN IF NOT EXISTS user_id uuid
  REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS user_id uuid
  REFERENCES auth.users(id) ON DELETE SET NULL;

-- Índices para el lookup "mis polls"
CREATE INDEX IF NOT EXISTS polls_user_id_idx
  ON public.polls(user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS tournaments_user_id_idx
  ON public.tournaments(user_id)
  WHERE user_id IS NOT NULL;


-- ============================================================
-- B) Trigger BEFORE INSERT
--    Si el request viene con JWT (user logueado), autoseta
--    user_id = auth.uid(). Si es anon, no toca nada (queda NULL).
--
--    Esto significa que el front NO necesita enterarse del user_id:
--    sigue haciendo supabase.from('polls').insert({...}) como siempre.
--    Si hay sesión, Postgres pega el dueño automáticamente.
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_user_id_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, auth
AS $$
BEGIN
  IF NEW.user_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS polls_set_user_id ON public.polls;
CREATE TRIGGER polls_set_user_id
  BEFORE INSERT ON public.polls
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id_on_insert();

DROP TRIGGER IF EXISTS tournaments_set_user_id ON public.tournaments;
CREATE TRIGGER tournaments_set_user_id
  BEFORE INSERT ON public.tournaments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id_on_insert();


-- ============================================================
-- C) claim_polls_rpc — "reclamar" encuestas huérfanas
--    El front le pasa un array de tokens (los mypolls locales
--    con role='creator') y esta función les estampa el user_id
--    al currentuser, SOLO si están huérfanas (user_id IS NULL).
--    Devuelve cuántas se reclamaron efectivamente.
-- ============================================================
CREATE OR REPLACE FUNCTION public.claim_polls_rpc(p_tokens text[])
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid uuid;
  v_count int;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'P0001';
  END IF;

  IF p_tokens IS NULL OR array_length(p_tokens, 1) IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE public.polls
     SET user_id = v_uid
   WHERE token = ANY(p_tokens)
     AND user_id IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_polls_rpc(text[]) TO authenticated;


-- Versión para torneos (mismo patrón)
CREATE OR REPLACE FUNCTION public.claim_tournaments_rpc(p_tokens text[])
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid uuid;
  v_count int;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'P0001';
  END IF;

  IF p_tokens IS NULL OR array_length(p_tokens, 1) IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE public.tournaments
     SET user_id = v_uid
   WHERE token = ANY(p_tokens)
     AND user_id IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_tournaments_rpc(text[]) TO authenticated;


-- ============================================================
-- D) get_my_polls_rpc / get_my_tournaments_rpc
--    Listado cross-device de las polls del user logueado.
--    Solo para authenticated — anon no tiene sentido acá.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_polls_rpc()
RETURNS SETOF public.polls
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY
    SELECT *
    FROM public.polls
    WHERE user_id = v_uid
    ORDER BY created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_polls_rpc() TO authenticated;


CREATE OR REPLACE FUNCTION public.get_my_tournaments_rpc()
RETURNS SETOF public.tournaments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY
    SELECT *
    FROM public.tournaments
    WHERE user_id = v_uid
    ORDER BY created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_tournaments_rpc() TO authenticated;


-- ============================================================
-- SMOKE TESTS (opcionales, correr uno por uno):
--
-- 1) Verificar columnas user_id:
-- SELECT table_name, column_name, data_type
--   FROM information_schema.columns
--  WHERE table_schema = 'public'
--    AND table_name IN ('polls', 'tournaments')
--    AND column_name = 'user_id';
-- Esperado: 2 filas, uuid.
--
-- 2) Verificar los triggers:
-- SELECT tgname, tgrelid::regclass, tgenabled
--   FROM pg_trigger
--  WHERE tgname IN ('polls_set_user_id', 'tournaments_set_user_id');
-- Esperado: 2 filas, tgenabled = 'O' (habilitados).
--
-- 3) Verificar las RPCs:
-- SELECT proname
--   FROM pg_proc
--  WHERE pronamespace = 'public'::regnamespace
--    AND proname IN (
--      'claim_polls_rpc',
--      'claim_tournaments_rpc',
--      'get_my_polls_rpc',
--      'get_my_tournaments_rpc',
--      'set_user_id_on_insert'
--    );
-- Esperado: 5 filas.
--
-- 4) Probar el flujo anónimo (como anon):
--    - Crear un poll desde la app sin estar logueado.
--    - SELECT token, user_id FROM public.polls ORDER BY created_at DESC LIMIT 1;
--    - Esperado: user_id IS NULL.
--
-- 5) Probar el flujo logueado:
--    - Loguearse en la app.
--    - Crear un poll.
--    - SELECT token, user_id FROM public.polls ORDER BY created_at DESC LIMIT 1;
--    - Esperado: user_id = auth.uid() del logueado.
--
-- 6) Probar claim:
--    - Con un poll huérfano (user_id IS NULL) creado antes del login,
--      desde el SQL editor logueado como ese user:
--      SELECT public.claim_polls_rpc(ARRAY['TOKEN_DEL_POLL']);
--    - Esperado: 1 (una fila reclamada).
--    - Verificar: SELECT user_id FROM public.polls WHERE token = 'TOKEN_DEL_POLL';
-- ============================================================


-- ============================================================
-- FIN de la migración v5
--
-- SIGUIENTES PASOS (fuera de SQL, en Supabase Dashboard):
--   1) Authentication → Providers → habilitar:
--      - Email (ya viene on; confirma que "Enable email confirmations"
--        esté según preferencia; para Magic Link NO hace falta password).
--      - Google: requiere OAuth Client en Google Cloud Console.
--        Callback URL a poner en Google: https://<project>.supabase.co/auth/v1/callback
--   2) Authentication → URL Configuration → Site URL:
--      - Dev:   http://localhost:3000
--      - Prod:  https://pickly.app (o el dominio que uses)
--      - Redirect URLs (allowlist): agregar /auth/callback del host
-- ============================================================
