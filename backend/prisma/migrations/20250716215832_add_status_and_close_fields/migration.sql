-- AlterTable
ALTER TABLE "GeneralFault" ADD COLUMN     "closeDescription" TEXT,
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "closedById" INTEGER,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'acik';

-- AlterTable
ALTER TABLE "Record" ADD COLUMN     "closeDescription" TEXT,
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "closedById" INTEGER,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'acik';

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralFault" ADD CONSTRAINT "GeneralFault_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
