# Test API Budget Requests - CampaignId Integration

Questo documento descrive i test da eseguire per verificare l'integrazione di `campaignId` nelle richieste budget.

## Prerequisiti

1. Database inizializzato con dati demo (`npm run db:seed:demo`)
2. Server di sviluppo avviato (`npm run dev`)
3. Sessione autenticata come admin (`admin@digimax.local` / `demo123`)
4. Token di sessione valido (ottenibile tramite browser DevTools → Application → Cookies)

## Setup Test

### 1. Ottenere dati di riferimento

Esegui questi comandi per ottenere ID validi:

```bash
# Trova Fiscal Year ID
curl http://localhost:3000/api/fiscal-years -H "Cookie: $(cat .session-cookie)"

# Trova Quarter Sprint ID
curl http://localhost:3000/api/quarter-sprints -H "Cookie: $(cat .session-cookie)"

# Trova Key Result ID
curl http://localhost:3000/api/key-results -H "Cookie: $(cat .session-cookie)"

# Trova Campaign ID
curl http://localhost:3000/api/campaigns -H "Cookie: $(cat .session-cookie)"
```

Sostituisci `$(cat .session-cookie)` con il tuo cookie di sessione effettivo.

## Test Cases

### Test 1: POST senza quarter/key result → linkStatus = UNDEFINED_OBJECTIVE

**Endpoint**: `POST /api/budget-requests`

**Payload**:
```json
{
  "title": "Richiesta senza OKR",
  "amount": 10000,
  "dueDate": "2025-12-31",
  "notes": "Test senza quarter/key result",
  "quarterSprintId": null,
  "keyResultId": null,
  "campaignId": null
}
```

**Aspettative**:
- Status: `201 Created`
- `linkStatus`: `UNDEFINED_OBJECTIVE`
- `quarterSprintId`: `null`
- `keyResultId`: `null`
- `campaignId`: `null`

**Verifica UI**:
- Nella lista `/budget-requests`, la richiesta deve mostrare badge "No OKR" (variante secondary)

---

### Test 2: POST con solo key result → linkStatus = ASSIGNMENT_PENDING

**Endpoint**: `POST /api/budget-requests`

**Payload**:
```json
{
  "title": "Richiesta con Key Result",
  "amount": 15000,
  "dueDate": "2025-12-31",
  "notes": "Test con solo key result",
  "quarterSprintId": null,
  "keyResultId": <KEY_RESULT_ID>,
  "campaignId": null
}
```

**Aspettative**:
- Status: `201 Created`
- `linkStatus`: `ASSIGNMENT_PENDING`
- `quarterSprintId`: Deve essere impostato automaticamente dal key result
- `keyResultId`: `<KEY_RESULT_ID>`
- `campaignId`: `null`

**Verifica UI**:
- Nella lista `/budget-requests`, la richiesta deve mostrare badge "Da assegnare" (variante warning)
- Deve essere visibile testo "In attesa di associare una campagna"

---

### Test 3: POST con campaignId coerente → linkStatus = ASSIGNED_TO_CAMPAIGN

**Endpoint**: `POST /api/budget-requests`

**Payload**:
```json
{
  "title": "Richiesta con Campagna",
  "amount": 20000,
  "dueDate": "2025-12-31",
  "notes": "Test con campagna collegata",
  "quarterSprintId": <QUARTER_SPRINT_ID>,
  "keyResultId": <KEY_RESULT_ID>,
  "campaignId": <CAMPAIGN_ID>
}
```

**Precondizioni**:
- La campagna deve appartenere allo stesso fiscal year della richiesta
- La campagna deve appartenere allo stesso quarter sprint (se specificato)
- La campagna deve essere legata allo stesso key result (se specificato)

**Aspettative**:
- Status: `201 Created`
- `linkStatus`: `ASSIGNED_TO_CAMPAIGN`
- `campaignId`: `<CAMPAIGN_ID>`
- `quarterSprintId`: Deve essere coerente con quello della campagna
- `keyResultId`: Deve essere coerente con quello della campagna (se presente)

**Verifica UI**:
- Nella lista `/budget-requests`, la richiesta deve mostrare badge "Collegata" (variante success)
- Deve essere visibile il nome della campagna sotto il badge

---

### Test 4: PUT aggiorna campaignId → transizione stato

**Endpoint**: `PUT /api/budget-requests/:id`

**Scenario**: Prendi una richiesta esistente con `linkStatus = ASSIGNMENT_PENDING` e aggiorna `campaignId`.

**Payload**:
```json
{
  "campaignId": <CAMPAIGN_ID>
}
```

**Aspettative**:
- Status: `200 OK`
- `linkStatus`: `ASSIGNED_TO_CAMPAIGN` (transizione da `ASSIGNMENT_PENDING`)
- `campaignId`: `<CAMPAIGN_ID>`
- `quarterSprintId`: Deve essere aggiornato automaticamente se la campagna ha un quarter sprint
- `keyResultId`: Deve essere aggiornato automaticamente se la campagna ha un key result

**Verifica UI**:
- Nella lista `/budget-requests`, il badge deve cambiare da "Da assegnare" a "Collegata"
- Il nome della campagna deve apparire sotto il badge

---

### Test 5: PUT rimuove campaignId → transizione stato

**Endpoint**: `PUT /api/budget-requests/:id`

**Scenario**: Prendi una richiesta esistente con `linkStatus = ASSIGNED_TO_CAMPAIGN` e rimuovi `campaignId`.

**Payload**:
```json
{
  "campaignId": null
}
```

**Aspettative**:
- Status: `200 OK`
- `linkStatus`: 
  - Se ha ancora `keyResultId`: `ASSIGNMENT_PENDING`
  - Se non ha `keyResultId`: `UNDEFINED_OBJECTIVE`
- `campaignId`: `null`

**Verifica UI**:
- Nella lista `/budget-requests`, il badge deve cambiare da "Collegata" a "Da assegnare" o "No OKR"

---

### Test 6: Validazione campaignId - fiscal year mismatch

**Endpoint**: `POST /api/budget-requests`

**Payload**:
```json
{
  "title": "Richiesta con campagna errata",
  "amount": 10000,
  "dueDate": "2025-12-31",
  "fiscalYearId": <FISCAL_YEAR_ID_1>,
  "campaignId": <CAMPAIGN_ID_FISCAL_YEAR_2>
}
```

**Aspettative**:
- Status: `400 Bad Request`
- Messaggio: "La campagna selezionata appartiene a un anno fiscale diverso"

---

### Test 7: Validazione campaignId - quarter sprint mismatch

**Endpoint**: `POST /api/budget-requests`

**Payload**:
```json
{
  "title": "Richiesta con campagna errata",
  "amount": 10000,
  "dueDate": "2025-12-31",
  "quarterSprintId": <QUARTER_SPRINT_ID_1>,
  "campaignId": <CAMPAIGN_ID_QUARTER_SPRINT_2>
}
```

**Aspettative**:
- Status: `400 Bad Request`
- Messaggio: "La campagna selezionata appartiene a un Quarter Sprint diverso"

---

### Test 8: Validazione campaignId - key result mismatch

**Endpoint**: `POST /api/budget-requests`

**Payload**:
```json
{
  "title": "Richiesta con campagna errata",
  "amount": 10000,
  "dueDate": "2025-12-31",
  "keyResultId": <KEY_RESULT_ID_1>,
  "campaignId": <CAMPAIGN_ID_KEY_RESULT_2>
}
```

**Aspettative**:
- Status: `400 Bad Request`
- Messaggio: "La campagna selezionata è legata a un Key Result diverso"

---

## Test E2E - Form UI

### Test 9: Campaign Picker nel form nuova richiesta

1. Naviga a `/budget-requests/new`
2. Seleziona un **Quarter Sprint**
3. Verifica che il campo **Campagna** diventi abilitato
4. Verifica che vengano caricate solo le campagne per quel Quarter Sprint
5. Seleziona una **Campagna**
6. Compila gli altri campi obbligatori
7. Invia il form

**Aspettative**:
- Dopo l'invio, la richiesta appare nella lista con badge "Collegata"
- Il nome della campagna è visibile sotto il badge

---

### Test 10: Campaign Picker si resetta quando cambia Quarter Sprint

1. Naviga a `/budget-requests/new`
2. Seleziona **Quarter Sprint A** e una **Campagna**
3. Cambia **Quarter Sprint** in **Quarter Sprint B**

**Aspettative**:
- Il campo **Campagna** viene resettato
- Vengono caricate solo le campagne per Quarter Sprint B

---

## Checklist Completamento

- [ ] Test 1: POST senza OKR → UNDEFINED_OBJECTIVE
- [ ] Test 2: POST con solo key result → ASSIGNMENT_PENDING
- [ ] Test 3: POST con campaignId → ASSIGNED_TO_CAMPAIGN
- [ ] Test 4: PUT aggiorna campaignId → transizione stato
- [ ] Test 5: PUT rimuove campaignId → transizione stato
- [ ] Test 6: Validazione fiscal year mismatch
- [ ] Test 7: Validazione quarter sprint mismatch
- [ ] Test 8: Validazione key result mismatch
- [ ] Test 9: Campaign Picker nel form UI
- [ ] Test 10: Campaign Picker reset su cambio Quarter Sprint

## Note

- Tutti i test richiedono autenticazione valida
- I test possono essere eseguiti tramite Postman, curl, o direttamente dalla UI
- I badge linkStatus sono visibili in `/budget-requests` e `/approvals`

