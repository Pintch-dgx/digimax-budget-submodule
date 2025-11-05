const { PrismaClient, BudgetRequestStatus } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.budgetAllocation.deleteMany({});
    await tx.budgetRequest.deleteMany({});
    await tx.campaign.deleteMany({});
    await tx.keyResult.deleteMany({});
    await tx.objective.deleteMany({});
    await tx.marketingChannel.deleteMany({});
    await tx.operationalInsight.deleteMany({});
    await tx.budgetSnapshot.deleteMany({});
    await tx.fiscalYear.deleteMany({});
    await tx.marketingUserVertical.deleteMany({});
    await tx.marketingUser.deleteMany({});
    await tx.marketingRole.deleteMany({});
    await tx.verticalArea.deleteMany({});
  });

  const adminRole = await prisma.marketingRole.create({
    data: {
      key: "admin",
      name: "Administrator",
      description: "Accesso completo a tutte le funzionalità incluso OKR planner.",
    },
  });

  const marketingManagerRole = await prisma.marketingRole.create({
    data: {
      key: "marketing-manager",
      name: "Marketing Manager",
      description: "Gestisce le attività marketing e approva le richieste di budget.",
    },
  });

  const specialistRole = await prisma.marketingRole.create({
    data: {
      key: "marketing-specialist",
      name: "Marketing Specialist",
      description: "Gestisce campagne e richieste di budget operative.",
    },
  });

  const verticalIndustry = await prisma.verticalArea.create({
    data: {
      slug: "industry-automation",
      name: "Industria e Automazione",
    },
  });

  const verticalLighting = await prisma.verticalArea.create({
    data: {
      slug: "lighting",
      name: "Illuminazione Professionale",
    },
  });

  const passwordHash = await bcrypt.hash("demo123", 10);

  const admin = await prisma.marketingUser.create({
    data: {
      fullName: "Admin User",
      email: "admin@digimax.local",
      password: passwordHash,
      roleId: adminRole.id,
      verticals: {
        create: [
          { verticalId: verticalIndustry.id },
          { verticalId: verticalLighting.id },
        ],
      },
    },
  });

  const elena = await prisma.marketingUser.create({
    data: {
      fullName: "Elena Ferri",
      email: "elena.ferri@digimax.mock",
      password: passwordHash,
      roleId: marketingManagerRole.id,
      verticals: {
        create: [{
          verticalId: verticalLighting.id,
        }],
      },
    },
  });

  const marco = await prisma.marketingUser.create({
    data: {
      fullName: "Marco Neri",
      email: "marco.neri@digimax.mock",
      password: passwordHash,
      roleId: specialistRole.id,
      verticals: {
        create: [{
          verticalId: verticalIndustry.id,
        }],
      },
    },
  });

  const chiara = await prisma.marketingUser.create({
    data: {
      fullName: "Chiara Riva",
      email: "chiara.riva@digimax.mock",
      password: passwordHash,
      roleId: specialistRole.id,
      verticals: {
        create: [
          { verticalId: verticalIndustry.id },
          { verticalId: verticalLighting.id },
        ],
      },
    },
  });

  const fiscalYear = await prisma.fiscalYear.create({
    data: {
      code: "FY24",
      label: "Fiscal Year 2024",
      totalBudget: 1_500_000,
      currency: "EUR",
    },
  });

  await prisma.budgetSnapshot.createMany({
    data: [
      {
        fiscalYearId: fiscalYear.id,
        label: "Q1 2024",
        amount: 320_000,
        trend: "UP",
        changePercentage: 12.5,
      },
      {
        fiscalYearId: fiscalYear.id,
        label: "Q2 2024",
        amount: 410_000,
        trend: "UP",
        changePercentage: 18.2,
      },
      {
        fiscalYearId: fiscalYear.id,
        label: "Q3 2024",
        amount: 365_000,
        trend: "DOWN",
        changePercentage: -7.5,
      },
      {
        fiscalYearId: fiscalYear.id,
        label: "Q4 2024",
        amount: 405_000,
        trend: "UP",
        changePercentage: 11.0,
      },
    ],
  });

  // Obiettivi Strategici
  const conversionObjective = await prisma.objective.create({
    data: {
      title: "Conversion Rate Landing Page",
      description: "Incrementare il conversion rate delle landing page principali del 15%",
      fiscalYearId: fiscalYear.id,
      ownerId: elena.id,
      status: "ACTIVE",
    },
  });

  const eventObjective = await prisma.objective.create({
    data: {
      title: "Lead Generation Eventi",
      description: "Raddoppiare i lead provenienti da eventi partner entro novembre",
      fiscalYearId: fiscalYear.id,
      ownerId: marco.id,
      status: "ACTIVE",
    },
  });

  const abmObjective = await prisma.objective.create({
    data: {
      title: "Opportunità Pipeline ABM",
      description: "Generare nuove opportunità di business attraverso strategie ABM su account enterprise",
      fiscalYearId: fiscalYear.id,
      ownerId: chiara.id,
      status: "ACTIVE",
    },
  });

  // Key Results collegati agli Obiettivi Strategici
  const krDigitalReach = await prisma.keyResult.create({
    data: {
      title: "MQL generati da campagne digital",
      metric: "MQL",
      targetValue: 250,
      progressValue: 0,
      unit: "leads",
      weight: 120,
      objectiveId: conversionObjective.id,
    },
  });

  const krEventPipeline = await prisma.keyResult.create({
    data: {
      title: "Lead qualificati da eventi",
      metric: "Lead qualificati",
      targetValue: 180,
      progressValue: 0,
      unit: "contatti",
      weight: 100,
      objectiveId: eventObjective.id,
    },
  });

  const krABMPipeline = await prisma.keyResult.create({
    data: {
      title: "Opportunità pipeline ABM",
      metric: "Opportunità",
      targetValue: 45,
      progressValue: 0,
      unit: "opportunità",
      weight: 90,
      objectiveId: abmObjective.id,
    },
  });

  // Canali Marketing
  const digitalChannel = await prisma.marketingChannel.create({
    data: {
      name: "Digital",
      slug: "digital",
      description: "Canali digitali e paid media",
    },
  });

  const eventsChannel = await prisma.marketingChannel.create({
    data: {
      name: "Eventi & Fiere",
      slug: "events",
      description: "Fiere ed eventi di networking",
    },
  });

  const abmChannel = await prisma.marketingChannel.create({
    data: {
      name: "Account Based Marketing",
      slug: "abm",
      description: "Programmi ABM su account strategici",
    },
  });

  // Campagne Q3 2024
  const campaign1 = await prisma.campaign.create({
    data: {
      name: "Brand Refresh Q3",
      description: "Rafforzare la percezione del brand e migliorare la UX dei touchpoint digitali.",
      code: "CAMP-FY24-Q3-001",
      shortCode: "BR-Q3",
      startDate: new Date("2024-07-01"),
      endDate: new Date("2024-09-30"),
      quarter: 3,
      fiscalYearId: fiscalYear.id,
      channelId: digitalChannel.id,
      ownerId: elena.id,
      objectiveId: conversionObjective.id,
      goal: "Rafforzare la percezione del brand e migliorare la UX dei touchpoint digitali.",
      allocatedBudget: 320_000,
      spentBudget: 185_000,
      status: "COMPLETED",
    },
  });

  const campaign2 = await prisma.campaign.create({
    data: {
      name: "Evento Clienti Milano",
      description: "Evento di networking con clienti chiave del Nord Italia.",
      code: "CAMP-FY24-Q2-002",
      shortCode: "ECM",
      startDate: new Date("2024-05-01"),
      endDate: new Date("2024-08-31"),
      quarter: 2,
      fiscalYearId: fiscalYear.id,
      channelId: eventsChannel.id,
      ownerId: marco.id,
      objectiveId: eventObjective.id,
      goal: "Evento di networking con clienti chiave del Nord Italia.",
      allocatedBudget: 210_000,
      spentBudget: 190_000,
      status: "COMPLETED",
    },
  });

  const campaign3 = await prisma.campaign.create({
    data: {
      name: "Programma ABM Enterprise",
      description: "Targeting su 50 account enterprise con campagne personalizzate.",
      code: "CAMP-FY24-Q4-003",
      shortCode: "ABM-ENT",
      startDate: new Date("2024-10-01"),
      endDate: new Date("2024-12-31"),
      quarter: 4,
      fiscalYearId: fiscalYear.id,
      channelId: abmChannel.id,
      ownerId: chiara.id,
      objectiveId: abmObjective.id,
      goal: "Targeting su 50 account enterprise con campagne personalizzate.",
      allocatedBudget: 450_000,
      spentBudget: 320_000,
      status: "ACTIVE",
    },
  });

  // Richieste di Budget collegate alle campagne
  const now = new Date();

  await prisma.budgetRequest.createMany({
    data: [
      {
        title: "Richiesta Budget Q4 - Content Marketing",
        fiscalYearId: fiscalYear.id,
        requesterId: elena.id,
        campaignId: campaign1.id,
        amount: 85_000,
        dueDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
        status: BudgetRequestStatus.PENDING_APPROVAL,
        notes: "Budget per produzione contenuti video e infografiche.",
      },
      {
        title: "Richiesta Budget Fiera IT Expo",
        fiscalYearId: fiscalYear.id,
        requesterId: marco.id,
        campaignId: campaign2.id,
        amount: 120_000,
        dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        status: BudgetRequestStatus.APPROVED,
        notes: "Fiera IT Expo con stand e networking event.",
      },
      {
        title: "Richiesta Budget Campagna ABM",
        fiscalYearId: fiscalYear.id,
        requesterId: chiara.id,
        campaignId: campaign3.id,
        amount: 95_000,
        dueDate: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000),
        status: BudgetRequestStatus.REJECTED,
        notes: "Campagna ABM su 30 account mid-market.",
      },
    ],
  });

  // ============================================
  // DATI DI TEST DA NOVEMBRE 2024 IN POI
  // ============================================

  // Crea Fiscal Year 2025 per i dati futuri
  const fiscalYear2025 = await prisma.fiscalYear.create({
    data: {
      code: "FY25",
      label: "Fiscal Year 2025",
      totalBudget: 2_000_000,
      currency: "EUR",
    },
  });

  // Obiettivi per novembre 2024 e oltre
  const novemberObjective = await prisma.objective.create({
    data: {
      title: "Espansione Mercato Nord Europa",
      description: "Incrementare la presenza commerciale nei mercati nordici attraverso campagne digitali mirate e partnership strategiche.",
      fiscalYearId: fiscalYear2025.id,
      ownerId: elena.id,
      status: "ACTIVE",
    },
  });

  const decemberObjective = await prisma.objective.create({
    data: {
      title: "Digital Transformation & Innovation",
      description: "Accelerare la trasformazione digitale attraverso investimenti in nuove tecnologie e piattaforme.",
      fiscalYearId: fiscalYear2025.id,
      ownerId: marco.id,
      status: "ACTIVE",
    },
  });

  const q1_2025Objective = await prisma.objective.create({
    data: {
      title: "Crescita Lead Generation Q1 2025",
      description: "Raggiungere 500 nuovi lead qualificati nel primo trimestre del 2025.",
      fiscalYearId: fiscalYear2025.id,
      ownerId: chiara.id,
      status: "ACTIVE",
    },
  });

  // Key Results per il 2025
  const krNovDec = await prisma.keyResult.create({
    data: {
      title: "MQL generati Novembre-Dicembre",
      metric: "MQL",
      targetValue: 300,
      progressValue: 0,
      unit: "leads",
      weight: 100,
      objectiveId: novemberObjective.id,
    },
  });

  const krJan2025 = await prisma.keyResult.create({
    data: {
      title: "Nuovi lead qualificati Gennaio",
      metric: "Qualified Leads",
      targetValue: 150,
      progressValue: 0,
      unit: "leads",
      weight: 120,
      objectiveId: q1_2025Objective.id,
    },
  });

  const krFeb2025 = await prisma.keyResult.create({
    data: {
      title: "Engagement rate contenuti",
      metric: "Engagement Rate",
      targetValue: 8.5,
      progressValue: 0,
      unit: "%",
      weight: 90,
      objectiveId: decemberObjective.id,
    },
  });

  const krMar2025 = await prisma.keyResult.create({
    data: {
      title: "Conversion rate landing pages",
      metric: "Conversion Rate",
      targetValue: 12.5,
      progressValue: 0,
      unit: "%",
      weight: 100,
      objectiveId: q1_2025Objective.id,
    },
  });

  const krApr2025 = await prisma.keyResult.create({
    data: {
      title: "Eventi partecipati e lead generati",
      metric: "Event Leads",
      targetValue: 200,
      progressValue: 0,
      unit: "leads",
      weight: 110,
      objectiveId: novemberObjective.id,
    },
  });

  const krMay2025 = await prisma.keyResult.create({
    data: {
      title: "ROAS campagne digitali",
      metric: "ROAS",
      targetValue: 4.2,
      progressValue: 0,
      unit: "ratio",
      weight: 100,
      objectiveId: decemberObjective.id,
    },
  });

  const krJun2025 = await prisma.keyResult.create({
    data: {
      title: "Pipeline generata Q2",
      metric: "Pipeline Value",
      targetValue: 2500000,
      progressValue: 0,
      unit: "EUR",
      weight: 120,
      objectiveId: q1_2025Objective.id,
    },
  });

  // Campagne da novembre 2024 in poi
  const camp2024Nov = await prisma.campaign.create({
    data: {
      name: "Campagna Natale 2024 - Nord Europa",
      description: "Crescita awareness e acquisizione nuovi clienti nei mercati nordici durante il periodo natalizio.",
      code: "CAMP-FY25-NOV-001",
      shortCode: "XMAS-24",
      startDate: new Date("2024-11-01"),
      endDate: new Date("2024-12-31"),
      quarter: 4,
      fiscalYearId: fiscalYear2025.id,
      channelId: digitalChannel.id,
      ownerId: elena.id,
      objectiveId: novemberObjective.id,
      goal: "Crescita awareness e acquisizione nuovi clienti nei mercati nordici durante il periodo natalizio.",
      allocatedBudget: 0,
      spentBudget: 0,
      status: "PLANNED",
    },
  });

  const camp2025Jan = await prisma.campaign.create({
    data: {
      name: "Lancio Nuova Piattaforma Gennaio 2025",
      description: "Lancio comunicativo della nuova piattaforma digitale con focus su lead generation.",
      code: "CAMP-FY25-JAN-002",
      shortCode: "PLAT-JAN",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-01-31"),
      quarter: 1,
      fiscalYearId: fiscalYear2025.id,
      channelId: digitalChannel.id,
      ownerId: marco.id,
      objectiveId: q1_2025Objective.id,
      goal: "Lancio comunicativo della nuova piattaforma digitale con focus su lead generation.",
      allocatedBudget: 0,
      spentBudget: 0,
      status: "PLANNED",
    },
  });

  const camp2025Feb = await prisma.campaign.create({
    data: {
      name: "Content Hub Educativo Febbraio 2025",
      description: "Creazione e distribuzione contenuti educativi per aumentare engagement e brand authority.",
      code: "CAMP-FY25-FEB-003",
      shortCode: "CONT-FEB",
      startDate: new Date("2025-02-01"),
      endDate: new Date("2025-02-28"),
      quarter: 1,
      fiscalYearId: fiscalYear2025.id,
      channelId: digitalChannel.id,
      ownerId: chiara.id,
      objectiveId: decemberObjective.id,
      goal: "Creazione e distribuzione contenuti educativi per aumentare engagement e brand authority.",
      allocatedBudget: 0,
      spentBudget: 0,
      status: "PLANNED",
    },
  });

  const camp2025Mar = await prisma.campaign.create({
    data: {
      name: "Ottimizzazione Conversioni Marzo 2025",
      description: "Test e ottimizzazione landing pages per migliorare il conversion rate.",
      code: "CAMP-FY25-MAR-004",
      shortCode: "CONV-MAR",
      startDate: new Date("2025-03-01"),
      endDate: new Date("2025-03-31"),
      quarter: 1,
      fiscalYearId: fiscalYear2025.id,
      channelId: digitalChannel.id,
      ownerId: elena.id,
      objectiveId: q1_2025Objective.id,
      goal: "Test e ottimizzazione landing pages per migliorare il conversion rate.",
      allocatedBudget: 0,
      spentBudget: 0,
      status: "PLANNED",
    },
  });

  const camp2025Apr = await prisma.campaign.create({
    data: {
      name: "Evento Fiera Milano Aprile 2025",
      description: "Partecipazione a fiera di settore con stand e networking event.",
      code: "CAMP-FY25-APR-005",
      shortCode: "FIERA-APR",
      startDate: new Date("2025-04-01"),
      endDate: new Date("2025-04-30"),
      quarter: 2,
      fiscalYearId: fiscalYear2025.id,
      channelId: eventsChannel.id,
      ownerId: marco.id,
      objectiveId: novemberObjective.id,
      goal: "Partecipazione a fiera di settore con stand e networking event.",
      allocatedBudget: 0,
      spentBudget: 0,
      status: "PLANNED",
    },
  });

  const camp2025May = await prisma.campaign.create({
    data: {
      name: "Performance Marketing Maggio 2025",
      description: "Campagne performance su Google Ads e LinkedIn per massimizzare ROAS.",
      code: "CAMP-FY25-MAY-006",
      shortCode: "PERF-MAY",
      startDate: new Date("2025-05-01"),
      endDate: new Date("2025-05-31"),
      quarter: 2,
      fiscalYearId: fiscalYear2025.id,
      channelId: digitalChannel.id,
      ownerId: chiara.id,
      objectiveId: decemberObjective.id,
      goal: "Campagne performance su Google Ads e LinkedIn per massimizzare ROAS.",
      allocatedBudget: 0,
      spentBudget: 0,
      status: "PLANNED",
    },
  });

  const camp2025Jun = await prisma.campaign.create({
    data: {
      name: "Programma ABM Enterprise Giugno 2025",
      description: "Targeting su 80 account enterprise con campagne personalizzate e account-based tactics.",
      code: "CAMP-FY25-JUN-007",
      shortCode: "ABM-JUN",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-30"),
      quarter: 2,
      fiscalYearId: fiscalYear2025.id,
      channelId: abmChannel.id,
      ownerId: elena.id,
      objectiveId: q1_2025Objective.id,
      goal: "Targeting su 80 account enterprise con campagne personalizzate e account-based tactics.",
      allocatedBudget: 0,
      spentBudget: 0,
      status: "PLANNED",
    },
  });

  console.log("✅ Seed completato con successo!");
  console.log(`- ${3} Ruoli creati`);
  console.log(`- ${4} Utenti creati`);
  console.log(`- ${2} Fiscal Years creati`);
  console.log(`- ${6} Obiettivi Strategici creati`);
  console.log(`- ${10} Key Results creati`);
  console.log(`- ${3} Canali Marketing creati`);
  console.log(`- ${10} Campagne create`);
  console.log(`- ${3} Budget Requests create`);
}

main()
  .then(() => {
    console.log("Demo data seeded successfully");
  })
  .catch((error) => {
    console.error("Failed to seed demo data", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
