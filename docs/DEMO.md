# Guida Demo - Digimax Budget Hub

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

### Utente Requester (Standard)
- **Email**: `requester@digimax.mock`
- **Password**: `demo123`
- **Ruolo**: Utente Standard (può creare richieste budget, non può approvare)

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

## Test Caso d'Uso: Creazione Campagna dal Front-End

### Caso 6: Creazione Campagna e Collegamento a Richiesta Budget

1. **Login** come Admin o Marketing Manager
2. Vai su **Campagne** (`/campaigns`)
3. Clicca su **"Nuova Campagna"**
4. Compila il form:
   - Nome: "Campagna Test Q4"
   - Anno Fiscale: Seleziona FY24
   - Canale: Seleziona un canale (es. Digital Marketing)
   - Owner: Seleziona un utente
   - Quarter Sprint: Seleziona Q4 (opzionale)
   - Key Result: Seleziona un Key Result (opzionale)
   - Goal: "Test creazione campagna"
   - Stato: Pianificata
5. Clicca **"Crea Campagna"**

**Risultato atteso**:
- La campagna appare nella lista delle campagne
- È possibile selezionarla nel form "Nuova Richiesta Budget"

6. Vai su **Nuova Richiesta Budget**
7. Seleziona la campagna appena creata nel campo "Campagna"
8. Compila gli altri campi e invia

**Risultato atteso**:
- La richiesta appare con badge **"Collegata"** (verde)
- Il nome della campagna appare sotto il badge

---

## Test Caso d'Uso: Input Manuale Data

### Caso 7: Digitazione Manuale Data DD/MM/YYYY

1. Vai su **Nuova Richiesta Budget**
2. Nel campo "Data Scadenza", digita manualmente: `31/12/2025`
3. Vai via dal campo (blur)

**Risultato atteso**:
- Il campo date picker viene aggiornato a `2025-12-31`
- Il campo testo mostra `2025-12-31` (formato normalizzato)
- Nessun errore di validazione
- La data salvata è esattamente `2025-12-31`

### Caso 8: Digitazione Manuale Data YYYY-MM-DD

1. Vai su **Nuova Richiesta Budget**
2. Nel campo "Data Scadenza", digita manualmente: `2025-12-31`
3. Vai via dal campo (blur)

**Risultato atteso**:
- Il campo date picker viene aggiornato a `2025-12-31`
- Il campo testo mostra `2025-12-31`
- La data salvata è esattamente `2025-12-31`

### Caso 9: Test Requester User

1. **Logout** dall'account corrente
2. **Login** con `requester@digimax.mock` / `demo123`
3. Vai su **Nuova Richiesta Budget**
4. Compila il form e invia

**Risultato atteso**:
- La richiesta viene creata con successo
- Il badge mostra "No OKR" (perché non può selezionare Quarter Sprint/Key Result)
- La richiesta appare in `/budget-requests` nella lista personale

5. Vai su **Approvals**

**Risultato atteso**:
- La richiesta **NON** appare (il Requester non può vedere/approvare richieste)
- Solo Admin e Marketing Manager possono vedere questa sezione

---

## Test Caso d'Uso: Collegamento Campagna a Richiesta Budget

### Caso 1: Richiesta senza OKR (linkStatus = UNDEFINED_OBJECTIVE)

1. Vai su **Nuova Richiesta Budget** (`/budget-requests/new`)
2. Compila solo i campi obbligatori (titolo, importo, data scadenza)
3. **Non selezionare** Quarter Sprint, Key Result o Campagna
4. Invia la richiesta

**Risultato atteso**: La richiesta appare nella lista con badge **"No OKR"** (grigio/secondary)

---

### Caso 2: Richiesta con Key Result ma senza Campagna (linkStatus = ASSIGNMENT_PENDING)

1. Vai su **Nuova Richiesta Budget**
2. Seleziona un **Quarter Sprint**
3. Seleziona un **Key Result**
4. **Non selezionare** una Campagna
5. Compila gli altri campi e invia

**Risultato atteso**: 
- La richiesta appare con badge **"Da assegnare"** (giallo/warning)
- Sotto il badge appare: "In attesa di associare una campagna"

---

### Caso 3: Richiesta con Campagna collegata (linkStatus = ASSIGNED_TO_CAMPAIGN)

1. Vai su **Nuova Richiesta Budget**
2. Seleziona un **Quarter Sprint**
3. Seleziona un **Key Result** (opzionale)
4. Seleziona una **Campagna** dal dropdown
5. Compila gli altri campi e invia

**Risultato atteso**:
- La richiesta appare con badge **"Collegata"** (verde/success)
- Sotto il badge appare il nome della campagna selezionata

---

### Caso 4: Aggiornamento Campagna esistente

1. Vai su **Richieste Budget** (`/budget-requests`)
2. Trova una richiesta con badge **"Da assegnare"**
3. Usa l'API PUT per aggiornare `campaignId`:

```bash
PUT /api/budget-requests/:id
{
  "campaignId": <CAMPAIGN_ID>
}
```

**Risultato atteso**:
- Il badge cambia da **"Da assegnare"** a **"Collegata"**
- Il nome della campagna appare sotto il badge

---

### Caso 5: Rimozione Campagna

1. Vai su **Richieste Budget**
2. Trova una richiesta con badge **"Collegata"**
3. Usa l'API PUT per rimuovere `campaignId`:

```bash
PUT /api/budget-requests/:id
{
  "campaignId": null
}
```

**Risultato atteso**:
- Se la richiesta ha ancora un Key Result: badge diventa **"Da assegnare"**
- Se la richiesta non ha Key Result: badge diventa **"No OKR"**

---

## Badge linkStatus nella UI

I tre stati di collegamento sono visualizzati con badge colorati:

| Stato | Badge | Colore | Descrizione |
|-------|-------|--------|-------------|
| `UNDEFINED_OBJECTIVE` | "No OKR" | Grigio (secondary) | Nessun obiettivo OKR associato |
| `ASSIGNMENT_PENDING` | "Da assegnare" | Giallo (warning) | Key Result presente, ma nessuna campagna |
| `ASSIGNED_TO_CAMPAIGN` | "Collegata" | Verde (success) | Campagna collegata |

I badge sono visibili in:
- `/budget-requests` - Lista richieste budget
- `/approvals` - Lista approvazioni pendenti

Per test dettagliati delle API, consulta `docs/API_TESTS_BUDGET_REQUESTS.md`.

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

