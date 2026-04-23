-- ============================================================
-- PICKLY — Migration v3: persistir description + cover_image
-- Ejecutar en Supabase SQL Editor (una sola vez).
-- Idempotente: se puede correr N veces sin romper nada.
--
-- Motivación:
--   El form (CreatePollForm) capturaba description y titleImage
--   pero createPoll() nunca los mandaba a la DB → se perdían.
--   Lo mismo para el form de torneos (versus).
--
-- Cambios:
--   1. polls:       ADD COLUMN description text, cover_image text
--   2. tournaments: ADD COLUMN description text, cover_image text
-- ============================================================

-- ------------------------------------------------------------
-- POLLS
-- ------------------------------------------------------------
ALTER TABLE public.polls
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS cover_image text;

-- ------------------------------------------------------------
-- TOURNAMENTS
-- ------------------------------------------------------------
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS cover_image text;

-- ============================================================
-- NOTA: no hace falta tocar las RPCs (get_poll_by_token /
-- get_tournament_by_token) porque devuelven SETOF de la tabla
-- entera — las columnas nuevas aparecen automáticamente.
--
-- Tampoco hace falta tocar policies: el INSERT y el UPDATE ya
-- están permitidos desde privacy-migration.sql + features-v2.sql.
-- ============================================================

-- SMOKE TEST (opcional, desde SQL editor):
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name   = 'polls'
--   AND column_name  IN ('description', 'cover_image');
-- Esperado: 2 filas, ambas text.

-- ============================================================
-- FIN
-- ============================================================
