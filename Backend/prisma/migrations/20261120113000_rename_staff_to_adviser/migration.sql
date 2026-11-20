ALTER TABLE "StaffProfile" RENAME TO "AdviserProfile";
DROP INDEX "StaffProfile_employeeNumber_key";
CREATE UNIQUE INDEX "AdviserProfile_employeeNumber_key" ON "AdviserProfile"("employeeNumber");

ALTER TABLE "StaffInvite" RENAME TO "AdviserInvite";
DROP INDEX "StaffInvite_tokenHash_key";
CREATE UNIQUE INDEX "AdviserInvite_tokenHash_key" ON "AdviserInvite"("tokenHash");
DROP INDEX "StaffInvite_email_expiresAt_idx";
CREATE INDEX "AdviserInvite_email_expiresAt_idx" ON "AdviserInvite"("email", "expiresAt");
