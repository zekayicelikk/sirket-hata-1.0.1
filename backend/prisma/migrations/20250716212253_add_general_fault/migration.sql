-- CreateTable
CREATE TABLE "GeneralFault" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneralFault_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GeneralFault" ADD CONSTRAINT "GeneralFault_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
