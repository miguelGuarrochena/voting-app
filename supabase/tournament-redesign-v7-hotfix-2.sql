-- ============================================================
-- PICKLY — Hotfix #2 del rediseño v7 (Versus)
-- Ejecutar en Supabase SQL Editor (una sola vez).
-- Idempotente: se puede correr N veces sin romper nada.
--
-- MOTIVACIÓN:
--   La tabla tournaments todavía tiene la columna `options` (jsonb,
--   NOT NULL) heredada del modelo viejo donde los torneos eran tipo
--   poll y se votaba sobre opciones. El rediseño v7 reemplazó eso
--   por matches + mode + has_score, pero olvidó dropear `options`.
--
--   Resultado: cualquier INSERT a tournaments revienta con
--   "null value in column 'options' of relation 'tournaments'
--    violates not-null constraint". El cliente Supabase a veces
--   serializa ese error con propiedades no enumerables, así que
--   en consola sale '{}' vacío.
--
-- CAMBIO:
--   DROP COLUMN IF EXISTS options
-- ============================================================

ALTER TABLE public.tournaments
  DROP COLUMN IF EXISTS options;

-- ============================================================
-- SMOKE TEST:
--
-- SELECT column_name FROM information_schema.columns
--  WHERE table_schema = 'public'
--    AND table_name = 'tournaments'
--    AND column_name = 'options';
-- Esperado: 0 filas.
-- ============================================================
