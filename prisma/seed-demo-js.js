const { PrismaClient, BudgetRequestStatus } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.budgetAllocation.deleteMany({});
    await tx.budgetRequest.deleteMany({});
    await tx.campaign.deleteMany({});
    await tx.keyResult.deleteMany({});
    await tx.quarterSprint.deleteMany({});
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

  const q3Sprint = await prisma.quarterSprint.create({
    data: {
      name: "Quarter Sprint Q3",
      code: "QS-FY24-Q3",
      shortCode: "Q3",
      objectiveSummary: "Consolidare la presenza digitale e preparare il lancio autunnale.",
      quarter: 3,
      startDate: new Date("2024-07-01"),
      endDate: new Date("2024-09-30"),
      fiscalYearId: fiscalYear.id,
      objectiveId: conversionObjective.id,
    },
  });

  const q4Sprint = await prisma.quarterSprint.create({
    data: {
      name: "Quarter Sprint Q4",
      code: "QS-FY24-Q4",
      shortCode: "Q4",
      objectiveSummary: "Generare lead qualificati e rafforzare la loyalty clienti.",
      quarter: 4,
      startDate: new Date("2024-10-01"),
      endDate: new Date("2024-12-31"),
      fiscalYearId: fiscalYear.id,
      objectiveId: conversionObjective.id,
    },
  });

  const eventsSprint = await prisma.quarterSprint.create({
    data: {
      name: "Quarter Sprint Eventi",
      code: "QS-FY24-EVENT",
      shortCode: "EVT",
      objectiveSummary: "Coordinare eventi di relazione e partnership strategiche.",
      quarter: 2,
      startDate: new Date("2024-05-01"),
      endDate: new Date("2024-08-31"),
      fiscalYearId: fiscalYear.id,
      objectiveId: eventObjective.id,
    },
  });

  const krDigitalReach = await prisma.keyResult.create({
    data: {
      title: "MQL generati da campagne digital",
      metric: "MQL",
      targetValue: 250,
      progressValue: 0,
      unit: "leads",
      weight: 120,
      quarterSprintId: q3Sprint.id,
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
      quarterSprintId: eventsSprint.id,
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
      quarterSprintId: q4Sprint.id,
    },
  });

  await prisma.campaign.create({
    data: {
      name: "Brand Refresh Q3",
      fiscalYearId: fiscalYear.id,
      channelId: digitalChannel.id,
      ownerId: elena.id,
      quarterSprintId: q3Sprint.id,
      keyResultId: krDigitalReach.id,
      goal: "Rafforzare la percezione del brand e migliorare la UX dei touchpoint digitali.",
      allocations: {
        create: {
          fiscalYearId: fiscalYear.id,
          allocated: 320_000,
          spent: 185_000,
        },
      },
    },
  });

  await prisma.campaign.create({
    data: {
      name: "Evento Clienti Milano",
      fiscalYearId: fiscalYear.id,
      channelId: eventsChannel.id,
      ownerId: marco.id,
      quarterSprintId: eventsSprint.id,
      keyResultId: krEventPipeline.id,
      goal: "Evento di networking con clienti chiave del Nord Italia.",
      allocations: {
        create: {
          fiscalYearId: fiscalYear.id,
          allocated: 210_000,
          spent: 190_000,
        },
      },
    },
  });

  await prisma.campaign.create({
    data: {
      name: "Programma ABM Enterprise",
      fiscalYearId: fiscalYear.id,
      channelId: abmChannel.id,
      ownerId: chiara.id,
      quarterSprintId: q4Sprint.id,
      keyResultId: krABMPipeline.id,
      goal: "Targeting su 50 account enterprise con campagne personalizzate.",
      allocations: {
        create: {
          fiscalYearId: fiscalYear.id,
          allocated: 450_000,
          spent: 320_000,
        },
      },
    },
  });

  const now = new Date();

  await prisma.budgetRequest.createMany({
    data: [
      {
        title: "Richiesta Budget Q4 - Content Marketing",
        fiscalYearId: fiscalYear.id,
        requesterId: elena.id,
        amount: 85_000,
        dueDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
        status: BudgetRequestStatus.PENDING_APPROVAL,
        notes: "Budget per produzione contenuti video e infografiche.",
        quarterSprintId: q4Sprint.id,
        keyResultId: krDigitalReach.id,
      },
      {
        title: "Richiesta Budget Fiera IT Expo",
        fiscalYearId: fiscalYear.id,
        requesterId: marco.id,
        amount: 120_000,
        dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        status: BudgetRequestStatus.APPROVED,
        notes: "Fiera IT Expo con stand e networking event.",
        quarterSprintId: eventsSprint.id,
        keyResultId: krEventPipeline.id,
      },
      {
        title: "Richiesta Budget Campagna ABM",
        fiscalYearId: fiscalYear.id,
        requesterId: chiara.id,
        amount: 95_000,
        dueDate: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000),
        status: BudgetRequestStatus.REJECTED,
        notes: "Campagna ABM su 30 account mid-market.",
        quarterSprintId: q4Sprint.id,
        keyResultId: krABMPipeline.id,
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

  // Quarter Sprint da novembre 2024 in poi
  const novDecSprint = await prisma.quarterSprint.create({
    data: {
      name: "Novembre-Dicembre 2024",
      code: "QS-FY25-NOV-DEC",
      shortCode: "N-D",
      objectiveSummary: "Chiusura anno con focus su acquisizione e retention.",
      quarter: 4,
      startDate: new Date("2024-11-01"),
      endDate: new Date("2024-12-31"),
      fiscalYearId: fiscalYear2025.id,
      objectiveId: novemberObjective.id,
    },
  });

  const jan2025Sprint = await prisma.quarterSprint.create({
    data: {
      name: "Gennaio 2025",
      code: "QS-FY25-JAN",
      shortCode: "JAN",
      objectiveSummary: "Avvio anno fiscale con campagne di lancio prodotti.",
      quarter: 1,
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-01-31"),
      fiscalYearId: fiscalYear2025.id,
      objectiveId: q1_2025Objective.id,
    },
  });

  const feb2025Sprint = await prisma.quarterSprint.create({
    data: {
      name: "Febbraio 2025",
      code: "QS-FY25-FEB",
      shortCode: "FEB",
      objectiveSummary: "Crescita awareness e engagement attraverso contenuti educativi.",
      quarter: 1,
      startDate: new Date("2025-02-01"),
      endDate: new Date("2025-02-28"),
      fiscalYearId: fiscalYear2025.id,
      objectiveId: decemberObjective.id,
    },
  });

  const mar2025Sprint = await prisma.quarterSprint.create({
    data: {
      name: "Marzo 2025",
      code: "QS-FY25-MAR",
      shortCode: "MAR",
      objectiveSummary: "Consolidamento posizionamento e preparazione Q2.",
      quarter: 1,
      startDate: new Date("2025-03-01"),
      endDate: new Date("2025-03-31"),
      fiscalYearId: fiscalYear2025.id,
      objectiveId: q1_2025Objective.id,
    },
  });

  const apr2025Sprint = await prisma.quarterSprint.create({
    data: {
      name: "Aprile 2025",
      code: "QS-FY25-APR",
      shortCode: "APR",
      objectiveSummary: "Apertura Q2 con focus su eventi e partnership.",
      quarter: 2,
      startDate: new Date("2025-04-01"),
      endDate: new Date("2025-04-30"),
      fiscalYearId: fiscalYear2025.id,
      objectiveId: novemberObjective.id,
    },
  });

  const may2025Sprint = await prisma.quarterSprint.create({
    data: {
      name: "Maggio 2025",
      code: "QS-FY25-MAY",
      shortCode: "MAY",
      objectiveSummary: "Espansione campagne digitali e ottimizzazione conversioni.",
      quarter: 2,
      startDate: new Date("2025-05-01"),
      endDate: new Date("2025-05-31"),
      fiscalYearId: fiscalYear2025.id,
      objectiveId: decemberObjective.id,
    },
  });

  const jun2025Sprint = await prisma.quarterSprint.create({
    data: {
      name: "Giugno 2025",
      code: "QS-FY25-JUN",
      shortCode: "JUN",
      objectiveSummary: "Chiusura semestre con analisi performance e pianificazione H2.",
      quarter: 2,
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-30"),
      fiscalYearId: fiscalYear2025.id,
      objectiveId: q1_2025Objective.id,
    },
  });

  // Key Results per i nuovi quarter sprint
  const krNovDec = await prisma.keyResult.create({
    data: {
      title: "MQL generati Novembre-Dicembre",
      metric: "MQL",
      targetValue: 300,
      progressValue: 0,
      unit: "leads",
      weight: 100,
      quarterSprintId: novDecSprint.id,
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
      quarterSprintId: jan2025Sprint.id,
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
      quarterSprintId: feb2025Sprint.id,
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
      quarterSprintId: mar2025Sprint.id,
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
      quarterSprintId: apr2025Sprint.id,
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
      quarterSprintId: may2025Sprint.id,
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
      quarterSprintId: jun2025Sprint.id,
    },
  });

  // Campagne da novembre 2024 in poi
  await prisma.campaign.create({
    data: {
      name: "Campagna Natale 2024 - Nord Europa",
      fiscalYearId: fiscalYear2025.id,
      channelId: digitalChannel.id,
      ownerId: elena.id,
      quarterSprintId: novDecSprint.id,
      keyResultId: krNovDec.id,
      goal: "Crescita awareness e acquisizione nuovi clienti nei mercati nordici durante il periodo natalizio.",
      allocations: {
        create: {
          fiscalYearId: fiscalYear2025.id,
          allocated: 280_000,
          spent: 0,
        },
      },
    },
  });

  await prisma.campaign.create({
    data: {
      name: "Lancio Nuova Piattaforma Gennaio 2025",
      fiscalYearId: fiscalYear2025.id,
      channelId: digitalChannel.id,
      ownerId: marco.id,
      quarterSprintId: jan2025Sprint.id,
      keyResultId: krJan2025.id,
      goal: "Lancio comunicativo della nuova piattaforma digitale con focus su lead generation.",
      allocations: {
        create: {
          fiscalYearId: fiscalYear2025.id,
          allocated: 450_000,
          spent: 0,
        },
      },
    },
  });

  await prisma.campaign.create({
    data: {
      name: "Content Hub Educativo Febbraio 2025",
      fiscalYearId: fiscalYear2025.id,
      channelId: digitalChannel.id,
      ownerId: chiara.id,
      quarterSprintId: feb2025Sprint.id,
      keyResultId: krFeb2025.id,
      goal: "Creazione e distribuzione contenuti educativi per aumentare engagement e brand authority.",
      allocations: {
        create: {
          fiscalYearId: fiscalYear2025.id,
          allocated: 180_000,
          spent: 0,
        },
      },
    },
  });

  await prisma.campaign.create({
    data: {
      name: "Ottimizzazione Conversioni Marzo 2025",
      fiscalYearId: fiscalYear2025.id,
      channelId: digitalChannel.id,
      ownerId: elena.id,
      quarterSprintId: mar2025Sprint.id,
      keyResultId: krMar2025.id,
      goal: "Test e ottimizzazione landing pages per migliorare il conversion rate.",
      allocations: {
        create: {
          fiscalYearId: fiscalYear2025.id,
          allocated: 120_000,
          spent: 0,
        },
      },
    },
  });

  await prisma.campaign.create({
    data: {
      name: "Evento Fiera Milano Aprile 2025",
      fiscalYearId: fiscalYear2025.id,
      channelId: eventsChannel.id,
      ownerId: marco.id,
      quarterSprintId: apr2025Sprint.id,
      keyResultId: krApr2025.id,
      goal: "Partecipazione a fiera di settore con stand e networking event.",
      allocations: {
        create: {
          fiscalYearId: fiscalYear2025.id,
          allocated: 350_000,
          spent: 0,
        },
      },
    },
  });

  await prisma.campaign.create({
    data: {
      name: "Performance Marketing Maggio 2025",
      fiscalYearId: fiscalYear2025.id,
      channelId: digitalChannel.id,
      ownerId: chiara.id,
      quarterSprintId: may2025Sprint.id,
      keyResultId: krMay2025.id,
      goal: "Campagne performance su Google Ads e LinkedIn per massimizzare ROAS.",
      allocations: {
        create: {
          fiscalYearId: fiscalYear2025.id,
          allocated: 520_000,
          spent: 0,
        },
      },
    },
  });

  await prisma.campaign.create({
    data: {
      name: "Programma ABM Enterprise Giugno 2025",
      fiscalYearId: fiscalYear2025.id,
      channelId: abmChannel.id,
      ownerId: elena.id,
      quarterSprintId: jun2025Sprint.id,
      keyResultId: krJun2025.id,
      goal: "Targeting su 80 account enterprise con campagne personalizzate e account-based tactics.",
      allocations: {
        create: {
          fiscalYearId: fiscalYear2025.id,
          allocated: 680_000,
          spent: 0,
        },
      },
    },
  });
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

