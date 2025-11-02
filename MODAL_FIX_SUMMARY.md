# Fix Modal per Creazione Campagna - Risoluzione Problema di Visualizzazione

## Problema Identificato

Il modale per la creazione di nuove campagne (`CreateCampaignModal`) aveva un problema di visualizzazione: il form veniva tagliato in fondo alla pagina, rendendo impossibile vedere e interagire con i campi e pulsanti inferiori.

## Causa Radice

Nel componente `Modal` (`src/components/ui/Modal.tsx`), la classe CSS utilizzava:
- `items-start` - allineamento in alto
- `pt-8` - padding top di 8 unità

Questa combinazione causava i seguenti problemi:
1. Il modale veniva posizionato sempre in alto, anche quando il contenuto era più alto della viewport
2. Per form lunghi come quello della campagna (con molti campi: nome, anno fiscale, canale, owner, quarter sprint, key result, goal, status), la parte inferiore veniva tagliata
3. Lo scroll non funzionava correttamente perché il modale non era centrato verticalmente

## Soluzione Implementata

Ho modificato il componente Modal cambiando:

```tsx
// PRIMA (problematico)
className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 pt-8"

// DOPO (corretto)
className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-y-auto p-4"
```

### Modifiche chiave:
1. **`items-start` → `items-center`**: Centra verticalmente il modale invece di allinearlo in alto
2. **Rimosso `pt-8`**: Eliminato padding top specifico che spostava il contenuto verso l'alto
3. **Aggiunto `min-h-screen`**: Garantisce che il container abbia sempre altezza minima dello schermo, permettendo lo scroll corretto

## Benefici

✅ Il modale si centra verticalmente nella viewport
✅ Il contenuto lungo può scrollare correttamente
✅ Tutti i campi del form sono visibili e accessibili
✅ La soluzione funziona per tutti i modali (piccoli e grandi)
✅ Mantiene la consistenza con gli altri modali dell'applicazione

## File Modificati

- `src/components/ui/Modal.tsx` - Componente base Modal

## Testing

Per testare la correzione:
1. Avviare l'applicazione: `npm run dev`
2. Navigare alla sezione Campagne
3. Cliccare su "Crea Nuova Campagna"
4. Verificare che:
   - Il modale appare centrato
   - Tutti i campi sono visibili
   - I pulsanti in fondo sono accessibili
   - Lo scroll funziona se il contenuto è più alto della finestra

## Note Tecniche

Il problema era specifico del `CreateCampaignModal` perché:
- Ha più campi rispetto ad altri modali (8 campi vs 3-4 negli altri)
- Include campi dipendenti che si caricano dinamicamente (Quarter Sprint, Key Result)
- Ha un layout a griglia che occupa più spazio verticale

La soluzione è stata applicata al componente base `Modal` per beneficiare tutti i modali futuri ed evitare problemi simili.
