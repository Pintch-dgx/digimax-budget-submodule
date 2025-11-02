# Analisi e Proposta di Ristrutturazione Schema OKR

## Contesto
Analisi come **Marketing Manager Nazionale** che deve monitorare l'operato dei Marketing Manager Regionali attraverso:
1. Gestione campagne con budget
2. Raggruppamento temporale in Quarter Sprint
3. Valutazione risultati tramite framework OKR

---

## Problemi Strutturali Identificati

### 1. **Struttura OKR Non Standard**
- ❌ `OperationalInsight` usato come Objective ma non è chiaro se rappresenta goal company/department
- ❌ `KeyResult` può appartenere sia a `QuarterSprint` che a `OperationalInsight` (ambiguità)
- ❌ Manca gerarchia chiara: Objective → QuarterSprint → KeyResults → Campaigns

### 2. **QuarterSprint Ambiguo**
- ❌ Duplicazione: `objective` (stringa) e `objectiveId` (FK)
- ❌ Non chiaro se rappresenta periodo temporale O obiettivo strategico

### 3. **Metriche KeyResult Problematiche**
- ❌ `targetValue` e `progressValue` come `String` invece di numerici
- ❌ Manca tracking status (on track, at risk, off track)
- ❌ `weight` nullable crea problemi nel calcolo percentuali

### 4. **Monitoring Manageriale Insufficiente**
- ❌ Nessuna gerarchia ownership per aggregazioni
- ❌ Difficile tracciare contributo campagne → OKR
- ❌ Nessuna aggregazione per livello manageriale

---

## Proposta di Ristrutturazione

### Gerarchia OKR Standard
```
FiscalYear
  └─ Objective (strategico, annuale)
      └─ QuarterSprint (periodo + obiettivo operativo)
          └─ KeyResult (metriche misurabili)
              └─ Campaign (iniziative tattiche)
                  └─ BudgetAllocation (risorse)
```

### Modifiche Principali

#### 1. **Creare Tabella `Objective` Dedicata**
Rimuovere `OperationalInsight` come Objective, creare tabella dedicata:

```prisma
model Objective {
  id              Int           @id @default(autoincrement())
  title           String        // "Aumentare lead generation del 40%"
  description     String?
  fiscalYearId    Int
  ownerId         Int?          // Marketing Manager Nazionale
  status          ObjectiveStatus @default(ACTIVE)
  progress        Float?        // 0-100, calcolato da KR weighted
  fiscalYear      FiscalYear    @relation(fields: [fiscalYearId], references: [id], onDelete: Cascade)
  owner           MarketingUser? @relation(fields: [ownerId], references: [id], onDelete: SetNull)
  quarterSprints  QuarterSprint[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  @@index([fiscalYearId])
  @@index([ownerId])
}

enum ObjectiveStatus {
  ACTIVE
  ARCHIVED
  CANCELLED
}
```

#### 2. **QuarterSprint: Separare Periodo da Obiettivo**
QuarterSprint diventa **periodo temporale puro**, l'obiettivo viene da Objective:

```prisma
model QuarterSprint {
  id              Int           @id @default(autoincrement())
  name            String        // "Q1 2025"
  code            String?       @unique
  shortCode       String?       // "Q1"
  quarter         Int           // 1-4
  startDate       DateTime      // Obbligatorio
  endDate         DateTime      // Obbligatorio
  fiscalYearId    Int           // Obbligatorio
  objectiveId     Int           // Obbligatorio - collegamento a Objective
  
  fiscalYear      FiscalYear    @relation(fields: [fiscalYearId], references: [id], onDelete: Cascade)
  objective       Objective     @relation(fields: [objectiveId], references: [id], onDelete: Cascade)
  keyResults      KeyResult[]
  campaigns       Campaign[]
  budgetRequests  BudgetRequest[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  @@unique([fiscalYearId, quarter]) // Un quarter per fiscal year
  @@index([fiscalYearId])
  @@index([objectiveId])
}
```

**Rimozioni**: `objective` (stringa), `objectiveRef` (FK a OperationalInsight)

#### 3. **KeyResult: Metriche Numeriche e Status**
```prisma
model KeyResult {
  id               Int                @id @default(autoincrement())
  title            String             // "Lead generati da campagne digitali"
  metric           String             // "lead_count"
  targetValue      Float              // Obbligatorio, numerico
  progressValue    Float?             @default(0)
  unit             String             @default("unit")
  weight           Int                @default(100) // Non nullable
  status           KeyResultStatus    @default(NOT_STARTED)
  quarterSprintId  Int                // Obbligatorio
  ownerId          Int?               // Marketing Manager Regionale responsabile
  
  quarterSprint    QuarterSprint      @relation(fields: [quarterSprintId], references: [id], onDelete: Cascade)
  owner            MarketingUser?      @relation(fields: [ownerId], references: [id], onDelete: SetNull)
  campaigns        Campaign[]
  budgetRequests   BudgetRequest[]
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt
  
  // Calcolo progresso (0-100)
  // progressValue / targetValue * 100 (con gestione edge cases)
  
  @@index([quarterSprintId])
  @@index([ownerId])
  @@index([status])
}

enum KeyResultStatus {
  NOT_STARTED
  ON_TRACK
  AT_RISK
  OFF_TRACK
  COMPLETED
}
```

#### 4. **Campaign: Collegamento Chiaro a KeyResult**
```prisma
model Campaign {
  id              Int                @id @default(autoincrement())
  name            String
  description     String?
  fiscalYearId    Int
  channelId       Int
  ownerId         Int                // Marketing Manager Regionale
  quarterSprintId Int?               // Opzionale per flessibilità
  keyResultId     Int?               // Collegamento diretto a KeyResult
  status          CampaignStatus     @default(PLANNED)
  goal            String?            // Goal qualitativo della campagna
  
  fiscalYear      FiscalYear         @relation(fields: [fiscalYearId], references: [id], onDelete: Cascade)
  channel         MarketingChannel   @relation(fields: [channelId], references: [id], onDelete: Cascade)
  owner           MarketingUser      @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  quarterSprint   QuarterSprint?     @relation(fields: [quarterSprintId], references: [id], onDelete: SetNull)
  keyResult       KeyResult?         @relation(fields: [keyResultId], references: [id], onDelete: SetNull)
  
  allocations     BudgetAllocation[]
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  
  @@index([quarterSprintId])
  @@index([keyResultId])
  @@index([ownerId])
  @@index([status])
}

enum CampaignStatus {
  PLANNED
  ACTIVE
  PAUSED
  COMPLETED
  CANCELLED
}
```

#### 5. **BudgetAllocation: Tracking per Quarter**
```prisma
model BudgetAllocation {
  id              Int           @id @default(autoincrement())
  campaignId      Int
  fiscalYearId    Int
  quarterSprintId Int?          // Nuovo: tracking per quarter
  allocated       Int
  spent           Int           @default(0)
  
  campaign        Campaign      @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  fiscalYear      FiscalYear    @relation(fields: [fiscalYearId], references: [id], onDelete: Cascade)
  quarterSprint   QuarterSprint? @relation(fields: [quarterSprintId], references: [id], onDelete: SetNull)
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  @@unique([campaignId, fiscalYearId, quarterSprintId]) // Permette allocazioni multiple per quarter
  @@index([quarterSprintId])
}
```

#### 6. **OperationalInsight: Solo per Insights**
Convertire in tabella dedicata a insights/raccomandazioni, non più usata come Objective:

```prisma
model OperationalInsight {
  id             Int        @id @default(autoincrement())
  fiscalYearId   Int
  title          String
  description    String
  priority       Int        @default(2)
  insightType    InsightType @default(RECOMMENDATION)
  relatedKeyResultId Int?   // Opzionale: può riferirsi a un KR specifico
  
  fiscalYear     FiscalYear @relation(fields: [fiscalYearId], references: [id], onDelete: Cascade)
  relatedKeyResult KeyResult? @relation(fields: [relatedKeyResultId], references: [id], onDelete: SetNull)
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
  
  @@index([priority])
  @@index([relatedKeyResultId])
}

enum InsightType {
  RECOMMENDATION
  WARNING
  OPPORTUNITY
  ACHIEVEMENT
}
```

---

## Vantaggi della Nuova Struttura

### Per il Marketing Manager Nazionale:

1. **Visibilità Gerarchica**
   ```
   Objective (annuale) 
     → Progress aggregato da tutti i KR
     → Budget totale allocato
   ```

2. **Monitoring per Quarter**
   ```
   QuarterSprint Q1
     → KeyResults progress
     → Campagne attive
     → Budget speso vs allocato
   ```

3. **Accountability per Manager Regionali**
   ```
   MarketingUser (Manager Regionale)
     → KeyResults owned
     → Campagne gestite
     → Budget responsabilità
   ```

4. **Correlazione Campagne → OKR**
   ```
   Campaign → KeyResult → QuarterSprint → Objective
   Chiara tracciabilità del contributo
   ```

### Miglioramenti Tecnici:

- ✅ Metriche numeriche calcolabili (progress %, aggregazioni)
- ✅ Status tracking automatico (on track/at risk/off track)
- ✅ Eliminata ambiguità QuarterSprint (solo periodo temporale)
- ✅ Relazioni obbligatorie dove necessarie
- ✅ Supporto per allocazioni budget multi-quarter

---

## Migration Path

### Fase 1: Creare nuove tabelle
1. Creare `Objective`
2. Aggiornare `QuarterSprint` (rimuovere `objective` string, rendere `objectiveId` obbligatorio)
3. Migrare dati esistenti da `OperationalInsight` a `Objective`

### Fase 2: Migrare KeyResults
1. Convertire `targetValue` e `progressValue` a Float
2. Aggiungere `status` enum
3. Rendere `weight` non nullable con default 100
4. Rendere `quarterSprintId` obbligatorio

### Fase 3: Aggiornare Campaign e BudgetAllocation
1. Aggiungere `status` a Campaign
2. Aggiungere `quarterSprintId` a BudgetAllocation
3. Migrare relazioni esistenti

### Fase 4: OperationalInsight
1. Convertire in tabella insights pura
2. Rimuovere relazioni Objective

---

## Query di Esempio per Monitoring

### Dashboard Marketing Manager Nazionale

```sql
-- Progress Objective aggregato
SELECT 
  o.title,
  o.progress,
  COUNT(DISTINCT kr.id) as key_results_count,
  SUM(ba.allocated) as total_budget_allocated,
  SUM(ba.spent) as total_budget_spent
FROM Objective o
LEFT JOIN QuarterSprint qs ON qs.objectiveId = o.id
LEFT JOIN KeyResult kr ON kr.quarterSprintId = qs.id
LEFT JOIN Campaign c ON c.keyResultId = kr.id
LEFT JOIN BudgetAllocation ba ON ba.campaignId = c.id
WHERE o.fiscalYearId = ?
GROUP BY o.id;

-- KeyResults a rischio per quarter
SELECT 
  qs.name as quarter,
  kr.title,
  kr.status,
  (kr.progressValue / kr.targetValue * 100) as progress_pct,
  mu.fullName as owner
FROM KeyResult kr
JOIN QuarterSprint qs ON qs.id = kr.quarterSprintId
LEFT JOIN MarketingUser mu ON mu.id = kr.ownerId
WHERE kr.status IN ('AT_RISK', 'OFF_TRACK')
  AND qs.fiscalYearId = ?;

-- Budget per Quarter con dettaglio campagne
SELECT 
  qs.name as quarter,
  COUNT(DISTINCT c.id) as campaigns_count,
  SUM(ba.allocated) as allocated,
  SUM(ba.spent) as spent,
  (SUM(ba.spent) * 100.0 / SUM(ba.allocated)) as spend_percentage
FROM QuarterSprint qs
LEFT JOIN Campaign c ON c.quarterSprintId = qs.id
LEFT JOIN BudgetAllocation ba ON ba.campaignId = c.id AND ba.quarterSprintId = qs.id
WHERE qs.fiscalYearId = ?
GROUP BY qs.id;
```

---

## Conclusioni

La struttura attuale **non è ottimale** per:
- Monitoring efficace da parte del Marketing Manager Nazionale
- Tracciamento OKR standard
- Correlazione chiara Campagne → KeyResults → Objectives

La proposta di ristrutturazione:
- ✅ Implementa gerarchia OKR standard
- ✅ Supporta monitoring manageriale multi-livello
- ✅ Permette aggregazioni e metriche calcolabili
- ✅ Elimina ambiguità strutturali

**Raccomandazione**: Procedere con la ristrutturazione per garantire scalabilità e usabilità del sistema.

