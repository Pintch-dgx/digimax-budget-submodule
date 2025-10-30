## Modello Dati Beta

> Versione 0.1 – obiettivo: supportare il prototipo locale con SQLite + Prisma

### Entità chiave

- **FiscalYear**
  - Identifica l'esercizio (es. `FY24`), budget complessivo e valuta di riferimento.
  - Relazioni: `BudgetSnapshot`, `Campaign`, `BudgetRequest`, `OperationalInsight`.

- **BudgetSnapshot**
  - KPI sintetici (budget annuale, spesa YTD, disponibile, ecc.).
  - Campi: `label`, `amount`, `trend` (`UP | DOWN | FLAT`), `changePercentage`.

- **MarketingChannel**
  - Canali di pianificazione (Digital, Eventi, Account Based...).
  - Relazioni: `Campaign`.

- **Campaign**
  - Iniziativa pianificata su un canale, owned da un marketing user e collegata a un esercizio.
  - Relazioni: `BudgetAllocation`.

- **BudgetAllocation**
  - Importi allocati vs spesi per campagna e anno fiscale. Delta calcolabile dal front-end.

- **BudgetRequest**
  - Richieste di budget/approvazioni con stato (`PENDING_APPROVAL`, `APPROVED`, ecc.).

- **OperationalInsight**
  - Insight operativi (storytelling nella dashboard) con livello di priorità.

### Persone e visibilità

- **MarketingRole**
  - Ruoli fittizi e visibilità (`FULL`, `VERTICAL`, `LIMITED`).

- **MarketingUser**
  - Membri del team marketing, legati a `MarketingRole`.

- **VerticalArea**
  - Competenze verticali (Digital Experience, Eventi & Engagement, Performance SEO/ADS).

- **MarketingUserVertical**
  - Tabella ponte per definire i perimetri di visibilità di ciascun utente.

### Personas seed

| Utente         | Ruolo Prisma                | Verticale principale                 | Visibilità |
|----------------|-----------------------------|--------------------------------------|------------|
| Elena Ferri    | `Digital Experience Specialist` | `digital-experience`                 | `VERTICAL` |
| Marco Neri     | `Engagement & Events Specialist` | `engagement-events`                 | `VERTICAL` |
| Chiara Bianchi | `Marketing Manager Performance`  | `performance-seo-ads` (+ digitale)  | `FULL`     |

### Note operative

- SQLite per il prototipo → sostituibile con Azure SQL/Dataverse in v2 mantenendo Prisma.
- Importi monetari modellati come `Int` (euro interi) per semplificare il prototipo; in v2 valutare `Decimal`/money type su database enterprise.
- Aggiungere Audit log e Allegati nelle iterazioni successive (v2.0).
- Il seed iniziale popola i 3 ruoli richiesti + dati demo coerenti con la dashboard.
