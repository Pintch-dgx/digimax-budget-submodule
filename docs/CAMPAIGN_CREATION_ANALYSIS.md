# Analisi Approfondita: Form Creazione Campagna

## Data: November 3, 2025

---

## 1. Schema Database - Model Campaign

### Campi del Model

```prisma
model Campaign {
  id              Int                @id @default(autoincrement())
  name            String             // OBBLIGATORIO
  description     String?            // OPZIONALE
  fiscalYearId    Int                // OBBLIGATORIO
  channelId       Int                // OBBLIGATORIO
  ownerId         Int                // OBBLIGATORIO
  quarterSprintId Int?               // OPZIONALE
  keyResultId     Int?               // OPZIONALE
  status          CampaignStatus     @default(PLANNED)
  goal            String?            // OPZIONALE
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  allocations     BudgetAllocation[] // RELAZIONE
  budgetRequests  BudgetRequest[]    // RELAZIONE
}
```

### Campi Obbligatori (NOT NULL)
1. **name** (String) - Nome della campagna
2. **fiscalYearId** (Int) - Anno fiscale di riferimento
3. **channelId** (Int) - Canale marketing
4. **ownerId** (Int) - Responsabile della campagna

### Campi Opzionali
1. **description** (String?) - Descrizione estesa
2. **quarterSprintId** (Int?) - Collegamento a Quarter Sprint
3. **keyResultId** (Int?) - Collegamento a Key Result
4. **goal** (String?) - Obiettivo specifico
5. **status** (CampaignStatus) - Default: PLANNED

### Enum CampaignStatus
```prisma
enum CampaignStatus {
  PLANNED      // Pianificata
  ACTIVE       // Attiva
  PAUSED       // In pausa
  COMPLETED    // Completata
  CANCELLED    // Cancellata
}
```

---

## 2. Relazioni e Foreign Keys

### Foreign Keys
- `fiscalYearId` → `FiscalYear.id` (onDelete: Cascade)
- `channelId` → `MarketingChannel.id` (onDelete: Cascade)
- `ownerId` → `MarketingUser.id` (onDelete: Cascade)
- `quarterSprintId` → `QuarterSprint.id` (opzionale, no constraint se null)
- `keyResultId` → `KeyResult.id` (opzionale, no constraint se null)

### Relazioni Inverse
- `allocations` → BudgetAllocation[] (una campagna può avere più allocazioni)
- `budgetRequests` → BudgetRequest[] (una campagna può essere collegata a più richieste)

### Vincoli Importanti
1. **Unique constraint su BudgetAllocation**: `[campaignId, fiscalYearId, quarterSprintId]`
   - Significa che una campagna può avere solo **una allocation per combinazione** di fiscal year e quarter sprint
2. Se si crea una campagna con `quarterSprintId`, questo deve appartenere allo stesso `fiscalYearId`
3. Se si crea una campagna con `keyResultId`, questo deve appartenere allo stesso `quarterSprintId` (se specificato)

---

## 3. Esempi dal Seed

### Campagna Minima (Solo Campi Obbligatori)
```typescript
await prisma.campaign.create({
  data: {
    name: "Nome Campagna",
    fiscalYearId: fiscalYear.id,
    channelId: digitalChannel.id,
    ownerId: elena.id,
  },
});
```

### Campagna Completa (Con Tutti i Campi)
```typescript
await prisma.campaign.create({
  data: {
    name: "Brand Refresh Q3",
    fiscalYearId: fiscalYear.id,
    channelId: digitalChannel.id,
    ownerId: elena.id,
    quarterSprintId: q3Sprint.id,  // OPZIONALE
    keyResultId: keyResult.id,      // OPZIONALE
    goal: "Rafforzare la percezione del brand",  // OPZIONALE
    status: "ACTIVE",  // OPZIONALE (default: PLANNED)
    allocations: {  // OPZIONALE - può essere creata dopo
      create: {
        fiscalYearId: fiscalYear.id,
        allocated: 320_000,
        spent: 185_000,
      },
    },
  },
});
```

---

## 4. Dati di Riferimento Necessari

Per creare il form, dobbiamo recuperare questi dati tramite API:

### 4.1 Fiscal Years
- **API**: `GET /api/fiscal-years`
- **Response**: Array di `{ id, code, label }`
- **Uso**: Dropdown "Anno Fiscale" (obbligatorio)

### 4.2 Marketing Channels
- **API**: Attualmente NON ESISTE
- **Opzioni**:
  1. Creare `GET /api/channels`
  2. Usare query diretta Prisma: `prisma.marketingChannel.findMany()`
  3. Estrarre da campagne esistenti (fallback)
- **Campi**: `{ id, name, slug, description? }`
- **Uso**: Dropdown "Canale" (obbligatorio)

**Canali Esistenti nel Seed**:
- Digital Marketing
- Eventi & Fiere
- Account Based Marketing

### 4.3 Users (Owners)
- **API**: `GET /api/users` (ESISTE, richiede auth)
- **Response**: Array di `{ id, fullName, email, role }`
- **Uso**: Dropdown "Owner" (obbligatorio)
- **Filtro suggerito**: Mostrare solo utenti con ruoli appropriati

### 4.4 Quarter Sprints
- **API**: `GET /api/quarter-sprints?fiscalYearId={id}`
- **Response**: `{ data: QuarterSprint[] }`
- **Uso**: Dropdown "Quarter Sprint" (opzionale)
- **Dipendenza**: Filtrare per `fiscalYearId` selezionato

### 4.5 Key Results
- **API**: `GET /api/key-results?quarterSprintId={id}`
- **Response**: `{ data: KeyResult[] }`
- **Uso**: Dropdown "Key Result" (opzionale)
- **Dipendenza**: Filtrare per `quarterSprintId` selezionato

---

## 5. Validazioni Richieste

### 5.1 Validazioni Lato Client (Form)

```typescript
// Campi obbligatori
if (!name.trim()) {
  return "Il nome della campagna è obbligatorio";
}

if (!fiscalYearId) {
  return "L'anno fiscale è obbligatorio";
}

if (!channelId) {
  return "Il canale è obbligatorio";
}

if (!ownerId) {
  return "L'owner è obbligatorio";
}

// Validazioni logiche
if (quarterSprintId && keyResultId) {
  // Verificare che il Key Result appartenga al Quarter Sprint selezionato
  const selectedKR = keyResults.find(kr => kr.id === keyResultId);
  if (selectedKR && selectedKR.quarterSprintId !== quarterSprintId) {
    return "Il Key Result selezionato non appartiene al Quarter Sprint scelto";
  }
}
```

### 5.2 Validazioni Lato Server (API)

```typescript
// POST /api/campaigns

// 1. Autenticazione
if (!session || !session.user) {
  return 401 Unauthorized
}

// 2. Autorizzazione (solo admin e marketing manager)
const userRole = await getUserRole(session.user.id);
if (userRole !== "admin" && userRole !== "MARKETING_MANAGER") {
  return 403 Forbidden
}

// 3. Validazione campi obbligatori
if (!name || !fiscalYearId || !channelId || !ownerId) {
  return 400 Bad Request
}

// 4. Validazione foreign keys
const [fiscalYear, channel, owner] = await Promise.all([
  prisma.fiscalYear.findUnique({ where: { id: fiscalYearId } }),
  prisma.marketingChannel.findUnique({ where: { id: channelId } }),
  prisma.marketingUser.findUnique({ where: { id: ownerId } }),
]);

if (!fiscalYear || !channel || !owner) {
  return 404 Not Found
}

// 5. Validazione Quarter Sprint (se fornito)
if (quarterSprintId) {
  const quarterSprint = await prisma.quarterSprint.findUnique({ 
    where: { id: quarterSprintId } 
  });
  
  if (!quarterSprint) {
    return 404 "Quarter Sprint non trovato"
  }
  
  if (quarterSprint.fiscalYearId !== fiscalYearId) {
    return 400 "Il Quarter Sprint appartiene a un anno fiscale diverso"
  }
}

// 6. Validazione Key Result (se fornito)
if (keyResultId) {
  const keyResult = await prisma.keyResult.findUnique({ 
    where: { id: keyResultId },
    include: { quarterSprint: true }
  });
  
  if (!keyResult) {
    return 404 "Key Result non trovato"
  }
  
  if (quarterSprintId && keyResult.quarterSprintId !== quarterSprintId) {
    return 400 "Il Key Result appartiene a un Quarter Sprint diverso"
  }
}
```

---

## 6. Workflow Completo

### 6.1 Flusso Utente

1. **Utente apre il form** (Admin o Marketing Manager)
   - Click su "Nuova Campagna" nella pagina `/campaigns`
   - Si apre un modal

2. **Compilazione Step 1 - Campi Obbligatori**
   - Nome campagna (input testo)
   - Anno fiscale (dropdown)
   - Canale (dropdown)
   - Owner (dropdown)

3. **Compilazione Step 2 - Campi Opzionali**
   - Quarter Sprint (dropdown, filtrato per anno fiscale)
   - Key Result (dropdown, filtrato per quarter sprint)
   - Goal/Obiettivo (textarea)
   - Stato (dropdown, default: PLANNED)

4. **Validazione e Submit**
   - Validazione lato client
   - POST /api/campaigns
   - Validazione lato server
   - Creazione campagna
   - Redirect o refresh lista

5. **Post-Creazione** (Opzionale)
   - Creare allocation iniziale?
   - Collegare budget requests esistenti?

### 6.2 Flusso Tecnico

```
User Click "Nuova Campagna"
  ↓
Modal Opens
  ↓
Fetch Reference Data:
  - GET /api/fiscal-years
  - GET /api/channels (DA CREARE)
  - GET /api/users
  ↓
User Selects Fiscal Year
  ↓
Fetch Quarter Sprints:
  - GET /api/quarter-sprints?fiscalYearId={id}
  ↓
User Selects Quarter Sprint (opzionale)
  ↓
Fetch Key Results:
  - GET /api/key-results?quarterSprintId={id}
  ↓
User Fills Form
  ↓
Client Validation
  ↓
POST /api/campaigns
  {
    name, fiscalYearId, channelId, ownerId,
    quarterSprintId?, keyResultId?, goal?, status?
  }
  ↓
Server Validation
  ↓
Create Campaign in DB
  ↓
Return Created Campaign
  ↓
Modal Closes
  ↓
Refresh Campaigns List
```

---

## 7. API Endpoint da Creare: POST /api/campaigns

### Endpoint Completo

```typescript
// POST /api/campaigns
export async function POST(request: NextRequest) {
  try {
    // 1. Autenticazione
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Autorizzazione (solo admin e marketing manager)
    const userId = Number(session.user.id);
    const user = await prisma.marketingUser.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    const isAuthorized = user?.role?.key === "admin" || user?.role?.key === "MARKETING_MANAGER";
    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Parse body
    const body = await request.json();
    const { 
      name, 
      fiscalYearId, 
      channelId, 
      ownerId, 
      quarterSprintId, 
      keyResultId, 
      goal, 
      description,
      status = "PLANNED" 
    } = body;

    // 4. Validazione campi obbligatori
    if (!name || !fiscalYearId || !channelId || !ownerId) {
      return NextResponse.json(
        { error: "Nome, anno fiscale, canale e owner sono obbligatori" },
        { status: 400 }
      );
    }

    // 5. Parse e validazione IDs
    const fyId = Number(fiscalYearId);
    const chId = Number(channelId);
    const ownId = Number(ownerId);

    if (isNaN(fyId) || isNaN(chId) || isNaN(ownId)) {
      return NextResponse.json(
        { error: "ID non validi" },
        { status: 400 }
      );
    }

    // 6. Validazione foreign keys obbligatori
    const [fiscalYear, channel, owner] = await Promise.all([
      prisma.fiscalYear.findUnique({ where: { id: fyId } }),
      prisma.marketingChannel.findUnique({ where: { id: chId } }),
      prisma.marketingUser.findUnique({ where: { id: ownId } }),
    ]);

    if (!fiscalYear) {
      return NextResponse.json({ error: "Anno fiscale non trovato" }, { status: 404 });
    }
    if (!channel) {
      return NextResponse.json({ error: "Canale non trovato" }, { status: 404 });
    }
    if (!owner) {
      return NextResponse.json({ error: "Owner non trovato" }, { status: 404 });
    }

    // 7. Validazione e parsing Quarter Sprint (se fornito)
    let resolvedQuarterSprintId: number | null = null;
    if (quarterSprintId) {
      const qsId = Number(quarterSprintId);
      if (isNaN(qsId)) {
        return NextResponse.json({ error: "Quarter Sprint ID non valido" }, { status: 400 });
      }

      const quarterSprint = await prisma.quarterSprint.findUnique({ 
        where: { id: qsId },
        select: { id: true, fiscalYearId: true }
      });

      if (!quarterSprint) {
        return NextResponse.json({ error: "Quarter Sprint non trovato" }, { status: 404 });
      }

      // IMPORTANTE: Verificare che il Quarter Sprint appartenga allo stesso fiscal year
      if (quarterSprint.fiscalYearId !== fyId) {
        return NextResponse.json({ 
          error: "Il Quarter Sprint appartiene a un anno fiscale diverso" 
        }, { status: 400 });
      }

      resolvedQuarterSprintId = qsId;
    }

    // 8. Validazione e parsing Key Result (se fornito)
    let resolvedKeyResultId: number | null = null;
    if (keyResultId) {
      const krId = Number(keyResultId);
      if (isNaN(krId)) {
        return NextResponse.json({ error: "Key Result ID non valido" }, { status: 400 });
      }

      const keyResult = await prisma.keyResult.findUnique({ 
        where: { id: krId },
        select: { id: true, quarterSprintId: true }
      });

      if (!keyResult) {
        return NextResponse.json({ error: "Key Result non trovato" }, { status: 404 });
      }

      // IMPORTANTE: Verificare che il Key Result appartenga allo stesso Quarter Sprint
      if (resolvedQuarterSprintId && keyResult.quarterSprintId !== resolvedQuarterSprintId) {
        return NextResponse.json({ 
          error: "Il Key Result appartiene a un Quarter Sprint diverso" 
        }, { status: 400 });
      }

      resolvedKeyResultId = krId;
    }

    // 9. Validazione status
    const validStatuses = ["PLANNED", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"];
    const campaignStatus = validStatuses.includes(status) ? status : "PLANNED";

    // 10. Creazione campagna
    const createData: any = {
      name: String(name).trim(),
      description: description ? String(description).trim() : null,
      goal: goal ? String(goal).trim() : null,
      status: campaignStatus,
      fiscalYear: { connect: { id: fyId } },
      channel: { connect: { id: chId } },
      owner: { connect: { id: ownId } },
    };

    if (resolvedQuarterSprintId) {
      createData.quarterSprint = { connect: { id: resolvedQuarterSprintId } };
    }

    if (resolvedKeyResultId) {
      createData.keyResult = { connect: { id: resolvedKeyResultId } };
    }

    const created = await prisma.campaign.create({
      data: createData,
      include: {
        channel: { select: { id: true, name: true, slug: true } },
        owner: { select: { id: true, fullName: true, email: true } },
        fiscalYear: { select: { id: true, code: true, label: true } },
        quarterSprint: {
          include: {
            objective: {
              select: { id: true, title: true, description: true, status: true }
            }
          }
        },
        keyResult: {
          select: { 
            id: true, title: true, metric: true, 
            targetValue: true, progressValue: true, status: true 
          }
        },
      },
    });

    return NextResponse.json({ data: created }, { status: 201 });

  } catch (error) {
    console.error("POST /api/campaigns error", error);
    return NextResponse.json(
      { 
        error: "Impossibile creare la campagna", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
```

---

## 8. API Endpoint da Creare: GET /api/channels

### Endpoint Semplice

```typescript
// GET /api/channels
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const channels = await prisma.marketingChannel.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
      },
    });

    return NextResponse.json(channels);
  } catch (error) {
    console.error("Error fetching channels:", error);
    return NextResponse.json(
      { error: "Failed to fetch channels" },
      { status: 500 }
    );
  }
}
```

---

## 9. Componente Modal

### Struttura Consigliata

Basandosi su `CreateObjectiveModal.tsx` che funziona correttamente:

```typescript
"use client";

import { useState, useEffect } from "react";
import { Modal, Input, Select, Button, useToast } from "@/components/ui";

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CampaignFormData) => Promise<void>;
  fiscalYears: Array<{ id: number; code: string; label: string }>;
}

type CampaignFormData = {
  name: string;
  fiscalYearId: number;
  channelId: number;
  ownerId: number;
  quarterSprintId?: number;
  keyResultId?: number;
  goal?: string;
  description?: string;
  status: string;
};

export function CreateCampaignModal({ 
  isOpen, 
  onClose, 
  onSave, 
  fiscalYears 
}: CreateCampaignModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  // Reference data
  const [channels, setChannels] = useState([]);
  const [users, setUsers] = useState([]);
  const [quarterSprints, setQuarterSprints] = useState([]);
  const [keyResults, setKeyResults] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    fiscalYearId: "",
    channelId: "",
    ownerId: "",
    quarterSprintId: "",
    keyResultId: "",
    goal: "",
    description: "",
    status: "PLANNED",
  });

  // Fetch initial data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
      // Auto-select first fiscal year
      if (fiscalYears.length > 0 && !formData.fiscalYearId) {
        setFormData(prev => ({ ...prev, fiscalYearId: String(fiscalYears[0].id) }));
      }
    }
  }, [isOpen]);

  // Fetch quarter sprints when fiscal year changes
  useEffect(() => {
    if (formData.fiscalYearId) {
      fetchQuarterSprints(Number(formData.fiscalYearId));
    } else {
      setQuarterSprints([]);
      setKeyResults([]);
    }
  }, [formData.fiscalYearId]);

  // Fetch key results when quarter sprint changes
  useEffect(() => {
    if (formData.quarterSprintId) {
      fetchKeyResults(Number(formData.quarterSprintId));
    } else {
      setKeyResults([]);
    }
  }, [formData.quarterSprintId]);

  const fetchInitialData = async () => {
    setLoadingData(true);
    try {
      const [channelsRes, usersRes] = await Promise.all([
        fetch("/api/channels", { credentials: "include" }),
        fetch("/api/users", { credentials: "include" }),
      ]);

      if (channelsRes.ok) {
        const channelsData = await channelsRes.json();
        setChannels(channelsData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast({ 
        variant: "error", 
        title: "Errore", 
        description: "Impossibile caricare i dati di riferimento" 
      });
    } finally {
      setLoadingData(false);
    }
  };

  const fetchQuarterSprints = async (fiscalYearId: number) => {
    try {
      const res = await fetch(
        `/api/quarter-sprints?fiscalYearId=${fiscalYearId}`, 
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        setQuarterSprints(data.data || data || []);
      }
    } catch (error) {
      console.error("Error fetching quarter sprints:", error);
    }
  };

  const fetchKeyResults = async (quarterSprintId: number) => {
    try {
      const res = await fetch(
        `/api/key-results?quarterSprintId=${quarterSprintId}`, 
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        setKeyResults(data.data || data || []);
      }
    } catch (error) {
      console.error("Error fetching key results:", error);
    }
  };

  const handleSave = async () => {
    // Client validation
    if (!formData.name.trim()) {
      toast({ variant: "warning", title: "Nome richiesto", description: "Inserisci un nome per la campagna" });
      return;
    }
    if (!formData.fiscalYearId) {
      toast({ variant: "warning", title: "Anno fiscale richiesto" });
      return;
    }
    if (!formData.channelId) {
      toast({ variant: "warning", title: "Canale richiesto" });
      return;
    }
    if (!formData.ownerId) {
      toast({ variant: "warning", title: "Owner richiesto" });
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name: formData.name.trim(),
        fiscalYearId: Number(formData.fiscalYearId),
        channelId: Number(formData.channelId),
        ownerId: Number(formData.ownerId),
        quarterSprintId: formData.quarterSprintId ? Number(formData.quarterSprintId) : undefined,
        keyResultId: formData.keyResultId ? Number(formData.keyResultId) : undefined,
        goal: formData.goal.trim() || undefined,
        description: formData.description.trim() || undefined,
        status: formData.status,
      });
      
      // Reset form on success
      resetForm();
      onClose();
    } catch (error) {
      // Error handled by parent
      console.error("Error saving campaign:", error);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      fiscalYearId: fiscalYears.length > 0 ? String(fiscalYears[0].id) : "",
      channelId: "",
      ownerId: "",
      quarterSprintId: "",
      keyResultId: "",
      goal: "",
      description: "",
      status: "PLANNED",
    });
  };

  const handleClose = () => {
    if (!saving) {
      resetForm();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Crea Nuova Campagna" size="lg">
      <div className="space-y-6">
        {loadingData && (
          <div className="text-sm text-[var(--color-neutral-500)]">
            Caricamento dati...
          </div>
        )}

        {/* Grid layout 2 colonne */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          
          {/* Nome - full width */}
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium">
              Nome Campagna <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Es: Campagna Social Media Q1"
              disabled={saving}
            />
          </div>

          {/* Anno Fiscale */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Anno Fiscale <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.fiscalYearId}
              onChange={(e) => setFormData({ 
                ...formData, 
                fiscalYearId: e.target.value,
                quarterSprintId: "", // Reset dipendenze
                keyResultId: ""
              })}
              disabled={saving}
            >
              <option value="">Seleziona...</option>
              {fiscalYears.map((fy) => (
                <option key={fy.id} value={fy.id}>
                  {fy.label} ({fy.code})
                </option>
              ))}
            </Select>
          </div>

          {/* Canale */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Canale <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.channelId}
              onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
              disabled={saving || loadingData}
            >
              <option value="">Seleziona...</option>
              {channels.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Owner - full width */}
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium">
              Owner <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.ownerId}
              onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
              disabled={saving || loadingData}
            >
              <option value="">Seleziona...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName} ({user.email})
                </option>
              ))}
            </Select>
          </div>

          {/* Quarter Sprint */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Quarter Sprint (opzionale)
            </label>
            <Select
              value={formData.quarterSprintId}
              onChange={(e) => setFormData({ 
                ...formData, 
                quarterSprintId: e.target.value,
                keyResultId: "" // Reset dipendenza
              })}
              disabled={saving || !formData.fiscalYearId}
            >
              <option value="">Nessuno</option>
              {quarterSprints.map((qs) => (
                <option key={qs.id} value={qs.id}>
                  {qs.shortCode || qs.code || qs.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Key Result */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Key Result (opzionale)
            </label>
            <Select
              value={formData.keyResultId}
              onChange={(e) => setFormData({ ...formData, keyResultId: e.target.value })}
              disabled={saving || !formData.quarterSprintId}
            >
              <option value="">Nessuno</option>
              {keyResults.map((kr) => (
                <option key={kr.id} value={kr.id}>
                  {kr.title}
                </option>
              ))}
            </Select>
          </div>

          {/* Goal - full width */}
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium">
              Goal/Obiettivo (opzionale)
            </label>
            <textarea
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              placeholder="Descrizione dell'obiettivo della campagna..."
              disabled={saving}
              rows={3}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-[var(--surface)] px-3 py-2 text-sm"
            />
          </div>

          {/* Stato */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Stato
            </label>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              disabled={saving}
            >
              <option value="PLANNED">Pianificata</option>
              <option value="ACTIVE">Attiva</option>
              <option value="PAUSED">In pausa</option>
              <option value="COMPLETED">Completata</option>
              <option value="CANCELLED">Cancellata</option>
            </Select>
          </div>
        </div>

        {/* Pulsanti */}
        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Annulla
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || loadingData}>
            {saving ? "Creazione..." : "Crea Campagna"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
```

---

## 10. Integrazione nel CampaignsList

### Stato da Aggiungere
```typescript
const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
```

### Handler da Aggiungere
```typescript
const handleCreateCampaign = async (data: CampaignFormData) => {
  try {
    const response = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(errorData.error || errorData.details || "Failed to create campaign");
    }

    toast({ variant: "success", title: "Campagna creata", description: "La campagna è stata creata con successo" });
    await fetchCampaigns(); // Refresh lista
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore nella creazione della campagna";
    toast({ variant: "error", title: "Errore", description: message });
    throw error;
  }
};
```

### Pulsante da Aggiungere
```typescript
// Solo se utente è admin o marketing manager
const userRole = (session.user as any)?.role;
const canCreateCampaign = userRole === "admin" || userRole === "MARKETING_MANAGER";

{canCreateCampaign && (
  <Button
    variant="primary"
    size="sm"
    onClick={() => setIsCreateModalOpen(true)}
  >
    + Nuova Campagna
  </Button>
)}
```

### Modal Render
```typescript
<CreateCampaignModal
  isOpen={isCreateModalOpen}
  onClose={() => setIsCreateModalOpen(false)}
  onSave={handleCreateCampaign}
  fiscalYears={fiscalYears}
/>
```

---

## 11. Checklist Implementazione

### Phase 1: API Endpoints
- [ ] Creare `GET /api/channels`
- [ ] Creare `POST /api/campaigns`
- [ ] Testare entrambi gli endpoint con Postman/curl

### Phase 2: Componente Modal
- [ ] Creare `CreateCampaignModal.tsx`
- [ ] Implementare fetch dati di riferimento
- [ ] Implementare validazione client
- [ ] Implementare gestione errori

### Phase 3: Integrazione
- [ ] Aggiungere stato e handlers in `CampaignsList.tsx`
- [ ] Aggiungere pulsante "Nuova Campagna"
- [ ] Aggiungere render del modal
- [ ] Verificare permessi (solo admin/marketing manager)

### Phase 4: Testing
- [ ] Test creazione campagna minima (solo campi obbligatori)
- [ ] Test creazione campagna completa (tutti i campi)
- [ ] Test validazioni (campi obbligatori mancanti)
- [ ] Test validazioni (foreign keys non validi)
- [ ] Test validazioni (quarter sprint/key result mismatch)
- [ ] Test permessi (requester non può creare)
- [ ] Test permessi (admin può creare)
- [ ] Test permessi (marketing manager può creare)
- [ ] Verificare che la campagna appaia nella lista
- [ ] Verificare che la campagna sia selezionabile in "Nuova Richiesta Budget"

---

## 12. Note Importanti

### Differenza con Obiettivi
- Gli **Obiettivi** possono essere creati solo da Admin
- Le **Campagne** possono essere create da Admin E Marketing Manager
- Questo richiede un controllo autorizzazione diverso

### Allocazioni
- Le allocazioni possono essere create **insieme** alla campagna (nested create)
- OPPURE possono essere create **dopo** tramite PATCH /api/campaigns/[id]
- **Suggerimento**: Per semplicità, non creare allocations nel form iniziale
  - L'utente può aggiungerle dopo tramite l'interfaccia di modifica esistente

### Budget Requests
- Non collegare automaticamente budget requests esistenti
- Il collegamento avviene tramite il form "Nuova Richiesta Budget"
- Una campagna appena creata parte senza budget requests collegati

### Z-Index del Modal
- Usare `z-[100]` per il backdrop
- Usare `z-[101]` per il contenuto
- Assicurarsi che non ci siano conflitti con sidebar (z-50)

---

## 13. Possibili Problemi e Soluzioni

### Problema: Canali vuoti
**Causa**: API /api/channels non esiste
**Soluzione**: Creare l'endpoint prima di implementare il form

### Problema: Quarter Sprint non filtra per fiscal year
**Causa**: Fetch non passa il parametro fiscalYearId
**Soluzione**: Usare template string con parametro

### Problema: Key Result non filtra per quarter sprint
**Causa**: Fetch non passa il parametro quarterSprintId
**Soluzione**: Usare template string con parametro

### Problema: Modal non appare o appare dietro
**Causa**: Z-index troppo basso o sidebar con z-index alto
**Soluzione**: Usare z-[100] e z-[101]

### Problema: Form non scrollabile
**Causa**: max-h non impostato o overflow nascosto
**Soluzione**: Usare `max-h-[90vh] overflow-y-auto`

### Problema: Type errors con ChannelOption[]
**Causa**: Array.from().values() ritorna Iterator<unknown>
**Soluzione**: Cast esplicito `as ChannelOption[]`

---

## 14. Ordine di Implementazione Consigliato

1. **Step 1**: Creare `GET /api/channels`
   - Testare con browser: `http://localhost:3000/api/channels`
   - Verificare che ritorni array di canali

2. **Step 2**: Creare `POST /api/campaigns`
   - Testare con Postman/curl
   - Testare tutti i casi di validazione
   - Verificare che la campagna venga creata nel database

3. **Step 3**: Creare `CreateCampaignModal.tsx`
   - Partire dal template di `CreateObjectiveModal.tsx`
   - Implementare un campo alla volta
   - Testare il rendering senza salvare

4. **Step 4**: Integrare in `CampaignsList.tsx`
   - Aggiungere stato
   - Aggiungere handler
   - Aggiungere pulsante
   - Aggiungere render modal

5. **Step 5**: Testing E2E
   - Creare campagna minima
   - Creare campagna completa
   - Verificare in lista
   - Verificare in "Nuova Richiesta Budget"

---

## 15. Esempio Payload POST

### Campagna Minima
```json
{
  "name": "Campagna Test",
  "fiscalYearId": 1,
  "channelId": 1,
  "ownerId": 1
}
```

### Campagna Completa
```json
{
  "name": "Campagna Social Media Q1 2025",
  "description": "Campagna di brand awareness su social media",
  "fiscalYearId": 1,
  "channelId": 1,
  "ownerId": 2,
  "quarterSprintId": 3,
  "keyResultId": 5,
  "goal": "Aumentare follower del 30%",
  "status": "PLANNED"
}
```

---

## Conclusione

L'implementazione richiede:
1. **2 nuovi file**: `CreateCampaignModal.tsx`, `channels/route.ts`
2. **1 endpoint modificato**: `campaigns/route.ts` (aggiungere POST)
3. **1 componente modificato**: `CampaignsList.tsx` (aggiungere integrazione)

**Stima tempo**: ~2 ore per implementazione completa + testing

**Rischio**: Basso se si seguono i pattern esistenti (CreateObjectiveModal funziona)

**Prossimo passo**: Iniziare con Step 1 (creare GET /api/channels)

