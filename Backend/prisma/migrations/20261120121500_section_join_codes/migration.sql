ALTER TABLE "Section" ADD COLUMN "joinCode" TEXT;

UPDATE "Section"
SET "joinCode" =
  substr(lower(hex(randomblob(2))), 1, 3) || '-' ||
  substr(lower(hex(randomblob(2))), 1, 3) || '-' ||
  substr(lower(hex(randomblob(2))), 1, 3);

CREATE UNIQUE INDEX "Section_joinCode_key" ON "Section"("joinCode");
