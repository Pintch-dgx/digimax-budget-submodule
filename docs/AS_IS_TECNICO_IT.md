# 📋 Documentazione Tecnica AS IS - Digimax Budget Hub
## Struttura Attuale per Deploy in Produzione

**Versione**: 0.1.0  
**Data**: Novembre 2024  
**Destinatari**: Team IT / Infrastructure  
**Obiettivo**: Documentazione completa della struttura attuale dell'applicazione per supportare il deployment in produzione

---

## 📑 Indice

1. [Panoramica Generale](#1-panoramica-generale)
2. [Architettura dell'Applicazione](#2-architettura-dellapplicazione)
3. [Stack Tecnologico](#3-stack-tecnologico)
4. [Database Schema](#4-database-schema)
5. [API Endpoints](#5-api-endpoints)
6. [Autenticazione e Autorizzazione](#6-autenticazione-e-autorizzazione)
7. [Struttura del Progetto](#7-struttura-del-progetto)
8. [Configurazioni e Variabili Ambiente](#8-configurazioni-e-variabili-ambiente)
9. [Requisiti di Deployment](#9-requisiti-di-deployment)
10. [Sicurezza](#10-sicurezza)
11. [Performance e Scalabilità](#11-performance-e-scalabilità)
12. [Monitoring e Logging](#12-monitoring-e-logging)
13. [Endpoint di Debug da Rimuovere](#13-endpoint-di-debug-da-rimuovere)
14. [Checklist Pre-Produzione](#14-checklist-pre-produzione)

---

## 1. Panoramica Generale

### 1.1 Descrizione
L'applicazione **Digimax Budget Hub** è una Single Page Application (SPA) sviluppata con Next.js che gestisce il budget dell'azienda Digimax. L'applicazione permette di:
- Gestire campagne marketing e le loro allocazioni di budget
- Creare e approvare richieste di budget
- Tracciare obiettivi strategici (OKR) e Quarter Sprints
- Visualizzare dashboard con metriche e insight operativi
- Gestire Key Results e metriche di performance

### 1.2 Tipo di Applicazione
- **Framework**: Next.js 16.0.1 (App Router)
- **Runtime**: Node.js (minimo 18.x, testato con 22.x)
- **Pattern**: Server-Side Rendering (SSR) + Client-Side Rendering (CSR)
- **Database**: SQLite (sviluppo) → PostgreSQL (produzione)

### 1.3 Stato Attuale
- ✅ **Sviluppo**: Completato e funzionante
- ✅ **Testing**: Testato localmente con dati demo
- ⚠️ **Produzione**: Da configurare (database, variabili ambiente, sicurezza)

---

## 2. Architettura dell'Applicazione

### 2.1 Architettura Generale

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Browser                          │
│  (React 19.2.0 + Tailwind CSS 4)                           │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Application                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Middleware (Authentication Guard)                   │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────▼────────────────────────────────┐   │
│  │  App Router (Pages)                                 │   │
│  │  - /dashboard                                       │   │
│  │  - /campaigns                                       │   │
│  │  - /budget-requests                                 │   │
│  │  - /approvals (admin only)                          │   │
│  │  - /okr (admin only)                                │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────▼────────────────────────────────┐   │
│  │  API Routes (/api/*)                                │   │
│  │  - Autenticazione (NextAuth)                        │   │
│  │  - CRUD operations                                  │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────▼────────────────────────────────┐   │
│  │  Business Logic Layer                               │   │
│  │  - Dashboard Service                                │   │
│  │  - Role Guards                                      │   │
│  │  - Session Management                               │   │
│  └────────────────────┬────────────────────────────────┘   │
└───────────────────────┼────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Prisma ORM                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Prisma Client                                       │   │
│  └────────────────────┬────────────────────────────────┘   │
└───────────────────────┼────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database                                  │
│  SQLite (dev) / PostgreSQL (prod)                          │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Flusso di Autenticazione

```
1. Utente accede a /signin
   ↓
2. Inserisce email/password
   ↓
3. CredentialsProvider (NextAuth) verifica credenziali nel DB
   ↓
4. Se valide, crea JWT token con:
   - userId
   - email
   - name (fullName)
   - role (da MarketingRole)
   ↓
5. Token salvato in cookie HTTP-only
   ↓
6. Middleware verifica token su ogni richiesta
   ↓
7. Se token valido → accesso consentito
   Se token mancante/invalido → redirect a /signin
```

### 2.3 Pattern di Rendering

- **Server Components**: Pagine principali (dashboard, campagne, ecc.)
- **Client Components**: Componenti interattivi (form, tabelle editabili, UI dinamica)
- **API Routes**: Tutte le operazioni CRUD e logica di business

---

## 3. Stack Tecnologico

### 3.1 Dependencies Principali

| Package | Versione | Scopo |
|---------|----------|-------|
| **next** | 16.0.1 | Framework React con SSR/SSG |
| **react** | 19.2.0 | Libreria UI framework |
| **react-dom** | 19.2.0 | Rendering React |
| **@prisma/client** | 6.18.0 | ORM per accesso database |
| **next-auth** | 4.24.13 | Autenticazione e gestione sessioni |
| **bcryptjs** | 2.4.3 | Hash password |
| **tailwindcss** | 4 | Framework CSS utility-first |
| **typescript** | 5 | Type checking e type safety |

### 3.2 DevDependencies Principali

| Package | Versione | Scopo |
|---------|----------|-------|
| **prisma** | 6.18.0 | CLI per migrations e schema management |
| **eslint** | 9 | Linting del codice |
| **eslint-config-next** | 16.0.1 | Configurazione ESLint per Next.js |

### 3.3 Scripts NPM Disponibili

```json
{
  "dev": "next dev",                    // Server di sviluppo
  "build": "next build",                 // Build produzione
  "start": "next start",                  // Avvia server produzione
  "lint": "eslint",                      // Linting
  "db:push": "prisma db push",           // Sincronizza schema DB
  "db:seed": "prisma db seed",           // Popola DB con seed
  "db:seed:demo": "node prisma/seed-demo-js.js",  // Seed dati demo
  "prisma:generate": "prisma generate"    // Genera Prisma Client
}
```

### 3.4 Requisiti di Sistema

- **Node.js**: ≥ 18.x (testato con 22.x)
- **npm**: Incluso con Node.js
- **Database**: 
  - **Sviluppo**: SQLite (file-based)
  - **Produzione**: PostgreSQL 12+ (consigliato 14+)

---

## 4. Database Schema

### 4.1 Provider Database

- **Sviluppo**: SQLite (`file:./prisma/dev.db`)
- **Produzione**: PostgreSQL (da configurare)

### 4.2 Modelli Principali

#### 4.2.1 Autenticazione e Utenti

**MarketingRole**
- `id` (Int, PK)
- `key` (String, unique) - Es: "admin", "manager", "user"
- `name` (String) - Nome visualizzato
- `description` (String?)
- `visibility` (VisibilityScope enum)

**MarketingUser**
- `id` (Int, PK)
- `fullName` (String)
- `email` (String, unique)
- `password` (String) - Hash bcrypt
- `roleId` (Int, FK → MarketingRole)
- Relazioni: `role`, `requests`, `ownedCampaigns`, `ownedKeyResults`, `ownedObjectives`

**VerticalArea**
- `id` (Int, PK)
- `slug` (String, unique)
- `name` (String)
- `description` (String?)

**MarketingUserVertical**
- Tabella di join molti-a-molti tra User e VerticalArea
- `userId`, `verticalId`, `visibility`

#### 4.2.2 Budget e Campagne

**FiscalYear**
- `id` (Int, PK)
- `code` (String, unique) - Es: "FY24", "FY25"
- `label` (String)
- `totalBudget` (Int)
- `currency` (String, default: "EUR")

**BudgetSnapshot**
- `id` (Int, PK)
- `fiscalYearId` (Int, FK)
- `label` (String) - Es: "Q1 2024", "Q2 2024"
- `amount` (Int)
- `trend` (MetricTrend enum: UP, DOWN, FLAT)
- `changePercentage` (Float)
- Unique constraint: `[fiscalYearId, label]`

**Campaign**
- `id` (Int, PK)
- `name` (String)
- `description` (String?)
- `fiscalYearId` (Int, FK)
- `channelId` (Int, FK → MarketingChannel)
- `ownerId` (Int, FK → MarketingUser)
- `quarterSprintId` (Int?, FK → QuarterSprint)
- `keyResultId` (Int?, FK → KeyResult)
- `status` (CampaignStatus enum)
- `goal` (String?) - Key Result obiettivo

**BudgetAllocation**
- `id` (Int, PK)
- `campaignId` (Int, FK)
- `fiscalYearId` (Int, FK)
- `quarterSprintId` (Int?, FK)
- `allocated` (Int) - Budget allocato
- `spent` (Int, default: 0) - Budget speso
- Unique constraint: `[campaignId, fiscalYearId, quarterSprintId]`

**BudgetRequest**
- `id` (Int, PK)
- `title` (String)
- `fiscalYearId` (Int, FK)
- `requesterId` (Int, FK → MarketingUser)
- `quarterSprintId` (Int?, FK)
- `keyResultId` (Int?, FK)
- `campaignId` (Int?, FK)
- `amount` (Int)
- `dueDate` (DateTime)
- `status` (BudgetRequestStatus enum: DRAFT, PENDING_APPROVAL, APPROVED, REJECTED)
- `linkStatus` (BudgetRequestLinkStatus enum)
- `notes` (String?)

#### 4.2.3 OKR (Objectives and Key Results)

**Objective**
- `id` (Int, PK)
- `title` (String)
- `description` (String?)
- `fiscalYearId` (Int, FK)
- `ownerId` (Int?, FK → MarketingUser)
- `status` (ObjectiveStatus enum: ACTIVE, ARCHIVED, CANCELLED)
- `progress` (Float?)

**QuarterSprint**
- `id` (Int, PK)
- `name` (String)
- `code` (String?, unique)
- `shortCode` (String?)
- `quarter` (Int) - 1-4
- `startDate` (DateTime)
- `endDate` (DateTime)
- `fiscalYearId` (Int, FK)
- `objectiveId` (Int, FK → Objective)
- `objectiveSummary` (String?)

**KeyResult**
- `id` (Int, PK)
- `title` (String)
- `metric` (String)
- `targetValue` (Float)
- `progressValue` (Float?, default: 0)
- `unit` (String, default: "unit")
- `weight` (Int, default: 100)
- `status` (KeyResultStatus enum)
- `quarterSprintId` (Int, FK → QuarterSprint)
- `ownerId` (Int?, FK → MarketingUser)

**MarketingChannel**
- `id` (Int, PK)
- `name` (String)
- `slug` (String, unique)
- `description` (String?)

**OperationalInsight**
- `id` (Int, PK)
- `fiscalYearId` (Int, FK)
- `title` (String)
- `description` (String)
- `priority` (Int, default: 2)
- `insightType` (InsightType enum)
- `relatedKeyResultId` (Int?, FK → KeyResult)

### 4.3 Enum Types

```typescript
enum VisibilityScope {
  FULL, VERTICAL, LIMITED
}

enum MetricTrend {
  UP, DOWN, FLAT
}

enum BudgetRequestStatus {
  DRAFT, PENDING_APPROVAL, APPROVED, REJECTED
}

enum BudgetRequestLinkStatus {
  UNDEFINED_OBJECTIVE, ASSIGNMENT_PENDING, ASSIGNED_TO_CAMPAIGN
}

enum ObjectiveStatus {
  ACTIVE, ARCHIVED, CANCELLED
}

enum KeyResultStatus {
  NOT_STARTED, ON_TRACK, AT_RISK, OFF_TRACK, COMPLETED
}

enum CampaignStatus {
  PLANNED, ACTIVE, PAUSED, COMPLETED, CANCELLED
}

enum InsightType {
  RECOMMENDATION, WARNING, OPPORTUNITY, ACHIEVEMENT
}
```

### 4.4 Indici Database

Gli indici principali sono definiti su:
- `MarketingUser.email` (unique)
- `BudgetRequest.[status, dueDate]`
- `Campaign.[status, quarterSprintId, keyResultId, ownerId]`
- `QuarterSprint.[fiscalYearId, objectiveId, fiscalYearId+quarter]`
- `KeyResult.[quarterSprintId, ownerId, status]`

---

## 5. API Endpoints

### 5.1 Autenticazione

#### `POST /api/auth/[...nextauth]`
- **Provider**: NextAuth CredentialsProvider
- **Endpoint**: `/api/auth/signin`, `/api/auth/signout`, `/api/auth/session`
- **Autenticazione**: Gestita da NextAuth
- **Descrizione**: Gestisce login, logout e refresh session

### 5.2 Budget Requests

#### `GET /api/budget-requests`
- **Autenticazione**: Richiesta (session)
- **Query Parameters**:
  - `status` (opzionale): filtro per stato
  - `fiscalYearId` (opzionale): filtro per anno fiscale
  - `requesterId` (opzionale): filtro per richiedente
  - `search` (opzionale): ricerca nel titolo/note
  - `page` (opzionale, default: 1): numero pagina
  - `pageSize` (opzionale, default: 10, max: 50): elementi per pagina
- **Response**: `{ data: BudgetRequest[], meta: { total, page, pageSize, totalPages } }`

#### `POST /api/budget-requests`
- **Autenticazione**: Richiesta (session)
- **Body**: 
  ```json
  {
    "title": string,
    "amount": number,
    "dueDate": string (ISO date),
    "fiscalYearId": number,
    "quarterSprintId": number?,
    "keyResultId": number?,
    "notes": string?
  }
  ```
- **Response**: `{ data: BudgetRequest }`

#### `GET /api/budget-requests/[id]`
- **Autenticazione**: Richiesta (session)
- **Response**: `{ data: BudgetRequest }`

#### `PUT /api/budget-requests/[id]`
- **Autenticazione**: Richiesta (session)
- **Body**: Campi opzionali da aggiornare (incluso `status`)
- **Response**: `{ data: BudgetRequest }`

#### `DELETE /api/budget-requests/[id]`
- **Autenticazione**: Richiesta (session)
- **Autorizzazione**: Solo admin (`role === "admin"`)
- **Response**: `{ success: true }`

### 5.3 Campaigns

#### `GET /api/campaigns`
- **Autenticazione**: Richiesta (session)
- **Query Parameters**:
  - `fiscalYearId` (opzionale): filtro per anno fiscale
  - `quarterSprintId` (opzionale): filtro per quarter sprint
- **Response**: `{ data: Campaign[] }` con `allocations`, `channel`, `owner`, `quarterSprint`

#### `GET /api/campaigns/[id]`
- **Autenticazione**: Richiesta (session)
- **Response**: `{ data: Campaign }`

#### `PATCH /api/campaigns/[id]`
- **Autenticazione**: Richiesta (session)
- **Body**: Campi opzionali:
  ```json
  {
    "goal": string?,
    "quarterSprintId": number?,
    "allocation": {
      "allocated": number?,
      "spent": number?
    }
  }
  ```
- **Response**: `{ data: Campaign }`

### 5.4 Objectives (OKR)

#### `GET /api/objectives`
- **Autenticazione**: Richiesta (session)
- **Autorizzazione**: Solo admin
- **Response**: `{ data: Objective[] }` con `quarterSprints` e `keyResults` nested

#### `POST /api/objectives`
- **Autenticazione**: Richiesta (session)
- **Autorizzazione**: Solo admin
- **Body**: 
  ```json
  {
    "title": string,
    "description": string?,
    "fiscalYearId": number,
    "ownerId": number?,
    "status": ObjectiveStatus?,
    "progress": number?
  }
  ```
- **Response**: `{ data: Objective }`

#### `GET /api/objectives/[id]`
- **Autenticazione**: Richiesta (session)
- **Autorizzazione**: Solo admin
- **Response**: `{ data: Objective }`

#### `PATCH /api/objectives/[id]`
- **Autenticazione**: Richiesta (session)
- **Autorizzazione**: Solo admin
- **Body**: Campi opzionali da aggiornare
- **Response**: `{ data: Objective }`

### 5.5 Quarter Sprints

#### `GET /api/quarter-sprints`
- **Autenticazione**: Non richiesta (pubblico)
- **Query Parameters**:
  - `fiscalYearId` (opzionale): filtro per anno fiscale
  - `objectiveId` (opzionale): filtro per obiettivo
- **Response**: `{ data: QuarterSprint[] }` con `objective` e `_count` (campaigns, budgetRequests)

#### `POST /api/quarter-sprints`
- **Autenticazione**: Richiesta (session)
- **Autorizzazione**: Solo admin
- **Body**:
  ```json
  {
    "name": string,
    "code": string?,
    "shortCode": string?,
    "quarter": number (1-4),
    "startDate": string (ISO date),
    "endDate": string (ISO date),
    "fiscalYearId": number,
    "objectiveId": number,
    "objectiveSummary": string?
  }
  ```
- **Response**: `{ data: QuarterSprint }`

#### `GET /api/quarter-sprints/[id]`
- **Autenticazione**: Richiesta (session)
- **Response**: `{ data: QuarterSprint }`

#### `PATCH /api/quarter-sprints/[id]`
- **Autenticazione**: Richiesta (session)
- **Autorizzazione**: Solo admin
- **Body**: Campi opzionali da aggiornare
- **Response**: `{ data: QuarterSprint }`

### 5.6 Key Results

#### `GET /api/key-results`
- **Autenticazione**: Richiesta (session)
- **Query Parameters**:
  - `quarterSprintId` (opzionale): filtro per quarter sprint
- **Response**: `{ data: KeyResult[] }`

#### `POST /api/key-results`
- **Autenticazione**: Richiesta (session)
- **Autorizzazione**: Solo admin
- **Body**:
  ```json
  {
    "title": string,
    "metric": string,
    "targetValue": number,
    "progressValue": number?,
    "unit": string?,
    "weight": number?,
    "quarterSprintId": number,
    "ownerId": number?
  }
  ```
- **Response**: `{ data: KeyResult }`

#### `GET /api/key-results/[id]`
- **Autenticazione**: Richiesta (session)
- **Response**: `{ data: KeyResult }`

#### `PATCH /api/key-results/[id]`
- **Autenticazione**: Richiesta (session)
- **Autorizzazione**: Solo admin
- **Body**: Campi opzionali da aggiornare
- **Response**: `{ data: KeyResult }`

### 5.7 Fiscal Years

#### `GET /api/fiscal-years`
- **Autenticazione**: Non richiesta (pubblico)
- **Response**: `FiscalYear[]` (array diretto, non wrapped)

### 5.8 Reports

#### `GET /api/reports/overview`
- **Autenticazione**: Richiesta (session)
- **Response**: Report aggregati (campagne, budget, allocazioni)

### 5.9 Users

#### `GET /api/users`
- **Autenticazione**: Richiesta (session)
- **Autorizzazione**: Solo admin
- **Response**: `{ data: MarketingUser[] }`

### 5.10 ⚠️ Endpoint di Debug (da rimuovere in produzione)

- `GET /api/debug-session` - Debug info sessione
- `POST /api/auth/check-user` - Verifica utente/password
- `GET /api/auth/test` - Test autenticazione
- `GET /api/auth/test-session` - Test sessione
- `GET /api/db/test` - Test connessione database
- `GET /api/users/debug` - Debug utenti

**⚠️ IMPORTANTE**: Questi endpoint devono essere rimossi o protetti/disabilitati in produzione.

---

## 6. Autenticazione e Autorizzazione

### 6.1 Provider di Autenticazione

**NextAuth v4** con CredentialsProvider:
- Autenticazione basata su email/password
- Password hash con bcryptjs
- Sessioni JWT (non database sessions)
- Cookie HTTP-only per sicurezza

### 6.2 Configurazione NextAuth

**File**: `src/lib/auth.ts`

```typescript
{
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 giorni
    updateAge: 24 * 60 * 60,   // 24 ore
  },
  providers: [CredentialsProvider],
  callbacks: {
    jwt: // Salva userId, email, name, role nel token
    session: // Estrae dati dal token alla sessione
  },
  pages: {
    signIn: "/signin"
  }
}
```

### 6.3 Middleware di Protezione

**File**: `middleware.ts`

- **Protezione**: Tutte le route tranne:
  - `/api/*` (API routes gestiscono auth internamente)
  - `/signin`
  - `/_next/*` (Next.js internals)
  - `/favicon.ico`, `/public/*` (static assets)
- **Comportamento**: Se non autenticato → redirect a `/signin`

### 6.4 Role-Based Access Control (RBAC)

**Ruoli attuali**:
- `admin` - Accesso completo (OKR, Approvazioni, Delete)
- Altri ruoli - Accesso limitato (creazione richieste, visualizzazione)

**Implementazione**:
- `src/lib/role-guards.ts`: Funzioni `isAdmin()` e `resolveUserRole()`
- Controlli negli API routes e componenti server

**Endpoint protetti da admin**:
- `GET/POST/PATCH /api/objectives`
- `POST/PATCH /api/quarter-sprints`
- `POST/PATCH /api/key-results`
- `DELETE /api/budget-requests/[id]`
- Pagina `/approvals` (redirect se non admin)
- Pagina `/okr` (solo admin)

### 6.5 Gestione Sessioni

**Helper**: `src/lib/get-session.ts`
- `getSession()`: Utility per ottenere sessione in API routes e server components

**JWT Token contiene**:
- `userId` (string)
- `email` (string)
- `name` (string)
- `role` (string | null)

---

## 7. Struttura del Progetto

### 7.1 Directory Root

```
digimax-budget-marketing/
├── prisma/                    # Database schema e migrations
│   ├── schema.prisma          # Schema Prisma completo
│   ├── migrations/             # Migrations applicate
│   ├── seed-admin.ts          # Script seed utente admin
│   └── seed-demo-js.js         # Script seed dati demo
├── public/                     # Static assets
│   ├── logo.png, logo.svg      # Loghi Digimax
│   └── ...
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   ├── page.tsx           # Dashboard principale
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Stili globali
│   │   └── ...
│   ├── components/            # Componenti React
│   │   ├── ui/                # UI primitives (Button, Input, etc.)
│   │   ├── layout/            # Layout components
│   │   ├── dashboard/         # Dashboard components
│   │   └── ...
│   ├── lib/                   # Utilities e business logic
│   │   ├── auth.ts            # NextAuth config
│   │   ├── db.ts              # Prisma client
│   │   ├── dashboard-service.ts # Dashboard data fetching
│   │   ├── role-guards.ts     # RBAC utilities
│   │   └── ...
│   ├── hooks/                 # Custom React hooks
│   └── types/                 # TypeScript types
├── middleware.ts               # Next.js middleware (auth guard)
├── next.config.ts             # Next.js config
├── package.json               # Dependencies e scripts
├── tsconfig.json              # TypeScript config
└── .gitignore                 # Git ignore rules
```

### 7.2 Struttura API Routes

```
src/app/api/
├── auth/
│   ├── [...nextauth]/route.ts      # NextAuth handler
│   ├── check-user/route.ts         # ⚠️ Debug endpoint
│   ├── test/route.ts               # ⚠️ Debug endpoint
│   └── test-session/route.ts       # ⚠️ Debug endpoint
├── budget-requests/
│   ├── route.ts                    # GET, POST
│   └── [id]/route.ts               # GET, PUT, DELETE
├── campaigns/
│   ├── route.ts                    # GET
│   └── [id]/route.ts               # GET, PATCH
├── objectives/
│   ├── route.ts                    # GET, POST (admin)
│   └── [id]/route.ts               # GET, PATCH (admin)
├── quarter-sprints/
│   ├── route.ts                    # GET, POST (admin)
│   └── [id]/route.ts               # GET, PATCH (admin)
├── key-results/
│   ├── route.ts                    # GET, POST (admin)
│   └── [id]/route.ts               # GET, PATCH (admin)
├── fiscal-years/
│   └── route.ts                    # GET (pubblico)
├── reports/
│   └── overview/route.ts           # GET
├── users/
│   ├── route.ts                     # GET (admin)
│   └── debug/route.ts               # ⚠️ Debug endpoint
├── db/
│   └── test/route.ts                # ⚠️ Debug endpoint
└── debug-session/route.ts           # ⚠️ Debug endpoint
```

### 7.3 Struttura Pages

```
src/app/
├── page.tsx                    # Dashboard principale (/)
├── signin/page.tsx             # Login page
├── campaigns/page.tsx          # Lista campagne
├── budget-requests/
│   ├── page.tsx                # Lista richieste
│   └── new/page.tsx            # Nuova richiesta
├── approvals/page.tsx          # Approvazioni (admin only)
├── okr/page.tsx                # OKR Planner (admin only)
├── reports/page.tsx            # Reports
├── debug-auth/page.tsx         # ⚠️ Debug page
└── test-ui/page.tsx            # ⚠️ UI test page
```

### 7.4 Componenti Principali

**UI Primitives** (`src/components/ui/`):
- `Button.tsx` - Pulsanti con varianti
- `Input.tsx` - Campi input
- `Select.tsx` - Dropdown select
- `Table.tsx` - Tabelle con colonne ridimensionabili
- `Card.tsx` - Card container
- `Badge.tsx` - Badge di stato
- `Modal.tsx` - Modali
- `Toast.tsx` - Notifiche toast
- `Skeleton.tsx` - Loading skeletons

**Layout Components** (`src/components/layout/`):
- `DashboardLayout.tsx` - Layout principale con sidebar
- `DashboardWrapper.tsx` - Wrapper per dashboard
- `AppNav.tsx` - Navigazione sidebar

**Business Components**:
- `CampaignsList.tsx` - Lista campagne con filtri
- `BudgetRequestsList.tsx` - Lista richieste budget
- `ApprovalsList.tsx` - Lista approvazioni
- `OkrSheetManager.tsx` - Gestione OKR (admin)
- `QuarterTimeline.tsx` - Timeline quarter sprints
- `CampaignAllocationsTable.tsx` - Tabella allocazioni

---

## 8. Configurazioni e Variabili Ambiente

### 8.1 Variabili Ambiente Richieste

#### Produzione (obbligatorie)

**AUTH_SECRET**
- **Descrizione**: Chiave segreta per firmare JWT tokens
- **Generazione**: `openssl rand -base64 32`
- **Esempio**: `LS56f9Lw2VvC65ju2j68Wr3a523JWGYqZMZ/eVq1+cI=`
- **⚠️ IMPORTANTE**: Non usare mai quella di sviluppo in produzione

**DATABASE_URL**
- **Sviluppo**: `file:./prisma/dev.db` (SQLite)
- **Produzione**: `postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public`
- **Esempio**: `postgresql://digimax_user:secure_pass@db.digimax.com:5432/digimax_budget?schema=public`
- **⚠️ IMPORTANTE**: Usa SSL in produzione (`?sslmode=require`)

**NEXTAUTH_URL**
- **Descrizione**: URL pubblico dell'applicazione
- **Sviluppo**: `http://localhost:3000`
- **Produzione**: `https://budget.digimax.com` (o dominio reale)
- **⚠️ IMPORTANTE**: Deve corrispondere esattamente al dominio pubblico (no trailing slash)

#### Opzionali

**NODE_ENV**
- **Valore**: `production` (in produzione)
- **Default**: `development` (se non impostato)

**NEXTAUTH_SECRET**
- **Descrizione**: Alias per AUTH_SECRET (NextAuth accetta entrambi)
- **Uso**: Se AUTH_SECRET non è disponibile, usa questo

### 8.2 File di Configurazione

**`.env`** (sviluppo locale)
```env
AUTH_SECRET=LS56f9Lw2VvC65ju2j68Wr3a523JWGYqZMZ/eVq1+cI=
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL=http://localhost:3000
```

**`.env.production`** (non committato, solo esempio)
```env
AUTH_SECRET=<genera-nuovo-secret>
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
NEXTAUTH_URL=https://budget.digimax.com
NODE_ENV=production
```

**⚠️ IMPORTANTE**: Verificare che `.env*` sia in `.gitignore` (già presente)

### 8.3 Next.js Configuration

**File**: `next.config.ts`
```typescript
const nextConfig: NextConfig = {
  /* config options here */
};
```

**Nota**: Configurazione minima attuale. Per produzione può essere necessario aggiungere:
- `output: 'standalone'` (per Docker)
- Configurazione immagini/domini esterni
- Headers di sicurezza

### 8.4 TypeScript Configuration

**File**: `tsconfig.json`
- Target: ES2017
- Module: ESNext
- JSX: react-jsx
- Path aliases: `@/*` → `./src/*`
- Strict mode: abilitato

---

## 9. Requisiti di Deployment

### 9.1 Build di Produzione

**Comandi**:
```bash
npm ci                    # Install dipendenze (clean install)
npm run prisma:generate   # Genera Prisma Client
npm run build             # Build Next.js
npm run start             # Avvia server produzione
```

**Output Build**:
- `.next/` directory contenente:
  - `standalone/` (se configurato)
  - `static/` (assets statici)
  - Server runtime

### 9.2 Database Migrations

**Prisma Migrations**:
```bash
# In produzione
npx prisma migrate deploy
```

**Note**:
- Le migrations sono nella directory `prisma/migrations/`
- `prisma migrate deploy` applica solo le migrations non ancora applicate
- Non esegue seed automaticamente (vedi sezione 9.3)

### 9.3 Seeding Database

**Script disponibili**:
- `npm run db:seed:demo` - Popola DB con dati demo completi
- `prisma/seed-admin.ts` - Crea solo utente admin

**⚠️ IMPORTANTE per Produzione**:
- Non eseguire `db:seed:demo` in produzione (contiene dati di test)
- Creare manualmente almeno un utente admin prima del primo deploy
- Usare script separato per dati iniziali di produzione

**Creazione utente admin**:
```bash
# Opzione 1: Usa script seed-admin.ts
npx tsx prisma/seed-admin.ts

# Opzione 2: SQL diretto (PostgreSQL)
# INSERT INTO MarketingRole (key, name) VALUES ('admin', 'Administrator');
# INSERT INTO MarketingUser (email, password, fullName, roleId) 
# VALUES ('admin@digimax.com', '<bcrypt_hash>', 'Admin User', 1);
```

### 9.4 Requisiti Server

**Node.js**:
- Versione minima: 18.x
- Versione consigliata: 20.x LTS o 22.x
- Memoria: Minimo 512MB, consigliato 1GB+
- CPU: 1 core minimo, 2+ core consigliato

**Database PostgreSQL**:
- Versione minima: 12.x
- Versione consigliata: 14.x o 15.x
- Connection pool: Configurare pool di connessioni (es: PgBouncer)
- Backup: Configurare backup automatici

**Storage**:
- Database: Dimensioni dipendono dai dati (stimare crescita)
- Application: ~100MB per node_modules + build

**Network**:
- Porta: 3000 (default Next.js) o configurabile
- HTTPS: Obbligatorio in produzione
- Firewall: Permettere connessioni al database PostgreSQL

### 9.5 Opzioni di Deployment

#### Opzione A: Vercel (Consigliata)

**Vantaggi**:
- Integrazione nativa con Next.js
- Deploy automatico da GitHub
- SSL automatico
- Database Vercel Postgres disponibile

**Setup**:
1. Collega repository GitHub a Vercel
2. Configura variabili ambiente in Vercel Dashboard
3. Deploy automatico su push

**Database**:
- Usa Vercel Postgres (gestito) o PostgreSQL esterno
- `DATABASE_URL` fornita automaticamente se usi Vercel Postgres

#### Opzione B: Azure Static Web Apps / App Service

**Vantaggi**:
- Integrazione con Azure ecosystem
- Scalabilità enterprise
- Supporto per custom domains

**Setup**:
1. Crea Static Web App in Azure Portal
2. Configura GitHub Actions workflow
3. Configura variabili ambiente in Azure Portal
4. Database: Azure Database for PostgreSQL

#### Opzione C: Docker

**Dockerfile** (da creare):
```dockerfile
FROM node:18-alpine AS base
# ... (vedi docs/DEPLOY.md per Dockerfile completo)
```

**Deploy**:
```bash
docker build -t digimax-budget-hub .
docker run -p 3000:3000 \
  -e AUTH_SECRET=<secret> \
  -e DATABASE_URL=<db-url> \
  -e NEXTAUTH_URL=<url> \
  digimax-budget-hub
```

**Nota**: Richiede configurazione `output: 'standalone'` in `next.config.ts`

#### Opzione D: VM/Self-Hosted

**Setup**:
1. Installa Node.js 18+ su VM
2. Clona repository
3. Configura variabili ambiente
4. Esegui build e start
5. Usa process manager (PM2, systemd)
6. Configura reverse proxy (Nginx, Apache)

---

## 10. Sicurezza

### 10.1 Autenticazione

**Password Storage**:
- Hash con bcryptjs (costo default)
- Password mai salvate in plaintext
- Verifica password con `compare()` di bcryptjs

**Session Management**:
- JWT tokens firmati con `AUTH_SECRET`
- Cookie HTTP-only (non accessibili da JavaScript)
- Session expiration: 30 giorni
- Session refresh: ogni 24 ore

**⚠️ CRITICO**:
- `AUTH_SECRET` deve essere unico per produzione
- Non condividere mai `AUTH_SECRET` pubblicamente
- Rotare `AUTH_SECRET` periodicamente (richiede re-login di tutti gli utenti)

### 10.2 Autorizzazione

**RBAC**:
- Controlli su ogni API route sensibile
- Pagine protette con middleware
- Verifica ruolo (`isAdmin()`) prima di operazioni privilegiate

**Endpoints Protetti**:
- Tutti gli endpoint `/api/*` richiedono autenticazione (tranne quelli pubblici)
- Operazioni admin richiedono `role === "admin"`

### 10.3 Database Security

**Connection String**:
- Usa SSL in produzione (`?sslmode=require`)
- Non committare `DATABASE_URL` in repository
- Usa credenziali forti per database

**SQL Injection**:
- Prisma ORM protegge automaticamente da SQL injection
- Non usare mai query SQL raw senza parametrizzazione

### 10.4 Network Security

**HTTPS**:
- Obbligatorio in produzione
- Configurare certificati SSL/TLS validi
- Redirect HTTP → HTTPS

**CORS**:
- Attualmente non configurato (non necessario per SPA)
- Se necessario, configurare CORS in `next.config.ts`

**Headers di Sicurezza**:
- Non configurati attualmente
- **Raccomandazione**: Aggiungere in produzione:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `X-XSS-Protection: 1; mode=block`
  - `Strict-Transport-Security: max-age=31536000`

### 10.5 Logging e Monitoring

**⚠️ ATTENZIONE**:
- Molti `console.log` nel codice di debug
- Non loggare mai password o token in produzione
- Configurare sistema di logging strutturato (es: Winston, Pino)

**Informazioni Sensibili**:
- Evitare di loggare:
  - Password (anche hash)
  - Token JWT completi
  - `DATABASE_URL` completa
  - Dati personali sensibili

### 10.6 Endpoint di Debug

**⚠️ CRITICO**: Rimuovere o disabilitare in produzione:
- `/api/debug-session`
- `/api/auth/check-user`
- `/api/auth/test`
- `/api/auth/test-session`
- `/api/db/test`
- `/api/users/debug`
- Pagine `/debug-auth`, `/test-ui`

**Raccomandazione**: 
- Rimuovere completamente questi endpoint
- O proteggerli con controllo `NODE_ENV !== "production"`

---

## 11. Performance e Scalabilità

### 11.1 Ottimizzazioni Attuali

**Next.js**:
- Server Components per ridurre bundle JavaScript
- Code splitting automatico
- Image optimization (se configurato)

**Database**:
- Indici su colonne frequenti (email, status, foreign keys)
- Query ottimizzate con Prisma `select` (non fetch tutte le colonne)

**Frontend**:
- Lazy loading components dove possibile
- Memoization con `useMemo` e `useCallback`

### 11.2 Possibili Ottimizzazioni

**Caching**:
- Implementare caching per dati frequenti (fiscal years, channels)
- Cache API responses con `NextResponse` headers
- Considerare Redis per session storage (se scale up)

**Database**:
- Connection pooling (PgBouncer per PostgreSQL)
- Query optimization (analizzare query lente con Prisma logging)
- Considerare read replicas per report pesanti

**CDN**:
- Servire static assets da CDN
- Considerare Vercel Edge Network o Cloudflare

**Pagination**:
- Già implementata per `/api/budget-requests`
- Estendere ad altri endpoint se necessario

### 11.3 Scalabilità

**Orizzontale**:
- Next.js supporta multiple instances
- Usare load balancer (Nginx, AWS ALB)
- Database PostgreSQL può gestire connessioni multiple

**Verticale**:
- Aumentare risorse server (CPU, RAM)
- Upgrade database plan se necessario

**Stima Carico**:
- **Utenti simultanei**: Stimare in base a utilizzo previsto
- **Query al secondo**: Monitorare database metrics
- **Storage**: Stimare crescita dati annuale

---

## 12. Monitoring e Logging

### 12.1 Logging Attuale

**Sviluppo**:
- `console.log` per debug
- Prisma logging abilitato (`log: ["query", "error", "warn"]`)

**Produzione**:
- Prisma logging solo errori (`log: ["error"]`)
- Next.js logging automatico

**⚠️ Problemi**:
- Troppi `console.log` nel codice
- Nessun sistema di logging strutturato
- Log non centralizzati

### 12.2 Raccomandazioni per Produzione

**Sistema di Logging**:
- Implementare logger strutturato (Winston, Pino)
- Log levels: ERROR, WARN, INFO, DEBUG
- Formato JSON per parsing automatico

**Monitoring**:
- Error tracking (Sentry, Rollbar)
- Performance monitoring (New Relic, Datadog)
- Database monitoring (pgAdmin, Azure Monitor)

**Alerting**:
- Alert su errori 5xx
- Alert su database connection failures
- Alert su high response times

**Metriche da Monitorare**:
- Response time API
- Error rate
- Database connection pool usage
- Memory/CPU usage
- Request rate

### 12.3 Health Checks

**Endpoint Consigliati** (da implementare):
- `GET /api/health` - Health check generale
- `GET /api/health/db` - Verifica connessione database

**Esempio**:
```typescript
// GET /api/health
{
  "status": "ok",
  "timestamp": "2024-11-01T12:00:00Z",
  "database": "connected",
  "version": "0.1.0"
}
```

---

## 13. Endpoint di Debug da Rimuovere

### 13.1 Lista Completa

**⚠️ CRITICO**: Questi endpoint devono essere rimossi o disabilitati in produzione:

#### API Routes
1. **`GET /api/debug-session`**
   - File: `src/app/api/debug-session/route.ts`
   - Descrizione: Espone informazioni sessione utente
   - Rischio: Informazioni sensibili esposte

2. **`POST /api/auth/check-user`**
   - File: `src/app/api/auth/check-user/route.ts`
   - Descrizione: Verifica esistenza utente e password
   - Rischio: Possibile bruteforce attack

3. **`GET /api/auth/test`**
   - File: `src/app/api/auth/test/route.ts`
   - Descrizione: Test autenticazione
   - Rischio: Informazioni sistema esposte

4. **`GET /api/auth/test-session`**
   - File: `src/app/api/auth/test-session/route.ts`
   - Descrizione: Test sessione
   - Rischio: Informazioni sessione esposte

5. **`GET /api/db/test`**
   - File: `src/app/api/db/test/route.ts`
   - Descrizione: Test connessione database
   - Rischio: Informazioni database esposte

6. **`GET /api/users/debug`**
   - File: `src/app/api/users/debug/route.ts`
   - Descrizione: Debug informazioni utenti
   - Rischio: Dati utenti esposti

#### Pages
1. **`/debug-auth`**
   - File: `src/app/debug-auth/page.tsx`
   - Descrizione: Pagina debug autenticazione
   - Rischio: Informazioni autenticazione esposte

2. **`/test-ui`**
   - File: `src/app/test-ui/page.tsx`
   - Descrizione: Pagina test UI components
   - Rischio: Bassa priorità, ma meglio rimuovere

### 13.2 Azioni Richieste

**Opzione 1: Rimozione Completa** (Consigliata)
- Eliminare file/route completamente
- Rimuovere riferimenti nel codice

**Opzione 2: Protezione con Environment Check**
```typescript
if (process.env.NODE_ENV === "production") {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
```

**Opzione 3: Protezione con Admin Check**
- Proteggere con `isAdmin()` check
- Utile se servono per troubleshooting produzione

---

## 14. Checklist Pre-Produzione

### 14.1 Configurazione Ambiente

- [ ] `AUTH_SECRET` generato e configurato (diverso da sviluppo)
- [ ] `DATABASE_URL` configurato per PostgreSQL produzione
- [ ] `NEXTAUTH_URL` corrisponde al dominio pubblico
- [ ] `NODE_ENV=production` impostato
- [ ] Tutte le variabili ambiente verificate

### 14.2 Database

- [ ] Database PostgreSQL creato e accessibile
- [ ] Credenziali database forti e sicure
- [ ] SSL abilitato per connessioni database (`sslmode=require`)
- [ ] Migrations applicate (`npx prisma migrate deploy`)
- [ ] Prisma Client generato (`npm run prisma:generate`)
- [ ] Utente admin creato nel database produzione
- [ ] Backup automatici configurati

### 14.3 Sicurezza

- [ ] Endpoint di debug rimossi o disabilitati
- [ ] Password admin di produzione cambiata (non `admin123`)
- [ ] Headers di sicurezza configurati (se possibile)
- [ ] HTTPS configurato e funzionante
- [ ] Cookie secure flag abilitato (NextAuth lo fa automaticamente)
- [ ] Logging sensibile rimosso/minimizzato

### 14.4 Build e Deploy

- [ ] Build locale testata (`npm run build`)
- [ ] Server produzione locale testato (`npm run start`)
- [ ] Nessun errore nella build
- [ ] Tutte le pagine accessibili senza errori
- [ ] API endpoints rispondono correttamente

### 14.5 Testing Funzionale

- [ ] Login funziona
- [ ] Dashboard si carica correttamente
- [ ] Creazione richiesta budget funziona
- [ ] Approvazioni funzionano (se admin)
- [ ] OKR management funziona (se admin)
- [ ] Campagne visualizzate correttamente
- [ ] Report generati correttamente

### 14.6 Performance

- [ ] Tempi di risposta accettabili (< 2s per pagine principali)
- [ ] Database queries ottimizzate
- [ ] Nessun memory leak evidente
- [ ] Bundle size accettabile

### 14.7 Monitoring

- [ ] Sistema di logging configurato
- [ ] Error tracking configurato (Sentry, etc.)
- [ ] Health checks implementati (opzionale ma consigliato)
- [ ] Alerting configurato per errori critici

### 14.8 Documentazione

- [ ] Credenziali admin documentate (in luogo sicuro)
- [ ] Procedure di backup documentate
- [ ] Procedure di rollback documentate
- [ ] Contatti supporto documentati

---

## 15. Informazioni di Contatto e Supporto

### 15.1 Repository
- **Location**: Repository Git (specificare URL)
- **Branch principale**: `main` o `master`
- **Documentazione**: `/docs` directory

### 15.2 Credenziali Default (da Cambiare)

**⚠️ IMPORTANTE**: Questi sono solo per sviluppo. Cambiare in produzione!

**Utente Admin Default** (seed):
- Email: `admin@example.com`
- Password: `admin123`
- Ruolo: `admin`

**Utenti Demo** (seed):
- Email: `elena.ferri@digimax.mock`
- Password: `demo123`
- Email: `marco.neri@digimax.mock`
- Password: `demo123`
- Email: `chiara.bianchi@digimax.mock`
- Password: `demo123`

### 15.3 Troubleshooting Comune

**Problema**: "Invalid AUTH_SECRET"
- **Soluzione**: Verificare che `AUTH_SECRET` sia impostato e non vuoto
- **Fix**: Rigenerare con `openssl rand -base64 32`

**Problema**: "Database connection failed"
- **Soluzione**: Verificare `DATABASE_URL` e credenziali
- **Fix**: Controllare firewall, SSL mode, network access

**Problema**: "NEXTAUTH_URL mismatch"
- **Soluzione**: `NEXTAUTH_URL` deve corrispondere esattamente al dominio pubblico
- **Fix**: Rimuovere trailing slash, verificare http/https

**Problema**: "Build fallisce con errori Prisma"
- **Soluzione**: Eseguire `npm run prisma:generate` prima del build
- **Fix**: Verificare che `DATABASE_URL` sia accessibile durante build

---

## Appendice A: Comandi Utili

### Build e Deploy
```bash
# Install dipendenze
npm ci

# Genera Prisma Client
npm run prisma:generate

# Build produzione
npm run build

# Test locale produzione
npm run start

# Database migrations
npx prisma migrate deploy

# Seed admin (solo se necessario)
npx tsx prisma/seed-admin.ts
```

### Verifica Setup
```bash
# Verifica Node.js version
node --version  # Deve essere >= 18

# Verifica variabili ambiente (non esporre in produzione)
echo $AUTH_SECRET
echo $DATABASE_URL
echo $NEXTAUTH_URL

# Test connessione database
npx prisma db pull
```

### Debug (solo sviluppo)
```bash
# Verifica schema database
npx prisma studio

# Reset database (solo sviluppo!)
npm run db:reset
```

---

## Appendice B: File da Revisionare Prima del Deploy

1. **`src/lib/auth.ts`** - Verificare configurazione NextAuth
2. **`middleware.ts`** - Verificare regole di protezione route
3. **`prisma/schema.prisma`** - Verificare schema database
4. **`package.json`** - Verificare dipendenze e versioni
5. **`.gitignore`** - Verificare che `.env*` sia ignorato
6. **`next.config.ts`** - Verificare configurazione Next.js
7. **`src/lib/db.ts`** - Verificare configurazione Prisma

---

**Fine Documento**

---

*Documento generato il: Novembre 2024*  
*Versione applicazione: 0.1.0*  
*Prossima revisione: Prima del deploy produzione*

