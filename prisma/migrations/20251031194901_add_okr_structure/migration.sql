-- AlterTable
ALTER TABLE "OperationalInsight" ADD COLUMN "goalType" TEXT DEFAULT 'qualitative';

-- CreateTable
CREATE TABLE "KeyResult" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "targetValue" TEXT,
    "progressValue" TEXT,
    "unit" TEXT DEFAULT 'unit',
    "weight" INTEGER DEFAULT 100,
    "quarterSprintId" INTEGER,
    "operationalGoalId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KeyResult_quarterSprintId_fkey" FOREIGN KEY ("quarterSprintId") REFERENCES "QuarterSprint" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "KeyResult_operationalGoalId_fkey" FOREIGN KEY ("operationalGoalId") REFERENCES "OperationalInsight" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

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
    "amount" INTEGER NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BudgetRequest_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BudgetRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "MarketingUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BudgetRequest_quarterSprintId_fkey" FOREIGN KEY ("quarterSprintId") REFERENCES "QuarterSprint" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BudgetRequest_keyResultId_fkey" FOREIGN KEY ("keyResultId") REFERENCES "KeyResult" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_BudgetRequest" ("amount", "createdAt", "dueDate", "fiscalYearId", "id", "notes", "requesterId", "status", "title", "updatedAt") SELECT "amount", "createdAt", "dueDate", "fiscalYearId", "id", "notes", "requesterId", "status", "title", "updatedAt" FROM "BudgetRequest";
DROP TABLE "BudgetRequest";
ALTER TABLE "new_BudgetRequest" RENAME TO "BudgetRequest";
CREATE INDEX "BudgetRequest_status_dueDate_idx" ON "BudgetRequest"("status", "dueDate");
CREATE INDEX "BudgetRequest_quarterSprintId_idx" ON "BudgetRequest"("quarterSprintId");
CREATE INDEX "BudgetRequest_keyResultId_idx" ON "BudgetRequest"("keyResultId");
CREATE TABLE "new_Campaign" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "fiscalYearId" INTEGER NOT NULL,
    "channelId" INTEGER NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "quarterSprintId" INTEGER,
    "goal" TEXT,
    "keyResultId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Campaign_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Campaign_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "MarketingChannel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Campaign_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "MarketingUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Campaign_quarterSprintId_fkey" FOREIGN KEY ("quarterSprintId") REFERENCES "QuarterSprint" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Campaign_keyResultId_fkey" FOREIGN KEY ("keyResultId") REFERENCES "KeyResult" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Campaign" ("channelId", "createdAt", "fiscalYearId", "goal", "id", "name", "ownerId", "quarterSprintId", "status", "updatedAt") SELECT "channelId", "createdAt", "fiscalYearId", "goal", "id", "name", "ownerId", "quarterSprintId", "status", "updatedAt" FROM "Campaign";
DROP TABLE "Campaign";
ALTER TABLE "new_Campaign" RENAME TO "Campaign";
CREATE INDEX "Campaign_quarterSprintId_idx" ON "Campaign"("quarterSprintId");
CREATE INDEX "Campaign_keyResultId_idx" ON "Campaign"("keyResultId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "KeyResult_quarterSprintId_idx" ON "KeyResult"("quarterSprintId");

-- CreateIndex
CREATE INDEX "KeyResult_operationalGoalId_idx" ON "KeyResult"("operationalGoalId");
