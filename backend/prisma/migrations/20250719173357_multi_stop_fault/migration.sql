/*
  Warnings:

  - You are about to drop the column `duration` on the `GeneralFault` table. All the data in the column will be lost.
  - You are about to drop the column `equipmentId` on the `GeneralFault` table. All the data in the column will be lost.
  - You are about to drop the column `equipmentType` on the `GeneralFault` table. All the data in the column will be lost.
  - You are about to drop the column `productionStopId` on the `GeneralFault` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `ProductionStop` table. All the data in the column will be lost.
  - You are about to drop the column `faultId` on the `ProductionStop` table. All the data in the column will be lost.
  - You are about to drop the column `reason` on the `ProductionStop` table. All the data in the column will be lost.
  - You are about to drop the `ProductionLine` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_FaultLines` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `generalFaultId` to the `ProductionStop` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ProductionStop" DROP CONSTRAINT "ProductionStop_createdById_fkey";

-- DropForeignKey
ALTER TABLE "ProductionStop" DROP CONSTRAINT "ProductionStop_faultId_fkey";

-- DropForeignKey
ALTER TABLE "_FaultLines" DROP CONSTRAINT "_FaultLines_A_fkey";

-- DropForeignKey
ALTER TABLE "_FaultLines" DROP CONSTRAINT "_FaultLines_B_fkey";

-- DropIndex
DROP INDEX "GeneralFault_productionStopId_key";

-- DropIndex
DROP INDEX "ProductionStop_faultId_key";

-- AlterTable
ALTER TABLE "GeneralFault" DROP COLUMN "duration",
DROP COLUMN "equipmentId",
DROP COLUMN "equipmentType",
DROP COLUMN "productionStopId",
ALTER COLUMN "location" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ProductionStop" DROP COLUMN "createdById",
DROP COLUMN "faultId",
DROP COLUMN "reason",
ADD COLUMN     "generalFaultId" INTEGER NOT NULL,
ALTER COLUMN "startTime" DROP NOT NULL,
ALTER COLUMN "endTime" DROP NOT NULL;

-- DropTable
DROP TABLE "ProductionLine";

-- DropTable
DROP TABLE "_FaultLines";

-- AddForeignKey
ALTER TABLE "ProductionStop" ADD CONSTRAINT "ProductionStop_generalFaultId_fkey" FOREIGN KEY ("generalFaultId") REFERENCES "GeneralFault"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
