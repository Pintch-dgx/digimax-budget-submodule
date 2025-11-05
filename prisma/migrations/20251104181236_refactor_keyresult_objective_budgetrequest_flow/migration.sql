/*
  Warnings:

  - You are about to drop the `QuarterSprint` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `quarterSprintId` on the `BudgetAllocation` table. All the data in the column will be lost.
  - You are about to drop the column `keyResultId` on the `BudgetRequest` table. All the data in the column will be lost.
  - You are about to drop the column `quarterSprintId` on the `BudgetRequest` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `BudgetRequest` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to drop the column `keyResultId` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `quarterSprintId` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `quarterSprintId` on the `KeyResult` table. All the data in the column will be lost.
  - Made the column `campaignId` on table `BudgetRequest` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `endDate` to the `Campaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Campaign` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "QuarterSprint_fiscalYearId_quarter_idx";

-- DropIndex
DROP INDEX "QuarterSprint_objectiveId_idx";

-- DropIndex
DROP INDEX "QuarterSprint_fiscalYearId_idx";

-- DropIndex
DROP INDEX "QuarterSprint_code_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "QuarterSprint";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BudgetAllocation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "campaignId" INTEGER NOT NULL,
    "fiscalYearId" INTEGER NOT NULL,
    "allocated" INTEGER NOT NULL,
    "spent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BudgetAllocation_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BudgetAllocation_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BudgetAllocation" ("allocated", "campaignId", "createdAt", "fiscalYearId", "id", "spent", "updatedAt") SELECT "allocated", "campaignId", "createdAt", "fiscalYearId", "id", "spent", "updatedAt" FROM "BudgetAllocation";
DROP TABLE "BudgetAllocation";
ALTER TABLE "new_BudgetAllocation" RENAME TO "BudgetAllocation";
CREATE INDEX "BudgetAllocation_campaignId_idx" ON "BudgetAllocation"("campaignId");
CREATE UNIQUE INDEX "BudgetAllocation_campaignId_fiscalYearId_key" ON "BudgetAllocation"("campaignId", "fiscalYearId");
CREATE TABLE "new_BudgetRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "fiscalYearId" INTEGER NOT NULL,
    "requesterId" INTEGER NOT NULL,
    "campaignId" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "linkStatus" TEXT NOT NULL DEFAULT 'UNDEFINED_OBJECTIVE',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BudgetRequest_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BudgetRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "MarketingUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BudgetRequest_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BudgetRequest" ("amount", "campaignId", "createdAt", "dueDate", "fiscalYearId", "id", "linkStatus", "notes", "requesterId", "status", "title", "updatedAt") SELECT "amount", "campaignId", "createdAt", "dueDate", "fiscalYearId", "id", "linkStatus", "notes", "requesterId", "status", "title", "updatedAt" FROM "BudgetRequest";
DROP TABLE "BudgetRequest";
ALTER TABLE "new_BudgetRequest" RENAME TO "BudgetRequest";
CREATE INDEX "BudgetRequest_status_dueDate_idx" ON "BudgetRequest"("status", "dueDate");
CREATE INDEX "BudgetRequest_campaignId_idx" ON "BudgetRequest"("campaignId");
CREATE TABLE "new_Campaign" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT,
    "shortCode" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "quarter" INTEGER,
    "fiscalYearId" INTEGER NOT NULL,
    "channelId" INTEGER NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "objectiveId" INTEGER,
    "allocatedBudget" REAL NOT NULL DEFAULT 0,
    "spentBudget" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "goal" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Campaign_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Campaign_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "MarketingUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Campaign_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "MarketingChannel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Campaign_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Campaign" ("channelId", "createdAt", "description", "fiscalYearId", "goal", "id", "name", "ownerId", "status", "updatedAt") SELECT "channelId", "createdAt", "description", "fiscalYearId", "goal", "id", "name", "ownerId", "status", "updatedAt" FROM "Campaign";
DROP TABLE "Campaign";
ALTER TABLE "new_Campaign" RENAME TO "Campaign";
CREATE UNIQUE INDEX "Campaign_code_key" ON "Campaign"("code");
CREATE INDEX "Campaign_objectiveId_idx" ON "Campaign"("objectiveId");
CREATE INDEX "Campaign_ownerId_idx" ON "Campaign"("ownerId");
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");
CREATE INDEX "Campaign_fiscalYearId_idx" ON "Campaign"("fiscalYearId");
CREATE TABLE "new_KeyResult" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "targetValue" REAL NOT NULL,
    "progressValue" REAL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'unit',
    "weight" INTEGER NOT NULL DEFAULT 100,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "objectiveId" INTEGER,
    "ownerId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KeyResult_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "MarketingUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "KeyResult_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_KeyResult" ("createdAt", "id", "metric", "ownerId", "progressValue", "status", "targetValue", "title", "unit", "updatedAt", "weight") SELECT "createdAt", "id", "metric", "ownerId", "progressValue", "status", "targetValue", "title", "unit", "updatedAt", "weight" FROM "KeyResult";
DROP TABLE "KeyResult";
ALTER TABLE "new_KeyResult" RENAME TO "KeyResult";
CREATE INDEX "KeyResult_objectiveId_idx" ON "KeyResult"("objectiveId");
CREATE INDEX "KeyResult_ownerId_idx" ON "KeyResult"("ownerId");
CREATE INDEX "KeyResult_status_idx" ON "KeyResult"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
