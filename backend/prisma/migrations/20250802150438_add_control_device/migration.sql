-- CreateTable
CREATE TABLE "ControlDevice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "serial" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "powerKW" REAL NOT NULL,
    "voltage" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "isSpare" BOOLEAN NOT NULL DEFAULT false,
    "activeMotorId" INTEGER,
    "spareForMotors" TEXT,
    "location" TEXT NOT NULL,
    "protection" TEXT,
    "commProtocol" TEXT,
    "controlType" TEXT,
    "firmware" TEXT,
    "rampUpTime" INTEGER,
    "rampDownTime" INTEGER,
    "bypassContact" BOOLEAN,
    "year" INTEGER,
    "lastService" DATETIME,
    "nextService" DATETIME,
    "notes" TEXT,
    "imageUrl" TEXT,
    "qrCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ControlDevice_activeMotorId_fkey" FOREIGN KEY ("activeMotorId") REFERENCES "Motor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ControlDevice_serial_key" ON "ControlDevice"("serial");
