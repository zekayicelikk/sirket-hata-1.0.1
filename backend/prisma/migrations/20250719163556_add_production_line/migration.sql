/*
  Warnings:

  - You are about to drop the column `line` on the `GeneralFault` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "GeneralFault" DROP COLUMN "line";

-- CreateTable
CREATE TABLE "ProductionLine" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ProductionLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FaultLines" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_FaultLines_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductionLine_name_key" ON "ProductionLine"("name");

-- CreateIndex
CREATE INDEX "_FaultLines_B_index" ON "_FaultLines"("B");

-- AddForeignKey
ALTER TABLE "_FaultLines" ADD CONSTRAINT "_FaultLines_A_fkey" FOREIGN KEY ("A") REFERENCES "GeneralFault"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FaultLines" ADD CONSTRAINT "_FaultLines_B_fkey" FOREIGN KEY ("B") REFERENCES "ProductionLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
