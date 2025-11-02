# Guida Deploy - Digimax Budget Hub

## Prerequisiti

- Node.js ≥ 18
- Database PostgreSQL (per produzione) o SQLite (solo sviluppo)
- Variabili ambiente configurate

## Build di Produzione

### 1. Preparazione ambiente

Crea un file `.env.production` (o configura le variabili nel tuo provider):

```env
# NextAuth Configuration
AUTH_SECRET=<genera-con-openssl-rand-base64-32>
NEXTAUTH_URL=https://tuo-dominio.com

# Database (PostgreSQL per produzione)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/digimax_budget?schema=public"

# Opzionale: Debug mode
NODE_ENV=production
```

**Generare AUTH_SECRET sicuro**:
```bash
openssl rand -base64 32
```

### 2. Build

```bash
# Installa dipendenze
npm ci

# Genera Prisma Client
npm run prisma:generate

# Build Next.js
npm run build
```

### 3. Verifica build

```bash
# Test locale con build di produzione
npm run start
```

Verifica che:
- La build completi senza errori
- Il server si avvii correttamente
- Le pagine si carichino senza errori 404/500

## Deploy Vercel

### Setup rapido

1. Collega il repository GitHub a Vercel
2. Vercel rileverà automaticamente Next.js
3. Configura le variabili ambiente in Vercel Dashboard:
   - `AUTH_SECRET`
   - `DATABASE_URL`
   - `NEXTAUTH_URL` (sarà impostato automaticamente)

### Deploy manuale

```bash
# Installa Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Database Vercel Postgres

Se usi Vercel Postgres, la `DATABASE_URL` viene fornita automaticamente come variabile ambiente. Applica le migrazioni:

```bash
npx prisma migrate deploy
```

## Deploy Azure Static Web Apps

### Prerequisites
- Azure CLI installato
- Account Azure con subscription attiva

### 1. Crea Static Web App

```bash
az staticwebapp create \
  --name digimax-budget-hub \
  --resource-group <your-resource-group> \
  --sku Standard \
  --location "West Europe"
```

### 2. Configura variabili ambiente

```bash
az staticwebapp appsettings set \
  --name digimax-budget-hub \
  --resource-group <your-resource-group> \
  --setting-names AUTH_SECRET=<your-secret> DATABASE_URL=<your-db-url> NEXTAUTH_URL=https://<your-app>.azurestaticapps.net
```

### 3. Deploy da GitHub Actions

Azure creerà automaticamente un workflow GitHub Actions. Assicurati che includa:

```yaml
- name: Build And Deploy
  uses: Azure/static-web-apps-deploy@v1
  with:
    azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
    app_location: "/digimax-budget-marketing"
    output_location: ".next"
```

### 4. Database Azure SQL

Connetti il database Azure SQL modificando `DATABASE_URL`:

```
DATABASE_URL="postgresql://user:password@server.database.windows.net:5432/digimax_budget?sslmode=require"
```

Applica le migrazioni:
```bash
npx prisma migrate deploy
```

## Deploy Docker

### 1. Crea Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

**Nota**: Aggiungi `output: 'standalone'` a `next.config.ts` per build standalone.

### 2. Build e run

```bash
docker build -t digimax-budget-hub .
docker run -p 3000:3000 \
  -e AUTH_SECRET=<secret> \
  -e DATABASE_URL=<db-url> \
  -e NEXTAUTH_URL=http://localhost:3000 \
  digimax-budget-hub
```

## Checklist Pre-Deploy

- [ ] Variabili ambiente configurate (`.env.production`)
- [ ] `AUTH_SECRET` generato e sicuro
- [ ] `DATABASE_URL` punta a database produzione
- [ ] `NEXTAUTH_URL` corrisponde al dominio di deploy
- [ ] Build locale testata (`npm run build && npm run start`)
- [ ] Database migrazioni applicate (`npx prisma migrate deploy`)
- [ ] Seed admin eseguito (se necessario)
- [ ] Logging e monitoring configurati

## Post-Deploy

### Verifica funzionamento

1. **Test login**: accedi con credenziali admin
2. **Test dashboard**: verifica che i dati vengano caricati
3. **Test navigazione**: verifica che tutte le pagine siano accessibili
4. **Test responsive**: verifica su mobile/tablet

### Monitoraggio

- Monitora i log del server per errori
- Verifica metriche database (connessioni, query lente)
- Imposta alerting per errori 5xx

## Rollback

### Vercel
Usa il dashboard Vercel per rollback a una versione precedente.

### Azure Static Web Apps
```bash
az staticwebapp deployment list \
  --name digimax-budget-hub \
  --resource-group <your-resource-group>
```

Poi promuovi una versione precedente:
```bash
az staticwebapp deployment promote \
  --name digimax-budget-hub \
  --resource-group <your-resource-group} \
  --deployment-id <deployment-id>
```

### Docker
Esegui il container con un tag precedente:
```bash
docker run digimax-budget-hub:v1.0
```

## Troubleshooting

### Errori comuni

**"Invalid AUTH_SECRET"**
- Verifica che `AUTH_SECRET` sia impostato e non vuoto
- Regenera con `openssl rand -base64 32`

**"Database connection failed"**
- Verifica `DATABASE_URL` e credenziali
- Controlla firewall/network rules per PostgreSQL
- Verifica SSL mode se necessario

**"NEXTAUTH_URL mismatch"**
- `NEXTAUTH_URL` deve corrispondere esattamente al dominio pubblico
- Non includere trailing slash

**Build fallisce con errori Prisma**
- Esegui `npm run prisma:generate` prima del build
- Verifica che `DATABASE_URL` sia accessibile durante il build

## Sicurezza Produzione

- ✅ **AUTH_SECRET**: usa un secret forte e non condividerlo
- ✅ **DATABASE_URL**: usa connection pooling e SSL
- ✅ **HTTPS**: sempre in produzione
- ✅ **CORS**: configura correttamente se usi API esterne
- ✅ **Rate limiting**: considera limitazione richieste auth
- ✅ **Logging**: non loggare informazioni sensibili (password, tokens)

