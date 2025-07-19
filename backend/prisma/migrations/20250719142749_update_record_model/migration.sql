/*
  Warnings:

  - The `duration` column on the `GeneralFault` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `duration` column on the `Record` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[productionStopId]` on the table `GeneralFault` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "GeneralFault" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "downtimeMinutes" INTEGER,
ADD COLUMN     "equipmentId" INTEGER,
ADD COLUMN     "equipmentType" TEXT,
ADD COLUMN     "importance" TEXT,
ADD COLUMN     "line" TEXT,
ADD COLUMN     "productionImpact" BOOLEAN,
ADD COLUMN     "productionStopId" INTEGER,
ADD COLUMN     "status" TEXT,
DROP COLUMN "duration",
ADD COLUMN     "duration" INTEGER;

-- AlterTable
ALTER TABLE "Record" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "downtimeMinutes" INTEGER,
ADD COLUMN     "line" TEXT,
ADD COLUMN     "productionImpact" BOOLEAN,
ADD COLUMN     "status" TEXT,
DROP COLUMN "duration",
ADD COLUMN     "duration" INTEGER;

-- CreateTable
CREATE TABLE "ProductionStop" (
    "id" SERIAL NOT NULL,
    "line" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "faultId" INTEGER,

    CONSTRAINT "ProductionStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "generalFaultId" INTEGER,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionLog" (
    "id" SERIAL NOT NULL,
    "generalFaultId" INTEGER,
    "userId" INTEGER,
    "actionType" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductionStop_faultId_key" ON "ProductionStop"("faultId");

-- CreateIndex
CREATE UNIQUE INDEX "GeneralFault_productionStopId_key" ON "GeneralFault"("productionStopId");

-- AddForeignKey
ALTER TABLE "ProductionStop" ADD CONSTRAINT "ProductionStop_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionStop" ADD CONSTRAINT "ProductionStop_faultId_fkey" FOREIGN KEY ("faultId") REFERENCES "GeneralFault"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_generalFaultId_fkey" FOREIGN KEY ("generalFaultId") REFERENCES "GeneralFault"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionLog" ADD CONSTRAINT "ActionLog_generalFaultId_fkey" FOREIGN KEY ("generalFaultId") REFERENCES "GeneralFault"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionLog" ADD CONSTRAINT "ActionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
