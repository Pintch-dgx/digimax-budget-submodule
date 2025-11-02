-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BudgetRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "fiscalYearId" INTEGER NOT NULL,
    "requesterId" INTEGER NOT NULL,
    "quarterSprintId" INTEGER,
    "keyResultId" INTEGER,
    "campaignId" INTEGER,
    "amount" INTEGER NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "linkStatus" TEXT NOT NULL DEFAULT 'UNDEFINED_OBJECTIVE',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BudgetRequest_keyResultId_fkey" FOREIGN KEY ("keyResultId") REFERENCES "KeyResult" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BudgetRequest_quarterSprintId_fkey" FOREIGN KEY ("quarterSprintId") REFERENCES "QuarterSprint" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BudgetRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "MarketingUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BudgetRequest_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BudgetRequest_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_BudgetRequest" ("amount", "createdAt", "dueDate", "fiscalYearId", "id", "keyResultId", "notes", "quarterSprintId", "requesterId", "status", "title", "updatedAt") SELECT "amount", "createdAt", "dueDate", "fiscalYearId", "id", "keyResultId", "notes", "quarterSprintId", "requesterId", "status", "title", "updatedAt" FROM "BudgetRequest";
DROP TABLE "BudgetRequest";
ALTER TABLE "new_BudgetRequest" RENAME TO "BudgetRequest";
CREATE INDEX "BudgetRequest_status_dueDate_idx" ON "BudgetRequest"("status", "dueDate");
CREATE INDEX "BudgetRequest_quarterSprintId_idx" ON "BudgetRequest"("quarterSprintId");
CREATE INDEX "BudgetRequest_keyResultId_idx" ON "BudgetRequest"("keyResultId");
CREATE INDEX "BudgetRequest_campaignId_idx" ON "BudgetRequest"("campaignId");
CREATE TABLE "new_KeyResult" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "targetValue" REAL NOT NULL,
    "progressValue" REAL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'unit',
    "weight" INTEGER NOT NULL DEFAULT 100,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "quarterSprintId" INTEGER NOT NULL,
    "ownerId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KeyResult_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "MarketingUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "KeyResult_quarterSprintId_fkey" FOREIGN KEY ("quarterSprintId") REFERENCES "QuarterSprint" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_KeyResult" ("createdAt", "id", "metric", "ownerId", "progressValue", "quarterSprintId", "status", "targetValue", "title", "unit", "updatedAt", "weight") SELECT "createdAt", "id", "metric", "ownerId", "progressValue", "quarterSprintId", "status", "targetValue", "title", "unit", "updatedAt", "weight" FROM "KeyResult";
DROP TABLE "KeyResult";
ALTER TABLE "new_KeyResult" RENAME TO "KeyResult";
CREATE INDEX "KeyResult_quarterSprintId_idx" ON "KeyResult"("quarterSprintId");
CREATE INDEX "KeyResult_ownerId_idx" ON "KeyResult"("ownerId");
CREATE INDEX "KeyResult_status_idx" ON "KeyResult"("status");
CREATE TABLE "new_QuarterSprint" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "shortCode" TEXT,
    "quarter" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "fiscalYearId" INTEGER NOT NULL,
    "objectiveId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "objectiveSummary" TEXT,
    CONSTRAINT "QuarterSprint_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuarterSprint_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_QuarterSprint" ("code", "createdAt", "endDate", "fiscalYearId", "id", "name", "objectiveId", "quarter", "shortCode", "startDate", "updatedAt") SELECT "code", "createdAt", "endDate", "fiscalYearId", "id", "name", "objectiveId", "quarter", "shortCode", "startDate", "updatedAt" FROM "QuarterSprint";
DROP TABLE "QuarterSprint";
ALTER TABLE "new_QuarterSprint" RENAME TO "QuarterSprint";
CREATE UNIQUE INDEX "QuarterSprint_code_key" ON "QuarterSprint"("code");
CREATE INDEX "QuarterSprint_fiscalYearId_idx" ON "QuarterSprint"("fiscalYearId");
CREATE INDEX "QuarterSprint_objectiveId_idx" ON "QuarterSprint"("objectiveId");
CREATE INDEX "QuarterSprint_fiscalYearId_quarter_idx" ON "QuarterSprint"("fiscalYearId", "quarter");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
