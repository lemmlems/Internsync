-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StudentProfile" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "studentNumber" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "contactNumber" TEXT,
    "streetAddress" TEXT,
    "barangay" TEXT,
    "city" TEXT,
    "province" TEXT,
    "postalCode" TEXT,
    "partnerCompany" TEXT,
    "ojtPeriod" TEXT,
    "licensesJson" TEXT NOT NULL DEFAULT '[]',
    "skillsJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentProfile_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_StudentProfile" ("barangay", "city", "contactNumber", "createdAt", "ojtPeriod", "partnerCompany", "postalCode", "programId", "province", "streetAddress", "studentNumber", "updatedAt", "userId") SELECT "barangay", "city", "contactNumber", "createdAt", "ojtPeriod", "partnerCompany", "postalCode", "programId", "province", "streetAddress", "studentNumber", "updatedAt", "userId" FROM "StudentProfile";
DROP TABLE "StudentProfile";
ALTER TABLE "new_StudentProfile" RENAME TO "StudentProfile";
CREATE UNIQUE INDEX "StudentProfile_studentNumber_key" ON "StudentProfile"("studentNumber");
CREATE INDEX "StudentProfile_programId_idx" ON "StudentProfile"("programId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
