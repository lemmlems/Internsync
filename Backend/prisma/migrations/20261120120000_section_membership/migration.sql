-- Add optional section membership for student profiles.
ALTER TABLE "StudentProfile" ADD COLUMN "sectionId" TEXT REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "StudentProfile_sectionId_idx" ON "StudentProfile"("sectionId");
