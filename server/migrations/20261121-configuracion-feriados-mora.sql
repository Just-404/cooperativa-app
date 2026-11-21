-- Configuración de calendario laboral, feriados e historial de tasa de mora.
-- Aplicar en producción antes de iniciar el servidor:
--   psql "$DATABASE_URL" -f server/migrations/20261121-configuracion-feriados-mora.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  CREATE TYPE "enum_feriados_origen" AS ENUM ('oficial', 'personalizado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "feriados" (
  "id" UUID PRIMARY KEY,
  "anio" INTEGER NOT NULL,
  "nombre" VARCHAR(150) NOT NULL,
  "fecha" DATE NOT NULL,
  "fechaOriginal" DATE,
  "origen" "enum_feriados_origen" NOT NULL DEFAULT 'oficial',
  "movible" BOOLEAN DEFAULT false,
  "tipo" VARCHAR(30),
  "activo" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "feriados_anio_fecha" ON "feriados" ("anio", "fecha");

CREATE TABLE IF NOT EXISTS "configuracion" (
  "id" INTEGER PRIMARY KEY,
  "diasNoLaborables" JSONB NOT NULL DEFAULT '[0, 6]',
  "calendarioDesactualizado" BOOLEAN DEFAULT false,
  "actualizadoPorId" UUID,
  "createdAt" TIMESTAMPTZ NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS "tasas_mora" (
  "id" UUID PRIMARY KEY,
  "tasaDiaria" NUMERIC(8,6) NOT NULL,
  "vigenteDesde" DATE NOT NULL,
  "creadoPorId" UUID,
  "createdAt" TIMESTAMPTZ NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "tasas_mora_vigente_desde" ON "tasas_mora" ("vigenteDesde");

ALTER TABLE "cuotas" ADD COLUMN IF NOT EXISTS "tasaMoraAplicada" NUMERIC(8,6);
ALTER TABLE "pagos" ADD COLUMN IF NOT EXISTS "tasaMoraAplicada" NUMERIC(8,6);

INSERT INTO "configuracion" ("id", "diasNoLaborables", "calendarioDesactualizado", "createdAt", "updatedAt")
VALUES (1, '[0, 6]', false, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "tasas_mora" ("id", "tasaDiaria", "vigenteDesde", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 0.001000, '2000-01-01', NOW(), NOW())
ON CONFLICT ("vigenteDesde") DO NOTHING;
