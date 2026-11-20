UPDATE "tickets"
SET "titulo" = LEFT("titulo", 30)
WHERE "titulo" IS NOT NULL
  AND LENGTH("titulo") > 30;

ALTER TABLE "tickets"
  ALTER COLUMN "titulo" TYPE VARCHAR(30);
