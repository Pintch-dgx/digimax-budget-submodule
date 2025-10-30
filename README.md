## Digimax Marketing Budget Hub

Applicazione Next.js (App Router + TypeScript + Tailwind CSS) pensata per creare una single source of truth del budget marketing Digimax. L'obiettivo è validare velocemente la UX su Mac e predisporre l'evoluzione su infrastruttura Microsoft/Azure o Power Platform.

### Requisiti

- Node.js ≥ 18 (macchina locale già configurata con Node 22)
- npm (incluso con Node)
- Git (inizializzato automaticamente dal template)

### Avviare la beta in locale

```bash
npm install    # solo la prima volta per assicurarsi che le dipendenze siano aggiornate
npm run dev
```

Lanciare il browser su [http://localhost:3000](http://localhost:3000) per navigare la dashboard demo con:

- panoramica dei KPI di budget annuale
- tabella di allocazione campagne con delta spesa
- sezione approvazioni in scadenza
- insight operativi generati dai dati

Tutta la UI di partenza è in `src/app/page.tsx` e i dati provengono dal database SQLite tramite `src/lib/dashboard-service.ts`.

### Struttura cartelle

- `src/app/` — route e layout Next.js
- `src/components/` — componenti UI riutilizzabili (es. `SummaryCard`)
- `src/lib/` — funzioni helper e dati mock (da sostituire con API/DB)
- `prisma/` — schema ORM e script di seed (database PostgreSQL)
- `docs/` — documentazione architetturale (es. modello dati)

### Database locale (Prisma + PostgreSQL)

1) Crea `.env` (parti da un `.env.example`) e imposta `DATABASE_URL`:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/digimax_budget?schema=public"
```

2) Genera il client Prisma e applica lo schema (i modelli arrivano nella fase successiva):

```bash
npm run prisma:generate
npm run db:push
```

3) (Opzionale) Esegui il seed quando disponibile:

```bash
npm run db:seed
```

### Ruoli fittizi (seed v0.1)

| Persona            | Ruolo seed                        | Visibilità | Verticali principali                         |
|--------------------|-----------------------------------|------------|-----------------------------------------------|
| Elena Ferri        | Digital Experience Specialist     | Verticale  | Web design, social media, media creation, SEO |
| Marco Neri         | Engagement & Events Specialist    | Verticale  | Email marketing, fiere, eventi, team building |
| Chiara Bianchi     | Marketing Manager Performance     | Full       | SEO, paid ads, governa insight trasversali    |

Il seed crea anche i canali marketing, campagne demo, allocazioni di budget, richieste in approvazione e insight operativi coerenti con la dashboard mock.

### Funzionalità da pianificare subito

1. **Autenticazione Azure AD**: usare NextAuth o integrazione Entra ID per allinearsi all'ecosistema Microsoft.
2. **Persistenza dati**: valutare Azure SQL, Dataverse o Synapse a seconda della maturità dati.
3. **Workflow approvazioni**: mappare ruoli (CFO, Marketing Ops, PM) e definire stato richieste (bozza, in revisione, approvato).
4. **Integrazione Power Platform**: esporre API REST/GraphQL per connettere Power BI o Power Automate.
5. **Audit & controlli**: log di modifica budget, tracciamento allegati e note.

### Prossimi passi consigliati

- Configurare `feature` branch naming e regole PR per lavorare in team.
- Aggiungere test (Jest/Testing Library, Playwright) per la componente principale.
- Creare workflow GitHub Actions/Azure DevOps per lint/test/build.
- Preparare ambienti `.env.local`, `.env.development`, `.env.production` e documentare le variabili chiave.
- Pianificare migrazione: containerizzazione (Docker) o distribuzione su Azure Static Web Apps + Function API.

### Supporto operativo

- `npm run lint` per controlli ESLint
- `npm run test` (da abilitare quando vengono introdotti test)
- `npm run build` per la build di produzione

Per qualsiasi dubbio o per affiancamento sull'integrazione con servizi Microsoft, tenere traccia delle decisioni architetturali nella wiki del repo o in un file ADR (`docs/adr/`).
