# Guida Demo - Marketing Budget Hub

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

### 3. Setup database
```bash
# Sincronizza lo schema
npm run db:push

# Popola con dati demo
npm run db:seed:demo
```

### 4. Avvia il server
```bash
npm run dev
```

## Credenziali di Accesso

### Utente Admin
- **Email**: `admin@example.com`
- **Password**: `admin123`

### Utenti Demo (tutti con password: `demo123`)
- **Elena Ferri** (Digital Specialist): `elena.ferri@digimax.mock`
- **Marco Neri** (Engagement Specialist): `marco.neri@digimax.mock`
- **Chiara Bianchi** (Marketing Manager): `chiara.bianchi@digimax.mock`

## Dati Demo Inclusi

### Budget FY24
- Budget Annuale: €2.500.000
- Spesa YTD: €1.475.000
- Disponibile: €1.025.000

### Campagne
1. **Brand Refresh Q3** (Digital)
   - Allocato: €320.000
   - Speso: €185.000
   - Delta: €135.000

2. **Evento Clienti Milano** (Eventi)
   - Allocato: €210.000
   - Speso: €190.000
   - Delta: €20.000

3. **Programma ABM Enterprise** (ABM)
   - Allocato: €450.000
   - Speso: €320.000
   - Delta: €130.000

### Richieste in Approvazione
- Media plan LinkedIn Q4 (€78.000) - scadenza: 18 sett
- Partnership evento SaaS Summit (€54.000) - scadenza: 22 sett

### Insight Operativi
- Campagne digital con ROI più alto
- Sottoutilizzo eventi corporate

## Flusso Demo Consigliato

1. **Login** con admin@example.com
2. **Dashboard principale**: esplora KPI, campagne e approvazioni
3. **Navigazione**: prova le diverse sezioni dal menu laterale
4. **Test responsive**: ridimensiona il browser per vedere il menu mobile

## Comandi Utili

```bash
# Reset completo database e seed demo
rm prisma/dev.db && npm run db:push && npm run db:seed:demo

# Solo seed demo (preserva admin esistente)
npm run db:seed:demo

# Build di produzione
npm run build

# Lint check
npm run lint
```

