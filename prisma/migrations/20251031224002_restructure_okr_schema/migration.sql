-- Migration: Ristrutturazione Schema OKR
-- Crea nuove tabelle e aggiorna quelle esistenti per implementare gerarchia OKR standard

-- Step 1: Creare enum per nuovi status
-- Nota: SQLite non supporta enum nativi, useremo TEXT con CHECK constraints

-- Step 2: Creare tabella Objective
CREATE TABLE "Objective" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fiscalYearId" INTEGER NOT NULL,
    "ownerId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "progress" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Objective_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Objective_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "MarketingUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Objective_fiscalYearId_idx" ON "Objective"("fiscalYearId");
CREATE INDEX "Objective_ownerId_idx" ON "Objective"("ownerId");

-- Step 3: Creare tabella temporanea QuarterSprint con nuova struttura
CREATE TABLE "QuarterSprint_new" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "shortCode" TEXT,
    "quarter" INTEGER NOT NULL DEFAULT 1,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fiscalYearId" INTEGER NOT NULL,
    "objectiveId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QuarterSprint_new_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuarterSprint_new_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Migrare dati QuarterSprint esistenti creando Objective temporanei
-- Per ogni QuarterSprint esistente, creiamo un Objective basato sul campo objective
INSERT INTO "Objective" ("title", "description", "fiscalYearId", "status", "createdAt", "updatedAt")
SELECT 
    COALESCE("objective", "name") as title,
    NULL as description,
    COALESCE("fiscalYearId", (SELECT id FROM "FiscalYear" ORDER BY "createdAt" DESC LIMIT 1)) as fiscalYearId,
    'ACTIVE' as status,
    "createdAt",
    "updatedAt"
FROM "QuarterSprint"
WHERE "objective" IS NOT NULL OR "name" IS NOT NULL;

-- Migrare QuarterSprint con riferimento ai nuovi Objective
INSERT INTO "QuarterSprint_new" (
    "id", "name", "code", "shortCode", "quarter", 
    "startDate", "endDate", "fiscalYearId", "objectiveId", 
    "createdAt", "updatedAt"
)
SELECT 
    qs."id",
    qs."name",
    qs."code",
    qs."shortCode",
    -- Estrai quarter da name o usa default
    CASE 
        WHEN qs."name" LIKE '%Q1%' OR qs."name" LIKE '%Q 1%' THEN 1
        WHEN qs."name" LIKE '%Q2%' OR qs."name" LIKE '%Q 2%' THEN 2
        WHEN qs."name" LIKE '%Q3%' OR qs."name" LIKE '%Q 3%' THEN 3
        WHEN qs."name" LIKE '%Q4%' OR qs."name" LIKE '%Q 4%' THEN 4
        ELSE 1
    END as quarter,
    COALESCE(qs."startDate", CURRENT_TIMESTAMP) as startDate,
    COALESCE(qs."endDate", CURRENT_TIMESTAMP) as endDate,
    COALESCE(qs."fiscalYearId", (SELECT id FROM "FiscalYear" ORDER BY "createdAt" DESC LIMIT 1)) as fiscalYearId,
    o."id" as objectiveId,
    qs."createdAt",
    qs."updatedAt"
FROM "QuarterSprint" qs
LEFT JOIN "Objective" o ON o."title" = COALESCE(qs."objective", qs."name")
WHERE o."id" IS NOT NULL;

-- Step 4: Aggiornare KeyResult - creare tabella nuova
CREATE TABLE "KeyResult_new" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "targetValue" REAL NOT NULL DEFAULT 0,
    "progressValue" REAL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'unit',
    "weight" INTEGER NOT NULL DEFAULT 100,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "quarterSprintId" INTEGER NOT NULL,
    "ownerId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KeyResult_new_quarterSprintId_fkey" FOREIGN KEY ("quarterSprintId") REFERENCES "QuarterSprint_new" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KeyResult_new_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "MarketingUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Migrare KeyResult convertendo String a Float
INSERT INTO "KeyResult_new" (
    "id", "title", "metric", "targetValue", "progressValue", 
    "unit", "weight", "status", "quarterSprintId", "ownerId", 
    "createdAt", "updatedAt"
)
SELECT 
    kr."id",
    kr."title",
    kr."metric",
    CAST(COALESCE(kr."targetValue", "0") AS REAL) as targetValue,
    CAST(COALESCE(kr."progressValue", "0") AS REAL) as progressValue,
    COALESCE(kr."unit", "unit") as unit,
    COALESCE(kr."weight", 100) as weight,
    'NOT_STARTED' as status,
    kr."quarterSprintId",
    NULL as ownerId,
    kr."createdAt",
    kr."updatedAt"
FROM "KeyResult" kr
WHERE kr."quarterSprintId" IN (SELECT id FROM "QuarterSprint_new");

-- Step 5: Aggiornare Campaign - aggiungere status enum
CREATE TABLE "Campaign_new" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fiscalYearId" INTEGER NOT NULL,
    "channelId" INTEGER NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "quarterSprintId" INTEGER,
    "keyResultId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "goal" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Campaign_new_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Campaign_new_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "MarketingChannel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Campaign_new_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "MarketingUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Campaign_new_quarterSprintId_fkey" FOREIGN KEY ("quarterSprintId") REFERENCES "QuarterSprint_new" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Campaign_new_keyResultId_fkey" FOREIGN KEY ("keyResultId") REFERENCES "KeyResult_new" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Migrare Campaign esistenti
INSERT INTO "Campaign_new" (
    "id", "name", "description", "fiscalYearId", "channelId", 
    "ownerId", "quarterSprintId", "keyResultId", "status", 
    "goal", "createdAt", "updatedAt"
)
SELECT 
    c."id",
    c."name",
    NULL as description,
    c."fiscalYearId",
    c."channelId",
    c."ownerId",
    c."quarterSprintId",
    c."keyResultId",
    CASE 
        WHEN c."status" = 'active' THEN 'ACTIVE'
        WHEN c."status" = 'completed' THEN 'COMPLETED'
        WHEN c."status" = 'cancelled' THEN 'CANCELLED'
        WHEN c."status" = 'paused' THEN 'PAUSED'
        ELSE 'PLANNED'
    END as status,
    c."goal",
    c."createdAt",
    c."updatedAt"
FROM "Campaign" c;

-- Step 6: Aggiornare BudgetAllocation - aggiungere quarterSprintId
CREATE TABLE "BudgetAllocation_new" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "campaignId" INTEGER NOT NULL,
    "fiscalYearId" INTEGER NOT NULL,
    "quarterSprintId" INTEGER,
    "allocated" INTEGER NOT NULL,
    "spent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BudgetAllocation_new_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign_new" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BudgetAllocation_new_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BudgetAllocation_new_quarterSprintId_fkey" FOREIGN KEY ("quarterSprintId") REFERENCES "QuarterSprint_new" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Migrare BudgetAllocation
INSERT INTO "BudgetAllocation_new" (
    "id", "campaignId", "fiscalYearId", "quarterSprintId", 
    "allocated", "spent", "createdAt", "updatedAt"
)
SELECT 
    ba."id",
    ba."campaignId",
    ba."fiscalYearId",
    c."quarterSprintId" as quarterSprintId,
    ba."allocated",
    ba."spent",
    ba."createdAt",
    ba."updatedAt"
FROM "BudgetAllocation" ba
LEFT JOIN "Campaign_new" c ON c."id" = ba."campaignId";

-- Step 7: Aggiornare OperationalInsight
CREATE TABLE "OperationalInsight_new" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fiscalYearId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 2,
    "insightType" TEXT NOT NULL DEFAULT 'RECOMMENDATION',
    "relatedKeyResultId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OperationalInsight_new_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OperationalInsight_new_relatedKeyResultId_fkey" FOREIGN KEY ("relatedKeyResultId") REFERENCES "KeyResult_new" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "OperationalInsight_new" (
    "id", "fiscalYearId", "title", "description", 
    "priority", "insightType", "relatedKeyResultId", 
    "createdAt", "updatedAt"
)
SELECT 
    oi."id",
    oi."fiscalYearId",
    oi."title",
    oi."description",
    oi."priority",
    'RECOMMENDATION' as insightType,
    NULL as relatedKeyResultId,
    oi."createdAt",
    oi."updatedAt"
FROM "OperationalInsight" oi;

-- Step 8: Aggiornare BudgetRequest (già compatibile, solo aggiornare relazioni)
-- Non serve modificare la struttura, solo aggiornare le relazioni quando le tabelle saranno rinominate

-- Step 9: Sostituire tabelle vecchie con nuove
DROP TABLE IF EXISTS "KeyResult";
DROP TABLE IF EXISTS "Campaign";
DROP TABLE IF EXISTS "BudgetAllocation";
DROP TABLE IF EXISTS "QuarterSprint";
DROP TABLE IF EXISTS "OperationalInsight";

ALTER TABLE "QuarterSprint_new" RENAME TO "QuarterSprint";
ALTER TABLE "KeyResult_new" RENAME TO "KeyResult";
ALTER TABLE "Campaign_new" RENAME TO "Campaign";
ALTER TABLE "BudgetAllocation_new" RENAME TO "BudgetAllocation";
ALTER TABLE "OperationalInsight_new" RENAME TO "OperationalInsight";

-- Step 10: Aggiungere indici e constraints
CREATE UNIQUE INDEX "QuarterSprint_code_key" ON "QuarterSprint"("code");
CREATE UNIQUE INDEX "QuarterSprint_fiscalYearId_quarter_key" ON "QuarterSprint"("fiscalYearId", "quarter");
CREATE INDEX "QuarterSprint_fiscalYearId_idx" ON "QuarterSprint"("fiscalYearId");
CREATE INDEX "QuarterSprint_objectiveId_idx" ON "QuarterSprint"("objectiveId");

CREATE INDEX "KeyResult_quarterSprintId_idx" ON "KeyResult"("quarterSprintId");
CREATE INDEX "KeyResult_ownerId_idx" ON "KeyResult"("ownerId");
CREATE INDEX "KeyResult_status_idx" ON "KeyResult"("status");

CREATE INDEX "Campaign_quarterSprintId_idx" ON "Campaign"("quarterSprintId");
CREATE INDEX "Campaign_keyResultId_idx" ON "Campaign"("keyResultId");
CREATE INDEX "Campaign_ownerId_idx" ON "Campaign"("ownerId");
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

CREATE UNIQUE INDEX "BudgetAllocation_campaignId_fiscalYearId_quarterSprintId_key" ON "BudgetAllocation"("campaignId", "fiscalYearId", "quarterSprintId");
CREATE INDEX "BudgetAllocation_quarterSprintId_idx" ON "BudgetAllocation"("quarterSprintId");

CREATE INDEX "OperationalInsight_priority_idx" ON "OperationalInsight"("priority");
CREATE INDEX "OperationalInsight_relatedKeyResultId_idx" ON "OperationalInsight"("relatedKeyResultId");

