-- Apply with: psql "$DATABASE_URL" -f server/migrations/20261127-normalize-loan-evaluation-state.sql
-- Unify legacy evaluation rows with the initial state.
UPDATE "prestamos"
SET "estado" = 'solicitado'
WHERE "estado"::text = 'en_evaluacion';
