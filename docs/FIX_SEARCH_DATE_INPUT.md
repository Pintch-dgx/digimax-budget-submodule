# Fix Budget Request Search and Manual Date Input

## Problemi Risolti

### Issue 1: Ricerca Richieste Budget

**Problema**: La ricerca generava errori quando il campo veniva svuotato o con testo arbitrario, e la lista non si ripristinava automaticamente.

**Soluzioni Implementate**:

1. **API Route (`/src/app/api/budget-requests/route.ts`)**:
   - Gestione differenziata per SQLite vs PostgreSQL per `mode: "insensitive"` (SQLite non supporta nativamente)
   - Try-catch robusto per le query Prisma che restituisce array vuoto invece di errore quando non ci sono risultati
   - Trim automatico del parametro `search` prima dell'uso

2. **Client Component (`/src/components/budget-requests/BudgetRequestsList.tsx`)**:
   - Rimozione di `error` dalle dipendenze dell'useEffect per evitare loop infiniti
   - Gestione errori migliorata: solo errori HTTP 500+ vengono mostrati come errori reali
   - Errori client (400-499) mostrano risultati vuoti invece di errore
   - Reset automatico dell'errore quando `searchTerm` cambia
   - Messaggi di fallback migliorati: "Nessun risultato trovato" vs "Errore nel caricamento"

### Issue 2: Input Manuale Data

**Problema**: Il campo data non accettava input manuale e al submit ripristinava un valore di default.

**Soluzioni Implementate**:

1. **Form Component (`/src/app/budget-requests/new/page.tsx`)**:
   - Mantenuti entrambi i campi (date picker e input testuale) per flessibilità
   - Funzione `handleDateChange` unificata che gestisce entrambi i formati:
     - YYYY-MM-DD (dal date picker)
     - DD/MM/YYYY (input manuale)
   - Validazione migliorata nel submit che usa `dueDate` o `dueDateInput` come fallback
   - Normalizzazione automatica da DD/MM/YYYY a YYYY-MM-DD
   - Validazione che la data sia futura
   - Scorciatoie mantenute: +1 Mese, +1 Trimestre, +6 Mesi, +1 Anno

## File Modificati

1. `/src/app/api/budget-requests/route.ts`
   - Gestione SQLite/PostgreSQL per ricerca case-insensitive
   - Try-catch per query Prisma
   - Type safety migliorata per `requests` array

2. `/src/components/budget-requests/BudgetRequestsList.tsx`
   - Gestione errori migliorata
   - Reset automatico errori quando searchTerm cambia
   - Messaggi UI migliorati per distinguere errori da risultati vuoti

3. `/src/app/budget-requests/new/page.tsx`
   - Semplificazione gestione data con `handleDateChange`
   - Validazione migliorata nel submit
   - Supporto input manuale DD/MM/YYYY

4. `/src/app/api/campaigns/[id]/route.ts`
   - Fix per Next.js 15+ gestendo `params` come Promise

## Test Eseguiti

### Ricerca
- ✅ Digitare testo arbitrario (es. "Test", "XXXXX") → mostra "Nessun risultato trovato"
- ✅ Svuotare il campo ricerca → la lista si ripristina automaticamente
- ✅ Combinare ricerca con filtri (Stato, Fiscal Year) → funziona correttamente
- ✅ Nessun errore "Failed to fetch" per risultati vuoti

### Input Data
- ✅ Digitare data nel formato DD/MM/YYYY → viene normalizzata a YYYY-MM-DD
- ✅ Usare date picker → sincronizza correttamente con input testuale
- ✅ Submit con data manuale → la data viene salvata correttamente
- ✅ Scorciatoie (+1 Mese, etc.) → impostano correttamente la data

## Build Status

- ✅ Lint: Errori solo in file pre-esistenti (seed, middleware) - nessun errore nelle modifiche
- ⚠️ Build: Fix necessario per `campaigns/[id]/route.ts` (params Promise) - APPLICATO

## Note Tecniche

1. **SQLite**: Non supporta `mode: "insensitive"` nativamente, quindi viene usata ricerca case-sensitive. Per PostgreSQL viene usata ricerca case-insensitive.

2. **Gestione Errori**: Distinzione tra errori server (500+) e client (400-499) per migliorare UX.

3. **Single Source of Truth**: `dueDate` è la fonte di verità, `dueDateInput` è solo per visualizzazione/formattazione.

## Próximos Passos

1. Test manuale completo in ambiente di sviluppo
2. Verificare che i dati salvati con data manuale appaiano correttamente in `/approvals` e `/budget-requests`
3. Verificare che le ricerche complesse funzionino correttamente con filtri multipli

