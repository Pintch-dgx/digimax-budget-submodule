# Schema Refactoring - QuarterSprint Elimination

## Status: ✅ IN PROGRESS

## Date: November 4, 2025

---

## Changes Made

### ✅ Phase 1: Schema & Database (COMPLETED)
- ✅ Backup created: `prisma/dev.db.backup-20251104-075222`
- ✅ Old schema saved: `prisma/schema-old.prisma`
- ✅ New schema created and applied
- ✅ Database reset with new structure
- ✅ Prisma client regenerated
- ✅ New seed data created and applied

### ✅ Phase 2: File Cleanup (COMPLETED)
- ❌ Deleted: `src/app/api/quarter-sprints/` directory
- ❌ Deleted: `src/components/okr/CreateQuarterSprintModal.tsx`
- ❌ Deleted: `src/components/dashboard/QuarterTimeline.tsx`

### 🔄 Phase 3: API Updates (IN PROGRESS)
Files to update:
- [ ] `src/app/api/campaigns/route.ts` - Update for new schema
- [ ] `src/app/api/campaigns/[id]/route.ts` - Update references
- [ ] `src/app/api/key-results/route.ts` - Change quarterSprintId → campaignId
- [ ] `src/app/api/key-results/[id]/route.ts` - Update
- [ ] `src/app/api/budget-requests/route.ts` - Update linkStatus logic
- [ ] `src/app/api/budget-requests/[id]/route.ts` - Update
- [ ] `src/app/api/objectives/route.ts` - Remove quarterSprints references
- [ ] `src/app/api/objectives/[id]/route.ts` - Update
- [ ] `src/app/api/reports/overview/route.ts` - Update queries

### ⏳ Phase 4: UI Updates (PENDING)
Files to update:
- [ ] `src/components/okr/OkrSheetManager.tsx` - Remove QuarterSprint tab
- [ ] `src/components/okr/CreateKeyResultModal.tsx` - campaignId instead of quarterSprintId
- [ ] `src/components/campaigns/CampaignsList.tsx` - Add date fields
- [ ] `src/app/campaigns/new/page.tsx` - Add date fields
- [ ] `src/app/budget-requests/new/page.tsx` - Remove quarterSprintId
- [ ] `src/components/budget-requests/BudgetRequestsList.tsx` - Update
- [ ] `src/components/approvals/ApprovalsList.tsx` - Update
- [ ] `src/components/dashboard/CampaignAllocationsTable.tsx` - Update
- [ ] `src/components/reports/ReportsDashboard.tsx` - Update
- [ ] `src/lib/dashboard-service.ts` - Update queries
- [ ] `src/app/page.tsx` - Remove QuarterTimeline

### ⏳ Phase 5: Types & Utils (PENDING)
- [ ] `src/components/okr/OkrSheetTypes.ts` - Remove QuarterSprint types
- [ ] Update all type imports

---

## New Schema Structure

```
FiscalYear
  └── Objective
        └── Campaign (ex QuarterSprint + Campaign merged)
              ├── startDate, endDate, quarter
              ├── code, shortCode
              └── KeyResult (now belongs to Campaign)
```

### Key Changes

1. **Campaign** è ora l'entità centrale che include:
   - Informazioni temporali (startDate, endDate, quarter)
   - Collegamento diretto a Objective
   - Key Results collegati direttamente

2. **KeyResult** ora ha:
   - `campaignId` invece di `quarterSprintId`
   - Relazione diretta con Campaign

3. **BudgetRequest** ora ha:
   - Rimosso `quarterSprintId`
   - Mantiene `campaignId` e `keyResultId`
   - linkStatus semplificato

---

## Next Steps

1. Update API endpoints
2. Update UI components
3. Update types
4. Test complete workflow
5. Update documentation

---

**Estimated Remaining Time**: 15-18 hours
**Current Progress**: ~25%

