# Analisi Ristrutturazione Schema: Eliminare QuarterSprint

## Data: November 3, 2025

## Richiesta
Eliminare l'entità QuarterSprint e sostituire la sua funzione con Campaign.
Rimodellare in: **Campaign → Objective → Key Result**

---

## 1. Situazione Attuale (AS IS)

### Schema Corrente
```
FiscalYear
  ├── Objective
  │     └── QuarterSprint (periodo temporale + obiettivo)
  │           └── KeyResult (metriche)
  │                 └── Campaign (iniziative tattiche)
  └── Campaign (duplicato, può esistere senza QuarterSprint)
```

### Entità QuarterSprint
```prisma
model QuarterSprint {
  id               Int
  name             String
  code             String?
  shortCode        String?
  quarter          Int                # 1-4
  startDate        DateTime
  endDate          DateTime
  fiscalYearId     Int                # → FiscalYear
  objectiveId      Int                # → Objective
  objectiveSummary String?
  
  // Relazioni
  allocations      BudgetAllocation[]
  budgetRequests   BudgetRequest[]
  campaigns        Campaign[]         # Campaign appartiene a QuarterSprint
  keyResults       KeyResult[]        # KeyResult appartiene a QuarterSprint
  objective        Objective
  fiscalYear       FiscalYear
}
```

### Problemi Identificati
1. **Doppia gerarchia**: Campaign può essere sotto QuarterSprint O standalone
2. **Confusione concettuale**: QuarterSprint mescola periodo temporale e obiettivo strategico
3. **Complessità**: Troppi livelli gerarchici (FiscalYear → Objective → QuarterSprint → KeyResult → Campaign)

---

## 2. Schema Proposto (TO BE)

### Nuova Architettura
```
FiscalYear
  └── Objective (obiettivo strategico)
        └── Campaign (periodo temporale + iniziativa tattica)
              └── KeyResult (metriche specifiche della campagna)
```

### Campaign (Rimodellata)
```prisma
model Campaign {
  id              Int                @id @default(autoincrement())
  name            String             # Nome campagna
  description     String?
  code            String?            # Nuovo: codice univoco (es. "Q1-2025")
  shortCode       String?            # Nuovo: codice breve (es. "Q1")
  
  // Date (spostate da QuarterSprint)
  startDate       DateTime           # Nuovo: obbligatorio
  endDate         DateTime           # Nuovo: obbligatorio
  quarter         Int?               # Nuovo: 1-4 (calcolato o manuale)
  
  // Foreign keys obbligatori
  fiscalYearId    Int                # → FiscalYear
  channelId       Int                # → MarketingChannel
  ownerId         Int                # → MarketingUser
  objectiveId     Int?               # Nuovo: → Objective (opzionale)
  
  // Altri campi
  status          CampaignStatus     @default(PLANNED)
  goal            String?
  
  // Relazioni
  allocations     BudgetAllocation[]
  budgetRequests  BudgetRequest[]
  keyResults      KeyResult[]        # Nuovo: KeyResult appartiene a Campaign
  objective       Objective?         # Nuovo
  fiscalYear      FiscalYear
  channel         MarketingChannel
  owner           MarketingUser
}
```

### KeyResult (Modificato)
```prisma
model KeyResult {
  id              Int
  title           String
  metric          String
  targetValue     Float
  progressValue   Float?
  unit            String
  weight          Int
  status          KeyResultStatus
  
  // Foreign key cambiato
  campaignId      Int                # Era: quarterSprintId
  ownerId         Int?
  
  // Relazioni
  campaign        Campaign           # Era: quarterSprint
  owner           MarketingUser?
  budgetRequests  BudgetRequest[]
  insights        OperationalInsight[]
}
```

### BudgetRequest (Semplificato)
```prisma
model BudgetRequest {
  id              Int
  title           String
  fiscalYearId    Int
  requesterId     Int
  campaignId      Int?               # Diretto a Campaign (era tramite QuarterSprint)
  keyResultId     Int?
  amount          Int
  dueDate         DateTime
  status          BudgetRequestStatus
  linkStatus      BudgetRequestLinkStatus
  notes           String?
  
  // Relazioni semplificate
  keyResult       KeyResult?
  campaign        Campaign?
  requester       MarketingUser
  fiscalYear      FiscalYear
}
```

### Objective (Semplificato)
```prisma
model Objective {
  id             Int
  title          String
  description    String?
  fiscalYearId   Int
  ownerId        Int?
  status         ObjectiveStatus
  progress       Float?
  
  // Relazioni
  owner          MarketingUser?
  fiscalYear     FiscalYear
  campaigns      Campaign[]         # Nuovo: Campaign appartiene a Objective
}
```

---

## 3. Impatto della Migrazione

### File da Modificare

#### Schema e Database (5 file)
1. `prisma/schema.prisma` - Rimodellare completamente
2. `prisma/migrations/` - Creare nuova migration
3. `prisma/seed-demo.ts` - Aggiornare seed
4. `prisma/seed-demo-js.js` - Aggiornare seed
5. `prisma/seed.ts` - Aggiornare seed

#### API Routes (12+ file)
1. `src/app/api/quarter-sprints/route.ts` - **ELIMINARE**
2. `src/app/api/quarter-sprints/[id]/route.ts` - **ELIMINARE**
3. `src/app/api/campaigns/route.ts` - Aggiornare (rimuovere quarterSprintId)
4. `src/app/api/campaigns/[id]/route.ts` - Aggiornare
5. `src/app/api/budget-requests/route.ts` - Aggiornare logica linkStatus
6. `src/app/api/budget-requests/[id]/route.ts` - Aggiornare
7. `src/app/api/key-results/route.ts` - Cambiare quarterSprintId → campaignId
8. `src/app/api/key-results/[id]/route.ts` - Aggiornare
9. `src/app/api/objectives/route.ts` - Aggiornare (rimuovere quarterSprints)
10. `src/app/api/objectives/[id]/route.ts` - Aggiornare
11. `src/app/api/reports/overview/route.ts` - Aggiornare query
12. Altri endpoint che usano QuarterSprint

#### Componenti UI (15+ file)
1. `src/components/okr/OkrSheetManager.tsx` - **RISCRIVERE COMPLETAMENTE**
2. `src/components/okr/CreateQuarterSprintModal.tsx` - **ELIMINARE**
3. `src/components/okr/CreateKeyResultModal.tsx` - Aggiornare (campaignId invece di quarterSprintId)
4. `src/components/campaigns/CampaignsList.tsx` - Aggiungere campi date, objective
5. `src/components/budget-requests/BudgetRequestsList.tsx` - Rimuovere riferimenti QuarterSprint
6. `src/components/approvals/ApprovalsList.tsx` - Aggiornare
7. `src/components/dashboard/QuarterTimeline.tsx` - **ELIMINARE o TRASFORMARE in CampaignTimeline**
8. `src/components/dashboard/CampaignAllocationsTable.tsx` - Aggiornare
9. `src/components/reports/ReportsDashboard.tsx` - Aggiornare
10. `src/app/budget-requests/new/page.tsx` - Rimuovere quarterSprintId, usare campaignId
11. `src/app/campaigns/new/page.tsx` - Aggiungere campi date, objective
12. `src/app/page.tsx` - Dashboard principale
13. `src/lib/dashboard-service.ts` - Aggiornare query
14. Altri componenti

#### Types (2+ file)
1. `src/components/okr/OkrSheetTypes.ts` - Aggiornare
2. `src/types/*` - Verificare

---

## 4. Migrazione Dati

### Strategia Migrazione

**Opzione A: Mappare QuarterSprint → Campaign**
- Ogni QuarterSprint esistente diventa una Campaign
- I KeyResults rimangono collegati
- Le BudgetRequests vengono ricollegadate

**Opzione B: Perdere QuarterSprint**
- Eliminare tutti i QuarterSprint
- Ricreare solo le Campaign
- I KeyResults devono essere riassegnati manualmente
- Le BudgetRequests devono essere ricollegadate manualmente

**Consiglio**: **Opzione A** con script di migrazione

### Script Migrazione (Concettuale)

```typescript
// Migration: Transform QuarterSprint to Campaign
async function migrateQuarterSprintToCampaign() {
  const quarterSprints = await prisma.quarterSprint.findMany({
    include: {
      objective: true,
      keyResults: true,
      budgetRequests: true,
      campaigns: true, // Campaign esistenti sotto QS
    }
  });

  for (const qs of quarterSprints) {
    // 1. Se il QS ha già delle Campaign sotto, spostarle a livello superiore
    for (const campaign of qs.campaigns) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          startDate: qs.startDate,
          endDate: qs.endDate,
          quarter: qs.quarter,
          objectiveId: qs.objectiveId,
        }
      });
    }

    // 2. Se il QS non ha Campaign, crearne una che lo rappresenta
    if (qs.campaigns.length === 0) {
      const newCampaign = await prisma.campaign.create({
        data: {
          name: qs.name,
          code: qs.code,
          shortCode: qs.shortCode,
          startDate: qs.startDate,
          endDate: qs.endDate,
          quarter: qs.quarter,
          goal: qs.objectiveSummary,
          fiscalYearId: qs.fiscalYearId,
          objectiveId: qs.objectiveId,
          // Campi obbligatori - usare default
          channelId: defaultChannel.id,
          ownerId: defaultOwner.id,
          status: "ACTIVE",
        }
      });

      // 3. Spostare KeyResults
      await prisma.keyResult.updateMany({
        where: { quarterSprintId: qs.id },
        data: { campaignId: newCampaign.id }
      });

      // 4. Spostare BudgetRequests
      await prisma.budgetRequest.updateMany({
        where: { quarterSprintId: qs.id },
        data: { campaignId: newCampaign.id }
      });
    }
  }

  // 5. Eliminare tutti i QuarterSprint
  await prisma.quarterSprint.deleteMany();
}
```

---

## 5. Impatto Stimato

### Complessità
- **Molto Alta** (8-10 su 10)
- Richiede riscrittura di ~50% del codebase
- Richiede migrazione dati esistenti
- Richiede testing completo

### Tempo Stimato
- Analisi e pianificazione: 2 ore
- Ristrutturazione schema: 1 ora
- Migrazione dati: 2 ore
- Aggiornamento API: 4-6 ore
- Aggiornamento UI: 6-8 ore
- Testing: 4-6 ore
- **Totale**: 19-25 ore

### Rischi
1. **Perdita dati**: Se migrazione fallisce
2. **Funzionalità rotte**: Molti componenti da aggiornare
3. **Regressioni**: Testing incompleto
4. **Downtime**: Durante migrazione (se in prod)

---

## 6. Benefici Attesi

### Pro
✅ **Semplificazione**: Meno livelli gerarchici
✅ **Chiarezza**: Campaign diventa entità centrale
✅ **Logica migliore**: Obiettivo → Campagna → Key Result è più intuitivo
✅ **Meno confusione**: QuarterSprint mescolava periodo temporale e strategia

### Contro
❌ **Effort molto alto**: Quasi una riscrittura completa
❌ **Rischio rotture**: Molti punti di failure
❌ **Downtime**: Se già in produzione
❌ **Testing completo**: Necessario rifare tutti i test

---

## 7. Raccomandazione

### Opzione 1: Ristrutturazione Completa (Richiesta)
- ✅ Pro: Schema più semplice e logico
- ❌ Contro: 20+ ore di lavoro, alto rischio

### Opzione 2: Rinominare QuarterSprint → Campaign (Compromesso)
- Mantenere la struttura attuale
- Rinominare "QuarterSprint" in "Campaign" nel UI
- Aggiungere campi campaign a QuarterSprint (name, channel, etc.)
- **Sforzo**: ~5 ore
- **Rischio**: Basso

### Opzione 3: Convivenza (Minimale)
- Mantenere entrambe le entità
- Chiarire ruoli: QuarterSprint = periodo, Campaign = iniziativa
- Migliorare documentazione
- **Sforzo**: ~1 ora
- **Rischio**: Molto basso

---

## 8. Piano di Implementazione (se si procede)

### Phase 1: Backup e Preparazione
1. Backup completo database
2. Creare branch git separato
3. Documentare schema attuale

### Phase 2: Nuovo Schema
1. Modificare `schema.prisma`
2. Testare localmente
3. Creare migration script

### Phase 3: Migrazione Dati
1. Script migrazione QuarterSprint → Campaign
2. Testare su database clone
3. Verificare integrità dati

### Phase 4: Aggiornamento API
1. Eliminare `/api/quarter-sprints`
2. Aggiornare `/api/campaigns`
3. Aggiornare `/api/key-results`
4. Aggiornare `/api/budget-requests`
5. Aggiornare `/api/objectives`

### Phase 5: Aggiornamento UI
1. Eliminare `OkrSheetManager` quarter sprint tab
2. Aggiornare `CampaignsList`
3. Aggiornare form creazione campagna
4. Aggiornare dashboard
5. Aggiornare reports

### Phase 6: Testing
1. Test unitari API
2. Test integrazione
3. Test E2E workflow completo
4. Test migrazione dati

---

## 9. Domande Critiche

Prima di procedere:

1. **Ci sono dati in produzione da migrare?**
   - Se sì, serve piano migrazione zero-downtime
   - Se no, possiamo ripartire da zero

2. **Ci sono utenti che stanno usando il sistema?**
   - Se sì, comunicazione necessaria
   - Se no, possiamo procedere liberamente

3. **Budget di tempo disponibile?**
   - 20+ ore sono disponibili?
   - Oppure cerchiamo soluzione più veloce?

4. **Priorità?**
   - È critical path per go-live?
   - Oppure è nice-to-have?

---

## 10. Decisione Consigliata

**STOP prima di procedere**

Questa è una ristrutturazione **major** che richiede:
- ✅ Conferma esplicita
- ✅ Piano dettagliato approvato
- ✅ Timeline chiara
- ✅ Strategia backup/rollback

**Alternativa suggerita**: 
Completare prima le funzionalità esistenti (creazione campagna, workflow completo) e **poi** valutare se la ristrutturazione porta valore reale.

La struttura attuale, anche se complessa, **funziona**. La ristrutturazione è un **refactoring** che può attendere.

---

## Prossimi Passi Proposti

**Prima di procedere con la ristrutturazione**, confermare:

1. ✅ È veramente necessaria adesso?
2. ✅ Ci sono dati di produzione da preservare?
3. ✅ Abbiamo ~20 ore disponibili?
4. ✅ Abbiamo un piano di rollback?
5. ✅ Tutti gli stakeholder sono allineati?

**Se la risposta è NO a qualcuna di queste**, suggerisco di:
- Completare prima il form creazione campagna (soluzione pagina dedicata)
- Testare il workflow end-to-end
- Poi valutare refactoring schema


