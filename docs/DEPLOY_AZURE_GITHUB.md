# 🚀 Guida Deploy Azure - Digimax Budget Hub
## Deploy su Azure con GitHub Integration

**Versione**: 1.0  
**Data**: Novembre 2024  
**Tempo stimato**: 30-60 minuti

---

## 📋 Panoramica

Questa guida spiega come deployare l'applicazione Digimax Budget Hub su Azure utilizzando Azure Static Web Apps o Azure App Service, con integrazione GitHub per deploy automatici.

---

## 🎯 Prerequisiti

Prima di iniziare, assicurati di avere:

- ✅ **Account Azure** attivo con subscription valida
- ✅ **Repository GitHub** con il codice dell'applicazione
- ✅ **Azure CLI** installato (opzionale ma consigliato)
- ✅ **Accesso a GitHub** per configurare GitHub Actions
- ✅ **Database PostgreSQL** da configurare (Azure Database for PostgreSQL o esterno)

---

## 📦 Opzioni di Deployment Azure

Azure offre due opzioni principali per Next.js:

### Opzione A: Azure Static Web Apps (⭐ Consigliata)
- **Pro**: Setup semplice, GitHub Actions automatico, SSL gratuito, CDN integrato
- **Contro**: Limitazioni su funzionalità server-side avanzate
- **Costo**: Gratuito per iniziare, poi piani a pagamento
- **Tempo**: ~30 minuti

### Opzione B: Azure App Service
- **Pro**: Più controllo, supporto completo Next.js, scaling avanzato
- **Contro**: Setup più complesso, configurazione manuale
- **Costo**: Piano gratuito disponibile, poi piani a pagamento
- **Tempo**: ~60 minuti

**💡 Raccomandazione**: Inizia con **Azure Static Web Apps** se possibile. Se hai bisogno di funzionalità avanzate, usa **Azure App Service**.

---

## 🚀 Opzione A: Azure Static Web Apps (Consigliata)

### Passo 1: Preparare il Repository GitHub

1. **Verifica che il codice sia su GitHub**
   ```bash
   git remote -v
   # Dovresti vedere il tuo repository GitHub
   ```

2. **Assicurati che il branch principale sia `main` o `master`**
   ```bash
   git branch
   # Se necessario, rinomina:
   # git branch -M main
   ```

3. **Verifica che `.env` sia nel `.gitignore`**
   ```bash
   cat .gitignore | grep .env
   # Dovrebbe contenere: .env*
   ```

### Passo 2: Creare Azure Static Web App

#### Metodo A: Azure Portal (UI)

1. **Accedi ad Azure Portal**
   - Vai su [portal.azure.com](https://portal.azure.com)
   - Accedi con il tuo account Azure

2. **Crea nuova risorsa**
   - Clicca su "Create a resource"
   - Cerca "Static Web App"
   - Clicca "Create"

3. **Configurazione base**
   - **Subscription**: Seleziona la tua subscription
   - **Resource Group**: Crea nuovo o usa esistente
     - Nome suggerito: `rg-digimax-budget-marketing`
   - **Name**: `digimax-budget-marketing` (o nome preferito)
   - **Plan type**: 
     - **Free** per iniziare (limiti ma gratuito)
     - **Standard** per produzione (più funzionalità)
   - **Region**: Scegli la regione più vicina (es: `West Europe`)

4. **Configurazione deployment**
   - **Source**: GitHub
   - **GitHub account**: Autorizza Azure ad accedere a GitHub
   - **Organization**: Seleziona la tua organization/user
   - **Repository**: Seleziona `digimax-budget-marketing` (o nome repo)
   - **Branch**: `main` (o `master`)
   - **Build Presets**: **Next.js**
   - **App location**: `/digimax-budget-marketing` (se repo è in subfolder) o `/` (se repo è root)
   - **Api location**: `/api` (lascia vuoto per Next.js)
   - **Output location**: `.next` (importante!)

5. **Clicca "Review + create"** → **"Create"**

6. **Attendi creazione** (2-3 minuti)

#### Metodo B: Azure CLI (Terminal)

```bash
# Login ad Azure
az login

# Imposta subscription (se necessario)
az account set --subscription "Nome-Subscription"

# Crea resource group
az group create \
  --name rg-digimax-budget-marketing \
  --location "West Europe"

# Crea Static Web App
az staticwebapp create \
  --name digimax-budget-marketing \
  --resource-group rg-digimax-budget-marketing \
  --location "West Europe" \
  --sku Standard \
  --login-with-github
```

**Nota**: `--login-with-github` aprirà il browser per autorizzare Azure.

### Passo 3: Configurare GitHub Actions Workflow

Azure creerà automaticamente un GitHub Actions workflow. Verificalo:

1. **Vai su GitHub** → Repository → Tab **Actions**
2. **Cerca workflow** chiamato "Azure Static Web Apps CI/CD"
3. **Verifica il file** `.github/workflows/azure-static-web-apps-*.yml`

Il workflow dovrebbe essere simile a questo:

```yaml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

jobs:
  build_and_deploy_job:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true
          lfs: true
      - name: Build And Deploy
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/digimax-budget-marketing"  # o "/"
          output_location: ".next"
```

**⚠️ IMPORTANTE**: 
- Se il repository è nella root: `app_location: "/"`
- Se il repository è in una subfolder: `app_location: "/digimax-budget-marketing"`
- `output_location` deve essere `.next` per Next.js

### Passo 4: Modificare Workflow per Next.js

Azure potrebbe non configurare correttamente Next.js. Modifica il workflow:

1. **Vai su GitHub** → Repository → `.github/workflows/azure-static-web-apps-*.yml`
2. **Modifica il workflow** aggiungendo build steps:

```yaml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

jobs:
  build_and_deploy_job:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true
          lfs: true
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
        working-directory: ./digimax-budget-marketing  # o ./ se root
      
      - name: Generate Prisma Client
        run: npm run prisma:generate
        working-directory: ./digimax-budget-marketing  # o ./ se root
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
      - name: Build Next.js
        run: npm run build
        working-directory: ./digimax-budget-marketing  # o ./ se root
        env:
          NODE_ENV: production
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          AUTH_SECRET: ${{ secrets.AUTH_SECRET }}
          NEXTAUTH_URL: ${{ secrets.NEXTAUTH_URL }}
      
      - name: Build And Deploy
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/digimax-budget-marketing"  # o "/"
          output_location: ".next"
```

**Nota**: 
- Sostituisci `./digimax-budget-marketing` con `./` se il repository è nella root
- Azure creerà automaticamente `AZURE_STATIC_WEB_APPS_API_TOKEN` come secret GitHub

### Passo 5: Configurare Variabili Ambiente

#### 5.1 Generare AUTH_SECRET

```bash
# Genera un secret sicuro
openssl rand -base64 32
# Copia il risultato (es: LS56f9Lw2VvC65ju2j68Wr3a523JWGYqZMZ/eVq1+cI=)
```

#### 5.2 Configurare Secrets in GitHub

1. **Vai su GitHub** → Repository → **Settings** → **Secrets and variables** → **Actions**
2. **Clicca "New repository secret"**
3. **Aggiungi questi secrets**:

   **AUTH_SECRET**
   - Name: `AUTH_SECRET`
   - Value: `<secret-generato-con-openssl>`

   **DATABASE_URL**
   - Name: `DATABASE_URL`
   - Value: `postgresql://user:password@host:5432/dbname?sslmode=require`
   - ⚠️ Sostituisci con le credenziali reali del database PostgreSQL

   **NEXTAUTH_URL**
   - Name: `NEXTAUTH_URL`
   - Value: `https://digimax-budget-marketing.azurestaticapps.net`
   - ⚠️ Sostituisci con l'URL reale della tua Static Web App (trovalo dopo il deploy)

#### 5.3 Configurare Application Settings in Azure

1. **Vai su Azure Portal** → Static Web App → **Configuration**
2. **Clicca "Application settings"**
3. **Aggiungi queste variabili**:

   ```
   AUTH_SECRET = <stesso-secret-di-github>
   DATABASE_URL = <stessa-url-di-github>
   NEXTAUTH_URL = https://digimax-budget-marketing.azurestaticapps.net
   NODE_ENV = production
   ```

### Passo 6: Configurare Database PostgreSQL

#### Opzione A: Azure Database for PostgreSQL

1. **Crea database PostgreSQL**
   - Azure Portal → "Create a resource" → "Azure Database for PostgreSQL"
   - Scegli "Flexible Server" (più economico)
   - Configurazione:
     - **Resource Group**: `rg-digimax-budget-marketing`
     - **Server name**: `digimax-budget-db` (o nome preferito)
     - **Region**: Stessa regione della Static Web App
     - **PostgreSQL version**: 14 o 15
     - **Compute**: Burstable B1ms (per iniziare, poi scala)
     - **Storage**: 32 GB (minimo)
     - **Admin username**: `digimax_admin`
     - **Password**: Genera password sicura
   
2. **Configura firewall**
   - Vai su "Networking" → "Public access"
   - Aggiungi regola:
     - **Rule name**: `AllowAzureServices`
     - **Start IP**: `0.0.0.0`
     - **End IP**: `0.0.0.0`
   - Oppure: "Allow public access from Azure services and resources within Azure"

3. **Ottieni connection string**
   - Vai su "Connection strings"
   - Copia la connection string PostgreSQL
   - Formato: `postgresql://digimax_admin:password@digimax-budget-db.postgres.database.azure.com:5432/postgres?sslmode=require`

#### Opzione B: Database PostgreSQL Esterno

- Usa qualsiasi provider PostgreSQL (Supabase, Railway, Render, etc.)
- Ottieni connection string
- Configura variabili ambiente come sopra

### Passo 7: Applicare Migrations Database

```bash
# Opzione A: Dal tuo computer locale
cd digimax-budget-marketing
export DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
npx prisma migrate deploy
npx prisma generate
```

```bash
# Opzione B: Da Azure Cloud Shell
az cloudshell launch
# Poi clona repository e esegui migrations
```

### Passo 8: Creare Utente Admin

```bash
# Dal tuo computer locale o Cloud Shell
export DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
npx tsx prisma/seed-admin.ts
```

Oppure crea manualmente tramite SQL:

```sql
-- Connettiti al database PostgreSQL
-- 1. Crea ruolo admin (se non esiste)
INSERT INTO MarketingRole (key, name, description) 
VALUES ('admin', 'Administrator', 'Full system access')
ON CONFLICT (key) DO NOTHING;

-- 2. Crea utente admin
-- Sostituisci <password_hash> con hash bcrypt della password
-- Per generare hash: node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('tua-password', 10).then(console.log)"
INSERT INTO MarketingUser (email, password, fullName, roleId)
VALUES (
  'admin@digimax.com',
  '<password_hash>',
  'Admin User',
  (SELECT id FROM MarketingRole WHERE key = 'admin')
);
```

### Passo 9: Trigger Deploy

1. **Fai un commit e push** su GitHub:
   ```bash
   git add .
   git commit -m "Configure Azure deployment"
   git push origin main
   ```

2. **Monitora GitHub Actions**
   - Vai su GitHub → Repository → **Actions**
   - Vedi il workflow in esecuzione
   - Attendi completamento (5-10 minuti)

3. **Verifica deploy**
   - Vai su Azure Portal → Static Web App → **Overview**
   - Clicca sull'URL della Static Web App
   - Dovresti vedere l'applicazione

### Passo 10: Verificare Funzionamento

1. **Test login**
   - Vai su `https://tuo-app.azurestaticapps.net/signin`
   - Accedi con credenziali admin

2. **Test dashboard**
   - Verifica che la dashboard si carichi
   - Controlla che i dati vengano caricati dal database

3. **Test funzionalità**
   - Crea una richiesta budget
   - Verifica approvazioni (se admin)
   - Controlla che tutte le pagine funzionino

---

## 🔧 Opzione B: Azure App Service (Alternativa)

Se Azure Static Web Apps non funziona o hai bisogno di più controllo:

### Passo 1: Creare App Service

```bash
# Crea App Service Plan
az appservice plan create \
  --name plan-digimax-budget \
  --resource-group rg-digimax-budget-marketing \
  --sku B1 \
  --is-linux

# Crea Web App
az webapp create \
  --name digimax-budget-marketing \
  --resource-group rg-digimax-budget-marketing \
  --plan plan-digimax-budget \
  --runtime "NODE:18-lts"
```

### Passo 2: Configurare Deployment Center

1. **Azure Portal** → Web App → **Deployment Center**
2. **Source**: GitHub
3. **Collega repository** GitHub
4. **Branch**: `main`
5. **Build provider**: GitHub Actions

### Passo 3: Configurare Variabili Ambiente

Azure Portal → Web App → **Configuration** → **Application settings**:

```
AUTH_SECRET = <secret>
DATABASE_URL = <connection-string>
NEXTAUTH_URL = https://digimax-budget-marketing.azurewebsites.net
NODE_ENV = production
WEBSITE_NODE_DEFAULT_VERSION = 18-lts
```

### Passo 4: Configurare Startup Command

Azure Portal → Web App → **Configuration** → **General settings**:

**Startup Command**: `npm run start`

### Passo 5: GitHub Actions Workflow

Azure creerà automaticamente un workflow. Modificalo per includere Prisma:

```yaml
name: Azure Web App Deployment

on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Generate Prisma Client
        run: npm run prisma:generate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
      - name: Build
        run: npm run build
        env:
          NODE_ENV: production
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          AUTH_SECRET: ${{ secrets.AUTH_SECRET }}
          NEXTAUTH_URL: ${{ secrets.NEXTAUTH_URL }}
      
      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v2
        with:
          app-name: 'digimax-budget-marketing'
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
```

---

## 🔍 Troubleshooting

### Problema: Build fallisce in GitHub Actions

**Errore**: "Prisma Client not generated"
- **Soluzione**: Aggiungi step `npm run prisma:generate` nel workflow prima del build

**Errore**: "Cannot find module '@prisma/client'"
- **Soluzione**: Verifica che `npm ci` sia eseguito prima di `prisma generate`

### Problema: App non si carica

**Errore**: "Invalid AUTH_SECRET"
- **Soluzione**: Verifica che `AUTH_SECRET` sia configurato sia in GitHub Secrets che Azure Application Settings

**Errore**: "Database connection failed"
- **Soluzione**: 
  - Verifica `DATABASE_URL` in Azure Application Settings
  - Verifica firewall rules del database PostgreSQL
  - Verifica che SSL sia abilitato (`sslmode=require`)

### Problema: Next.js non funziona su Static Web Apps

**Errore**: "404 Not Found" su tutte le route
- **Soluzione**: 
  - Verifica che `output_location` sia `.next`
  - Verifica che `app_location` sia corretto
  - Considera di usare Azure App Service invece

### Problema: GitHub Actions non parte

**Soluzione**: 
- Verifica che Azure abbia accesso a GitHub
- Vai su Azure Portal → Static Web App → **Deployment Center** → riconnetti GitHub

---

## ✅ Checklist Finale

Prima di considerare il deploy completo:

- [ ] Repository GitHub configurato
- [ ] Azure Static Web App creato
- [ ] GitHub Actions workflow configurato e testato
- [ ] Database PostgreSQL creato e accessibile
- [ ] Migrations applicate (`npx prisma migrate deploy`)
- [ ] Prisma Client generato (`npm run prisma:generate`)
- [ ] Utente admin creato nel database
- [ ] Secrets GitHub configurati (AUTH_SECRET, DATABASE_URL, NEXTAUTH_URL)
- [ ] Application Settings Azure configurati
- [ ] Build GitHub Actions completata con successo
- [ ] App accessibile pubblicamente
- [ ] Login funziona
- [ ] Dashboard carica dati correttamente
- [ ] Funzionalità principali testate

---

## 📞 Supporto

### Risorse Utili

- **Azure Static Web Apps Docs**: https://docs.microsoft.com/azure/static-web-apps/
- **Next.js on Azure**: https://nextjs.org/docs/deployment#azure-static-web-apps
- **GitHub Actions**: https://docs.github.com/en/actions

### Debug

- **Azure Portal Logs**: Static Web App → **Log stream** per vedere log in tempo reale
- **GitHub Actions Logs**: Repository → **Actions** → Click sul workflow → Vedi log
- **Database Logs**: Azure Database for PostgreSQL → **Server logs**

---

## 🎉 Congratulazioni!

Una volta completati tutti i passi, l'applicazione sarà deployata su Azure e accessibile pubblicamente!

**Prossimi passi**:
- Configurare custom domain (opzionale)
- Configurare backup automatici database
- Setup monitoring e alerting
- Configurare SSL certificate (se custom domain)

---

**Fine Guida**

*Documento generato: Novembre 2024*

