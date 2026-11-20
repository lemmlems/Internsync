-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programId" TEXT NOT NULL,
    "yearLevel" INTEGER NOT NULL,
    "letter" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Section_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Section_programId_yearLevel_letter_key" ON "Section"("programId", "yearLevel", "letter");

-- CreateIndex
CREATE INDEX "Section_programId_yearLevel_idx" ON "Section"("programId", "yearLevel");
