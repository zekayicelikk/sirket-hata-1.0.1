-- DropForeignKey
ALTER TABLE "ActionLog" DROP CONSTRAINT "ActionLog_generalFaultId_fkey";

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_generalFaultId_fkey";

-- DropForeignKey
ALTER TABLE "GeneralFaultLines" DROP CONSTRAINT "GeneralFaultLines_generalFaultId_fkey";

-- AddForeignKey
ALTER TABLE "GeneralFaultLines" ADD CONSTRAINT "GeneralFaultLines_generalFaultId_fkey" FOREIGN KEY ("generalFaultId") REFERENCES "GeneralFault"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_generalFaultId_fkey" FOREIGN KEY ("generalFaultId") REFERENCES "GeneralFault"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionLog" ADD CONSTRAINT "ActionLog_generalFaultId_fkey" FOREIGN KEY ("generalFaultId") REFERENCES "GeneralFault"("id") ON DELETE CASCADE ON UPDATE CASCADE;
