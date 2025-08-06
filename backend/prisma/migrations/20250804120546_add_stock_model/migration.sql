-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StockUsage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stockId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "usedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generalFaultId" INTEGER,
    "recordId" INTEGER,
    "userId" INTEGER,
    "note" TEXT,
    CONSTRAINT "StockUsage_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StockUsage_generalFaultId_fkey" FOREIGN KEY ("generalFaultId") REFERENCES "GeneralFault" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StockUsage_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "Record" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StockUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_StockUsage" ("amount", "generalFaultId", "id", "note", "recordId", "stockId", "usedAt", "userId") SELECT "amount", "generalFaultId", "id", "note", "recordId", "stockId", "usedAt", "userId" FROM "StockUsage";
DROP TABLE "StockUsage";
ALTER TABLE "new_StockUsage" RENAME TO "StockUsage";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
