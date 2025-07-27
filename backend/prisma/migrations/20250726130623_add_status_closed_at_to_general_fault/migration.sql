-- AlterTable
ALTER TABLE "GeneralFault" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'open';
