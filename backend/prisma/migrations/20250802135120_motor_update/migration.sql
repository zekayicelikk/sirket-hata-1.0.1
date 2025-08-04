-- AlterTable
ALTER TABLE "Motor" ADD COLUMN "type" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GeneralFaultLines" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "generalFaultId" INTEGER NOT NULL,
    "lineId" INTEGER NOT NULL,
    "downtimeMin" INTEGER,
    CONSTRAINT "GeneralFaultLines_generalFaultId_fkey" FOREIGN KEY ("generalFaultId") REFERENCES "GeneralFault" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GeneralFaultLines_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "Line" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_GeneralFaultLines" ("downtimeMin", "generalFaultId", "id", "lineId") SELECT "downtimeMin", "generalFaultId", "id", "lineId" FROM "GeneralFaultLines";
DROP TABLE "GeneralFaultLines";
ALTER TABLE "new_GeneralFaultLines" RENAME TO "GeneralFaultLines";
CREATE TABLE "new_Record" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "motorId" INTEGER NOT NULL,
    "faultTypeId" INTEGER NOT NULL,
    "desc" TEXT NOT NULL,
    "duration" INTEGER,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productionImpact" BOOLEAN,
    "line" TEXT,
    "downtimeMinutes" INTEGER,
    "status" TEXT,
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Record_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Record_motorId_fkey" FOREIGN KEY ("motorId") REFERENCES "Motor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Record_faultTypeId_fkey" FOREIGN KEY ("faultTypeId") REFERENCES "FaultType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Record" ("closedAt", "createdAt", "date", "desc", "downtimeMinutes", "duration", "faultTypeId", "id", "line", "motorId", "productionImpact", "status", "userId") SELECT "closedAt", "createdAt", "date", "desc", "downtimeMinutes", "duration", "faultTypeId", "id", "line", "motorId", "productionImpact", "status", "userId" FROM "Record";
DROP TABLE "Record";
ALTER TABLE "new_Record" RENAME TO "Record";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
