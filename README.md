# Digimax Marketing Budget Hub

Applicazione Next.js (App Router + TypeScript + Tailwind CSS) pensata per creare una single source of truth del budget marketing Digimax. L'obiettivo è validare velocemente la UX su Mac e predisporre l'evoluzione su infrastruttura Microsoft/Azure o Power Platform.

## Requisiti

- Node.js ≥ 18 (testato con Node 22)
- npm (incluso con Node)
- Git

## Setup Iniziale

### 1. Installazione dipendenze
```bash
npm install
```

### 2. Configurazione ambiente
Crea un file `.env` nella root del progetto:
```env
AUTH_SECRET=LS56f9Lw2VvC65ju2j68Wr3a523JWGYqZMZ/eVq1+cI=
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL=http://localhost:3000
```

**Nota**: Per produzione, genera un `AUTH_SECRET` sicuro usando `openssl rand -base64 32`.

### 3. Setup database
```bash
# Sincronizza lo schema
npm run db:push

# Popola con dati demo (include admin user + dati esempio)
npm run db:seed:demo
```

### 4. Avvia il server di sviluppo
```bash
npm run dev
```

Apri il browser su [http://localhost:3000](http://localhost:3000).

## Credenziali Demo

### Utente Admin
- **Email**: `admin@example.com`
- **Password**: `admin123`

### Utenti Demo (tutti con password: `demo123`)
- **Elena Ferri** (Digital Specialist): `elena.ferri@digimax.mock`
- **Marco Neri** (Engagement Specialist): `marco.neri@digimax.mock`
- **Chiara Bianchi** (Marketing Manager): `chiara.bianchi@digimax.mock`

## Funzionalità Dashboard

Dopo il login, la dashboard mostra:

- **KPI Budget FY24**: panoramica budget annuale, spesa YTD, disponibile
- **Allocazione Campagne**: tabella con campagne, canali, owner, allocato vs speso
- **Approvazioni in arrivo**: richieste budget in attesa di approvazione con deadline
- **Insight operativi**: suggerimenti generati dai dati

## Struttura Progetto

- `src/app/` — route e layout Next.js (App Router)
- `src/components/` — componenti UI riutilizzabili (Button, Input, Card, Table, etc.)
- `src/components/layout/` — layout responsive con sidebar e navigazione
- `src/lib/` — servizi e helper (dashboard-service, auth, prisma, utils)
- `prisma/` — schema ORM e script di seed (SQLite per sviluppo)
- `docs/` — documentazione (user stories, backlog, guida demo)

## Comandi Disponibili

```bash
# Sviluppo
npm run dev              # Avvia server di sviluppo
npm run build            # Build di produzione
npm run start            # Avvia server di produzione

# Database
npm run db:push          # Sincronizza schema Prisma con DB
npm run db:seed          # Seed solo admin user
npm run db:seed:demo     # Seed completo con dati demo
npm run prisma:generate  # Genera Prisma Client

# Qualità codice
npm run lint             # ESLint check
```

## Database

### Sviluppo Locale
Il progetto usa SQLite per lo sviluppo locale (`prisma/dev.db`). Lo schema è definito in `prisma/schema.prisma`.

### Reset Database
```bash
# Reset completo (elimina e ricrea)
rm prisma/dev.db && npm run db:push && npm run db:seed:demo
```

### Migrazione a PostgreSQL (produzione)
Per la produzione, modifica `DATABASE_URL` in `.env`:
```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/digimax_budget?schema=public"
```

Poi esegui:
```bash
npx prisma migrate dev
```

## Deploy

Vedi `docs/DEPLOY.md` per istruzioni dettagliate su:
- Variabili ambiente necessarie
- Build di produzione
- Deploy su Vercel, Azure Static Web Apps, o container Docker

## Documentazione

- `docs/DEMO.md` — Guida completa per demo e testing
- `docs/user-stories.md` — User stories e requisiti
- `docs/backlog-moscow.md` — Backlog con prioritizzazione MoSCoW
- `docs/milestones-dod.md` — Milestone e Definition of Done

## Funzionalità Implementate

✅ **Fase 1-4 Completate**
- Struttura progetto Next.js + TypeScript
- Autenticazione email/password (NextAuth)
- RBAC base con protezione rotte
- UI Kit completo (Button, Input, Card, Modal, Table)
- Layout responsive con sidebar
- Dashboard con dati reali dal database
- Seed script con dati demo

🔄 **Fase 5 In Corso**
- Integrazione flussi end-to-end
- Test smoke
- Guida deploy completa

## Prossimi Passi

1. **Autenticazione Azure AD**: integrare NextAuth con Entra ID
2. **Persistenza dati**: migrazione a Azure SQL o Dataverse
3. **Workflow approvazioni**: implementare stati e transizioni
4. **Integrazione Power Platform**: esporre API per Power BI/Automate
5. **Audit & controlli**: logging modifiche e tracciamento

## Supporto

Per problemi o domande:
- Controlla la console del browser (F12) per errori client-side
- Controlla il terminale per errori server-side
- Verifica che il database sia inizializzato (`npm run db:push`)
- Verifica le variabili ambiente in `.env`
