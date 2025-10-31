# Guida Test Pre-Fase 5

## Test Componenti UI

1. Avvia il server di sviluppo:
```bash
npm run dev
```

2. Naviga su `http://localhost:3000/test-ui` per vedere tutti i componenti UI:
   - ✅ Buttons (varianti e dimensioni)
   - ✅ Inputs (normali e con errori)
   - ✅ Modal (dialog overlay)
   - ✅ Table (tabelle dati)
   - ✅ Cards (varie configurazioni)

3. Verifica la pagina signin migliorata:
   - Naviga su `http://localhost:3000/signin`
   - Dovresti vedere form con componenti UI (Input, Button, Card)
   - Testa validazione e messaggi di errore

## Checklist Test Rapido

### UI Components
- [ ] Pagina `/test-ui` si carica senza errori
- [ ] Tutti i button mostrano correttamente (primary, secondary, outline, ghost)
- [ ] Input con/senza errori funzionano
- [ ] Modal si apre/chiude correttamente
- [ ] Table mostra dati correttamente
- [ ] Cards responsive su mobile

### Signin Page
- [ ] Form usa componenti UI (non più input nativi)
- [ ] Layout coerente con design system
- [ ] Messaggi errore mostrati correttamente
- [ ] Dark mode funziona (se testato)

### Build e Lint
- [ ] `npm run lint` passa senza errori
- [ ] `npm run build` completa senza errori critici
- [ ] Nessun warning TypeScript importante

## Note

- I componenti UI sono ora riusabili in tutto il progetto
- La pagina signin dimostra l'integrazione dei componenti
- I componenti supportano dark mode automaticamente
- Accessibilità base inclusa (focus, aria-attributes)

## Prossimi Step (Fase 5)

Una volta verificato che tutto funzioni:
1. Integrare componenti nella dashboard principale
2. Creare form per richieste budget
3. Test end-to-end login → dashboard → operazioni

