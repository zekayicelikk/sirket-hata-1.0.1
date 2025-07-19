ALTER TABLE "Record" DROP CONSTRAINT IF EXISTS "Record_userId_fkey";
ALTER TABLE "Record" ADD CONSTRAINT "Record_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE;

ALTER TABLE "Record" DROP CONSTRAINT IF EXISTS "Record_faultTypeId_fkey";
ALTER TABLE "Record" ADD CONSTRAINT "Record_faultTypeId_fkey" FOREIGN KEY ("faultTypeId") REFERENCES "FaultType"(id) ON DELETE CASCADE;
