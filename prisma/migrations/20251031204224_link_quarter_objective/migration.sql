-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_QuarterSprint" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "shortCode" TEXT,
    "objective" TEXT NOT NULL,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "fiscalYearId" INTEGER,
    "objectiveId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QuarterSprint_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "QuarterSprint_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "OperationalInsight" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_QuarterSprint" ("code", "createdAt", "endDate", "fiscalYearId", "id", "name", "objective", "shortCode", "startDate", "updatedAt") SELECT "code", "createdAt", "endDate", "fiscalYearId", "id", "name", "objective", "shortCode", "startDate", "updatedAt" FROM "QuarterSprint";
DROP TABLE "QuarterSprint";
ALTER TABLE "new_QuarterSprint" RENAME TO "QuarterSprint";
CREATE UNIQUE INDEX "QuarterSprint_code_key" ON "QuarterSprint"("code");
CREATE INDEX "QuarterSprint_fiscalYearId_idx" ON "QuarterSprint"("fiscalYearId");
CREATE INDEX "QuarterSprint_objectiveId_idx" ON "QuarterSprint"("objectiveId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
