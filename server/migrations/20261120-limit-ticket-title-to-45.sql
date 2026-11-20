UPDATE "tickets"
SET "titulo" = LEFT("titulo", 45)
WHERE "titulo" IS NOT NULL
  AND LENGTH("titulo") > 45;

ALTER TABLE "tickets"
  ALTER COLUMN "titulo" TYPE VARCHAR(45);
