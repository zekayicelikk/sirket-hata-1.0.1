/*
  Warnings:

  - You are about to drop the column `closeDescription` on the `GeneralFault` table. All the data in the column will be lost.
  - You are about to drop the column `closedAt` on the `GeneralFault` table. All the data in the column will be lost.
  - You are about to drop the column `closedById` on the `GeneralFault` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `GeneralFault` table. All the data in the column will be lost.
  - You are about to drop the column `closeDescription` on the `Record` table. All the data in the column will be lost.
  - You are about to drop the column `closedAt` on the `Record` table. All the data in the column will be lost.
  - You are about to drop the column `closedById` on the `Record` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Record` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "GeneralFault" DROP CONSTRAINT "GeneralFault_closedById_fkey";

-- DropForeignKey
ALTER TABLE "Record" DROP CONSTRAINT "Record_closedById_fkey";

-- AlterTable
ALTER TABLE "GeneralFault" DROP COLUMN "closeDescription",
DROP COLUMN "closedAt",
DROP COLUMN "closedById",
DROP COLUMN "status",
ADD COLUMN     "duration" TEXT;

-- AlterTable
ALTER TABLE "Record" DROP COLUMN "closeDescription",
DROP COLUMN "closedAt",
DROP COLUMN "closedById",
DROP COLUMN "status",
ADD COLUMN     "duration" TEXT;
