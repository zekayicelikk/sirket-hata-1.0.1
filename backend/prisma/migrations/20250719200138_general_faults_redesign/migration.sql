/*
  Warnings:

  - You are about to drop the column `closedAt` on the `GeneralFault` table. All the data in the column will be lost.
  - You are about to drop the column `downtimeMinutes` on the `GeneralFault` table. All the data in the column will be lost.
  - You are about to drop the column `importance` on the `GeneralFault` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `GeneralFault` table. All the data in the column will be lost.
  - You are about to drop the `ProductionStop` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `productionImpact` on table `GeneralFault` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ProductionStop" DROP CONSTRAINT "ProductionStop_generalFaultId_fkey";

-- AlterTable
ALTER TABLE "GeneralFault" DROP COLUMN "closedAt",
DROP COLUMN "downtimeMinutes",
DROP COLUMN "importance",
DROP COLUMN "status",
ALTER COLUMN "productionImpact" SET NOT NULL;

-- DropTable
DROP TABLE "ProductionStop";

-- CreateTable
CREATE TABLE "Line" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT,

    CONSTRAINT "Line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneralFaultLines" (
    "id" SERIAL NOT NULL,
    "generalFaultId" INTEGER NOT NULL,
    "lineId" INTEGER NOT NULL,
    "downtimeMin" INTEGER,

    CONSTRAINT "GeneralFaultLines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Line_code_key" ON "Line"("code");

-- AddForeignKey
ALTER TABLE "GeneralFaultLines" ADD CONSTRAINT "GeneralFaultLines_generalFaultId_fkey" FOREIGN KEY ("generalFaultId") REFERENCES "GeneralFault"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralFaultLines" ADD CONSTRAINT "GeneralFaultLines_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "Line"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
