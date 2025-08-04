/*
  Warnings:

  - You are about to alter the column `voltage` on the `Motor` table. The data in that column could be lost. The data in that column will be cast from `String` to `Float`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Motor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "serial" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tag" TEXT,
    "description" TEXT,
    "status" TEXT,
    "location" TEXT,
    "powerKW" REAL,
    "voltage" REAL,
    "current" REAL,
    "phase" INTEGER,
    "manufacturer" TEXT,
    "modelNo" TEXT,
    "year" INTEGER,
    "rpm" INTEGER,
    "protection" TEXT,
    "connectionType" TEXT,
    "lastService" DATETIME,
    "nextService" DATETIME,
    "isActive" BOOLEAN DEFAULT true,
    "qrCode" TEXT,
    "imageUrl" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Motor" ("connectionType", "createdAt", "current", "description", "id", "imageUrl", "isActive", "lastService", "location", "manufacturer", "modelNo", "name", "nextService", "notes", "phase", "powerKW", "protection", "qrCode", "rpm", "serial", "status", "tag", "voltage", "year") SELECT "connectionType", "createdAt", "current", "description", "id", "imageUrl", "isActive", "lastService", "location", "manufacturer", "modelNo", "name", "nextService", "notes", "phase", "powerKW", "protection", "qrCode", "rpm", "serial", "status", "tag", "voltage", "year" FROM "Motor";
DROP TABLE "Motor";
ALTER TABLE "new_Motor" RENAME TO "Motor";
CREATE UNIQUE INDEX "Motor_serial_key" ON "Motor"("serial");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
