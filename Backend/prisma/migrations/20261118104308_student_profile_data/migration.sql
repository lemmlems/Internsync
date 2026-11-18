-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN "barangay" TEXT;
ALTER TABLE "StudentProfile" ADD COLUMN "city" TEXT;
ALTER TABLE "StudentProfile" ADD COLUMN "contactNumber" TEXT;
ALTER TABLE "StudentProfile" ADD COLUMN "ojtPeriod" TEXT;
ALTER TABLE "StudentProfile" ADD COLUMN "partnerCompany" TEXT;
ALTER TABLE "StudentProfile" ADD COLUMN "postalCode" TEXT;
ALTER TABLE "StudentProfile" ADD COLUMN "province" TEXT;
ALTER TABLE "StudentProfile" ADD COLUMN "streetAddress" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "middleName" TEXT;
