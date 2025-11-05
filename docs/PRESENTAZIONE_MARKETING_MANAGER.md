# Digimax Budget Hub - Presentazione per Marketing Manager

## 📋 Panoramica dello Strumento

**Digimax Budget Hub** è una piattaforma integrata per la gestione end-to-end del budget marketing Digimax. Lo strumento centralizza la pianificazione, il monitoraggio e l'approvazione delle richieste di budget, collegandole agli obiettivi strategici (OKR) e alle campagne operative.

---

## 🎯 Problemi Risolti

### Prima dello Strumento
- ❌ **Disallineamento**: Budget pianificati separatamente dagli obiettivi strategici
- ❌ **Visibilità limitata**: Difficile tracciare quanto budget è allocato, speso e residuo per ogni campagna
- ❌ **Processo frammentato**: Approvazioni via email, fogli Excel sparsi, nessuna tracciabilità
- ❌ **Mancanza di governance**: Nessun controllo centralizzato su chi può approvare e chi può richiedere budget
- ❌ **Reporting manuale**: Analisi e report devono essere creati manualmente

### Con Digimax Budget Hub
- ✅ **Allineamento strategico**: Ogni richiesta budget può essere collegata a obiettivi OKR, quarter sprint e campagne
- ✅ **Visibilità completa**: Dashboard in tempo reale su allocazioni, spese e residui
- ✅ **Workflow strutturato**: Processo di approvazione digitale con tracciabilità completa
- ✅ **Governance chiara**: Ruoli definiti (Admin, Marketing Manager, Requester) con permessi specifici
- ✅ **Reporting automatico**: Report e analisi generate automaticamente

---

## 🏗️ Architettura Funzionale

### 1. **Pianificazione Strategica (OKR)**

**Obiettivi → Quarter Sprint → Key Results**

- **Obiettivi**: Definizione degli obiettivi strategici per anno fiscale
- **Quarter Sprint**: Suddivisione in trimestri con date di inizio/fine
- **Key Results**: Metriche misurabili collegate ai Quarter Sprint

**Esempio pratico:**
```
Obiettivo: "Aumentare la brand awareness del 30%"
├── Q1 2025 (Gen-Mar)
│   └── Key Result: "Raggiungere 500K impression su social media"
├── Q2 2025 (Apr-Giu)
│   └── Key Result: "Aumentare il traffico organico del 25%"
```

**Chi può gestirlo**: Solo Admin e Marketing Manager

---

### 2. **Gestione Campagne**

**Creazione e Monitoraggio Campagne**

- Ogni campagna può essere collegata a:
  - Un Quarter Sprint (collegamento strategico)
  - Un Key Result (obiettivo misurabile)
  - Un canale specifico (Social, Display, Email, etc.)
  - Un owner responsabile

- **Tracking Budget**:
  - Budget allocato iniziale
  - Budget speso (aggiornato manualmente o via integrazione)
  - Budget residuo (calcolato automaticamente)
  - Progress bar visiva

**Chi può gestirlo**: Marketing Manager e Admin

---

### 3. **Richieste Budget**

**Workflow Completo**

#### Fase 1: Creazione Richiesta
Il requester compila un form con:
- Titolo e descrizione della richiesta
- Anno fiscale e Quarter Sprint (opzionale)
- Key Result collegato (opzionale)
- Campagna collegata (opzionale)
- Importo richiesto
- Data scadenza
- Note aggiuntive

**Stati di Collegamento:**
- 🔵 **"No OKR"**: Richiesta non collegata a obiettivi strategici
- 🟡 **"Da assegnare"**: Collegata a Key Result ma non ancora a una campagna
- 🟢 **"Collegata"**: Collegata a una campagna specifica

#### Fase 2: Approvazione
- Le richieste con stato "Pending Approval" appaiono nella sezione **Approvals**
- Il Marketing Manager può:
  - ✅ Approvare → la richiesta passa a "Approved"
  - ❌ Rifiutare → la richiesta passa a "Rejected" con possibilità di aggiungere note

#### Fase 3: Tracking
- Una volta approvata, la richiesta viene tracciata nei report
- Il budget viene considerato nelle analisi di performance

**Chi può creare richieste**: Tutti gli utenti autenticati
**Chi può approvare**: Solo Marketing Manager e Admin

---

### 4. **Dashboard e Report**

#### Dashboard Principale
Mostra in tempo reale:
- **Metriche di riepilogo**: Totale allocato, speso, residuo
- **Allocazioni campagne**: Tabella con tutte le campagne e il loro stato budget
- **Approvazioni pendenti**: Le prossime scadenze da approvare
- **Insight operativi**: Raccomandazioni automatiche basate sui dati

#### Report Dashboard
Analisi approfondite su:
- **Riepilogo generale**: Totale richieste per stato (Approvate, Rifiutate, Pendenti)
- **Breakdown per stato**: Visualizzazione percentuale e assoluta
- **Top requester**: Chi richiede più budget e con quali importi
- **Performance campagne**: Campagne con migliore/spegliore utilizzo budget

---

## 🔐 Gestione Ruoli e Permessi

### **Admin**
- ✅ Gestione completa OKR (Obiettivi, Quarter Sprint, Key Results)
- ✅ Approvazione richieste budget
- ✅ Eliminazione elementi (con conferma)
- ✅ Accesso completo a report e dashboard

### **Marketing Manager**
- ✅ Approvazione richieste budget
- ✅ Gestione campagne e tracking budget
- ✅ Visualizzazione OKR (read-only)
- ✅ Accesso completo a report e dashboard

### **Requester** (Utente Standard)
- ✅ Creazione richieste budget
- ✅ Visualizzazione proprie richieste
- ✅ Visualizzazione dashboard (limitata)

---

## 📊 Metriche Chiave Trackate

1. **Budget Allocato**: Totale budget assegnato a campagne
2. **Budget Speso**: Totale già utilizzato
3. **Budget Residuo**: Differenza tra allocato e speso
4. **Tasso di Approvazione**: % di richieste approvate vs rifiutate
5. **Tempo Medio Approvazione**: Quanto tempo passa tra richiesta e approvazione
6. **Performance Campagne**: Utilizzo budget per campagna (efficienza)

---

## 🚀 Come Testare lo Strumento

### Scenario di Test Consigliato

#### **Step 1: Setup Iniziale (Admin)**
1. Login come Admin (`admin@example.com` / `admin123`)
2. Andare su **OKR Management**
3. Creare un Obiettivo per l'anno fiscale corrente
4. Creare un Quarter Sprint (es. Q1 2025)
5. Creare un Key Result collegato al Quarter Sprint
6. Creare una Campagna collegata al Quarter Sprint

#### **Step 2: Creazione Richiesta (Requester)**
1. Login come utente standard (o creare nuovo utente)
2. Andare su **Nuova Richiesta Budget**
3. Compilare il form:
   - Titolo: "Campagna Social Media Q1"
   - Anno fiscale: Selezionare quello corrente
   - Quarter Sprint: Selezionare Q1 2025
   - Key Result: Selezionare quello creato
   - Campagna: Selezionare la campagna creata
   - Importo: 10.000€
   - Data scadenza: Selezionare data futura
4. Inviare la richiesta
5. Verificare che compaia con badge "Collegata"

#### **Step 3: Approvazione (Marketing Manager)**
1. Login come Marketing Manager
2. Andare su **Approvals**
3. Verificare che la richiesta creata compaia nella lista
4. Cliccare su **Approva**
5. Verificare che lo stato cambi in "Approved"

#### **Step 4: Monitoraggio (Dashboard)**
1. Tornare alla **Dashboard**
2. Verificare che:
   - Le metriche di riepilogo riflettano i dati inseriti
   - La campagna appaia nella tabella "Allocazioni Campagne"
   - La richiesta approvata sia tracciata

#### **Step 5: Report**
1. Andare su **Reports**
2. Verificare che:
   - Il riepilogo mostri le richieste approvate
   - La performance campagne mostri la campagna creata
   - I top requester includano l'utente che ha creato la richiesta

---

## 💡 Vantaggi Chiave per la Direzione

### **Efficienza Operativa**
- ⏱️ **Riduzione tempo approvazioni**: Processo digitale invece di email/riunioni
- 📊 **Visibilità real-time**: Nessun bisogno di report manuali
- 🔄 **Tracciabilità completa**: Audit trail di ogni decisione

### **Governance e Controllo**
- 🎯 **Allineamento strategico**: Ogni euro speso è collegato a un obiettivo
- 👥 **Ruoli chiari**: Ogni persona ha permessi appropriati
- 📈 **Metriche oggettive**: Decisioni basate su dati, non su impressioni

### **Scalabilità**
- 📱 **Accesso da qualsiasi dispositivo**: Interfaccia web responsive
- 🔌 **Integrabile**: API pronte per integrazioni future (es. con sistemi di advertising)
- 📦 **Multi-anno fiscale**: Gestione di più anni contemporaneamente

---

## 🎓 Prossimi Passi per l'Approvazione

### **Checklist Pre-Approvazione**
- [ ] Test completo del workflow end-to-end
- [ ] Verifica dei permessi e ruoli
- [ ] Test dei report e dashboard
- [ ] Validazione dei dati demo con dati reali
- [ ] Training del team su utilizzo base

### **Domande da Presentare alla Direzione**
1. **ROI**: Quanto tempo risparmiamo rispetto al processo attuale?
2. **Adozione**: Quali team devono essere formati?
3. **Integrazione**: Ci sono altri sistemi da integrare?
4. **Migrazione**: Come migriamo i dati storici?
5. **Supporto**: Chi gestisce il supporto e la manutenzione?

---

## 📞 Supporto e Documentazione

- **Documentazione tecnica**: `docs/AS_IS_TECNICO_IT.md`
- **Guida demo**: `docs/DEMO.md`
- **API documentation**: Endpoint disponibili in `/api/*`

---

**Versione**: 1.0  
**Data**: Gennaio 2025  
**Preparato per**: Marketing Manager - Test e Approvazione Direzione

