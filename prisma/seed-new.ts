// @ts-nocheck
import { PrismaClient, BudgetRequestStatus, MetricTrend, VisibilityScope, CampaignStatus, KeyResultStatus, ObjectiveStatus } from "@prisma/client";
import { hash } from "bcryptjs";
import path from "node:path";

if (!process.env.DATABASE_URL) {
  const projectRoot = path.resolve(__dirname, "..");
  const absoluteDbPath = path.join(projectRoot, "prisma", "dev.db");
  process.env.DATABASE_URL = `file:${absoluteDbPath}`;
}

const prisma = new PrismaClient();

async function main() {
  console.info("🌱 Seeding database with new schema (Campaign-Objective-KeyResult)...");

  const defaultPassword = await hash("demo123", 10);

  // Create Roles
  const adminRole = await prisma.marketingRole.upsert({
    where: { key: "admin" },
    update: { name: "Administrator", visibility: VisibilityScope.FULL },
    create: { key: "admin", name: "Administrator", visibility: VisibilityScope.FULL },
  });

  const requesterRole = await prisma.marketingRole.create({
    data: {
      key: "USER",
      name: "Utente Standard",
      description: "Utente standard che può creare richieste budget",
      visibility: VisibilityScope.LIMITED,
    },
  });

  const marketingManagerRole = await prisma.marketingRole.create({
    data: {
      key: "MARKETING_MANAGER",
      name: "Marketing Manager",
      description: "Gestisce campagne e approvazioni",
      visibility: VisibilityScope.FULL,
    },
  });

  // Create admin user
  const admin = await prisma.marketingUser.create({
    data: {
      email: "admin@example.com",
      fullName: "Admin User",
      roleId: adminRole.id,
      password: await hash("admin123", 10),
    },
  });

  // Create demo users
  const chiara = await prisma.marketingUser.create({
    data: {
      fullName: "Chiara Bianchi",
      email: "chiara.bianchi@digimax.mock",
      roleId: marketingManagerRole.id,
      password: defaultPassword,
    },
  });

  const elena = await prisma.marketingUser.create({
    data: {
      fullName: "Elena Ferri",
      email: "elena.ferri@digimax.mock",
      roleId: requesterRole.id,
      password: defaultPassword,
    },
  });

  const marco = await prisma.marketingUser.create({
    data: {
      fullName: "Marco Neri",
      email: "marco.neri@digimax.mock",
      roleId: requesterRole.id,
      password: defaultPassword,
    },
  });

  const requester = await prisma.marketingUser.create({
    data: {
      fullName: "Mario Requester",
      email: "requester@digimax.mock",
      roleId: requesterRole.id,
      password: defaultPassword,
    },
  });

  // Create Fiscal Year
  const fiscalYear = await prisma.fiscalYear.create({
    data: {
      code: "FY25",
      label: "Fiscal Year 2025",
      totalBudget: 2_500_000,
      currency: "EUR",
    },
  });

  // Create Budget Snapshots
  await prisma.budgetSnapshot.createMany({
    data: [
      {
        fiscalYearId: fiscalYear.id,
        label: "Budget Annuale",
        amount: 2_500_000,
        trend: MetricTrend.UP,
        changePercentage: 12.5,
      },
      {
        fiscalYearId: fiscalYear.id,
        label: "Spesa YTD",
        amount: 475_000,
        trend: MetricTrend.DOWN,
        changePercentage: -4.2,
      },
      {
        fiscalYearId: fiscalYear.id,
        label: "Disponibile",
        amount: 2_025_000,
        trend: MetricTrend.FLAT,
        changePercentage: 0,
      },
    ],
  });

  // Create Marketing Channels
  const digitalChannel = await prisma.marketingChannel.create({
    data: {
      name: "Digital Marketing",
      slug: "digital-marketing",
      description: "Campagne web, social e content marketing",
    },
  });

  const eventsChannel = await prisma.marketingChannel.create({
    data: {
      name: "Eventi & Fiere",
      slug: "events",
      description: "Fiere, eventi di networking e iniziative",
    },
  });

  const abmChannel = await prisma.marketingChannel.create({
    data: {
      name: "Account Based Marketing",
      slug: "abm",
      description: "Programmi ABM e campagne su account strategici",
    },
  });

  // Create Objectives
  const objective1 = await prisma.objective.create({
    data: {
      title: "Aumentare Brand Awareness del 40%",
      description: "Consolidare la presenza digitale e rafforzare il brand",
      fiscalYearId: fiscalYear.id,
      ownerId: chiara.id,
      status: ObjectiveStatus.ACTIVE,
      progress: 25.0,
    },
  });

  const objective2 = await prisma.objective.create({
    data: {
      title: "Generare 500 Lead Qualificati",
      description: "Acquisire lead enterprise attraverso ABM e eventi",
      fiscalYearId: fiscalYear.id,
      ownerId: chiara.id,
      status: ObjectiveStatus.ACTIVE,
      progress: 18.0,
    },
  });

  // Create Campaigns (ex QuarterSprint + Campaign)
  const campaignQ1 = await prisma.campaign.create({
    data: {
      name: "Digital Brand Refresh Q1",
      description: "Refresh del brand digitale con focus su social media",
      code: "FY25-Q1-DIGITAL",
      shortCode: "Q1D",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-03-31"),
      quarter: 1,
      fiscalYearId: fiscalYear.id,
      channelId: digitalChannel.id,
      ownerId: elena.id,
      objectiveId: objective1.id,
      goal: "Rafforzare la percezione del brand attraverso contenuti digitali di qualità",
      status: CampaignStatus.ACTIVE,
    },
  });

  const campaignQ2 = await prisma.campaign.create({
    data: {
      name: "ABM Enterprise Q2",
      description: "Programma ABM su 50 account enterprise target",
      code: "FY25-Q2-ABM",
      shortCode: "Q2A",
      startDate: new Date("2025-04-01"),
      endDate: new Date("2025-06-30"),
      quarter: 2,
      fiscalYearId: fiscalYear.id,
      channelId: abmChannel.id,
      ownerId: chiara.id,
      objectiveId: objective2.id,
      goal: "Targeting su account enterprise con campagne personalizzate",
      status: CampaignStatus.PLANNED,
    },
  });

  const campaignQ3 = await prisma.campaign.create({
    data: {
      name: "Eventi Corporate Q3",
      description: "Fiere e networking events per il mercato corporate",
      code: "FY25-Q3-EVENTS",
      shortCode: "Q3E",
      startDate: new Date("2025-07-01"),
      endDate: new Date("2025-09-30"),
      quarter: 3,
      fiscalYearId: fiscalYear.id,
      channelId: eventsChannel.id,
      ownerId: marco.id,
      objectiveId: objective2.id,
      goal: "Evento di networking con clienti chiave e presentazione roadmap",
      status: CampaignStatus.PLANNED,
    },
  });

  // Create Budget Allocations
  await prisma.budgetAllocation.createMany({
    data: [
      {
        campaignId: campaignQ1.id,
        fiscalYearId: fiscalYear.id,
        allocated: 320_000,
        spent: 85_000,
      },
      {
        campaignId: campaignQ2.id,
        fiscalYearId: fiscalYear.id,
        allocated: 450_000,
        spent: 0,
      },
      {
        campaignId: campaignQ3.id,
        fiscalYearId: fiscalYear.id,
        allocated: 210_000,
        spent: 0,
      },
    ],
  });

  // Create Key Results
  const kr1 = await prisma.keyResult.create({
    data: {
      title: "Aumentare follower social del 30%",
      metric: "Follower social media",
      targetValue: 50000,
      progressValue: 12500,
      unit: "follower",
      weight: 100,
      status: KeyResultStatus.ON_TRACK,
      campaignId: campaignQ1.id,
      ownerId: elena.id,
    },
  });

  const kr2 = await prisma.keyResult.create({
    data: {
      title: "Generare 200 lead enterprise",
      metric: "Lead qualificati",
      targetValue: 200,
      progressValue: 35,
      unit: "lead",
      weight: 100,
      status: KeyResultStatus.ON_TRACK,
      campaignId: campaignQ2.id,
      ownerId: chiara.id,
    },
  });

  const kr3 = await prisma.keyResult.create({
    data: {
      title: "Organizzare 3 eventi corporate",
      metric: "Eventi realizzati",
      targetValue: 3,
      progressValue: 0,
      unit: "eventi",
      weight: 100,
      status: KeyResultStatus.NOT_STARTED,
      campaignId: campaignQ3.id,
      ownerId: marco.id,
    },
  });

  // Create Budget Requests
  const now = new Date();
  const fiveDays = 5 * 24 * 60 * 60 * 1000;
  const tenDays = 10 * 24 * 60 * 60 * 1000;

  await prisma.budgetRequest.create({
    data: {
      title: "Content Creation Q1 - Video e Infografiche",
      fiscalYearId: fiscalYear.id,
      requesterId: elena.id,
      campaignId: campaignQ1.id,
      keyResultId: kr1.id,
      amount: 45_000,
      dueDate: new Date(now.getTime() + fiveDays),
      status: BudgetRequestStatus.PENDING_APPROVAL,
      linkStatus: "ASSIGNED_TO_CAMPAIGN",
      notes: "Budget per produzione contenuti video e infografiche per social media Q1",
    },
  });

  await prisma.budgetRequest.create({
    data: {
      title: "ABM Tools & Platform License",
      fiscalYearId: fiscalYear.id,
      requesterId: chiara.id,
      campaignId: campaignQ2.id,
      keyResultId: kr2.id,
      amount: 65_000,
      dueDate: new Date(now.getTime() + tenDays),
      status: BudgetRequestStatus.PENDING_APPROVAL,
      linkStatus: "ASSIGNED_TO_CAMPAIGN",
      notes: "Licenze software ABM e tool per account targeting",
    },
  });

  await prisma.budgetRequest.create({
    data: {
      title: "Richiesta senza campagna collegata",
      fiscalYearId: fiscalYear.id,
      requesterId: marco.id,
      amount: 15_000,
      dueDate: new Date(now.getTime() + tenDays),
      status: BudgetRequestStatus.PENDING_APPROVAL,
      linkStatus: "UNDEFINED_OBJECTIVE",
      notes: "Esempio di richiesta senza collegamento OKR",
    },
  });

  // Create Operational Insights
  await prisma.operationalInsight.createMany({
    data: [
      {
        fiscalYearId: fiscalYear.id,
        title: "Campagna Q1 Digital in target",
        description: "La campagna Digital Q1 sta performando bene con il 26% del budget speso e progress on track",
        priority: 1,
        insightType: "ACHIEVEMENT",
      },
      {
        fiscalYearId: fiscalYear.id,
        title: "Pianificare campagne Q2 e Q3",
        description: "2 campagne pianificate richiedono attenzione: verificare allocazioni e preparare materiali",
        priority: 2,
        insightType: "RECOMMENDATION",
      },
    ],
  });

  console.info("✅ New schema data seeded successfully!");
  console.info("");
  console.info("📧 Login credentials:");
  console.info("   Admin: admin@example.com / admin123");
  console.info("   Requester: requester@digimax.mock / demo123");
  console.info("");
  console.info("   Demo users (password: demo123):");
  console.info("   - chiara.bianchi@digimax.mock (Marketing Manager)");
  console.info("   - elena.ferri@digimax.mock (User)");
  console.info("   - marco.neri@digimax.mock (User)");
  console.info("");
  console.info("📊 New Schema Structure:");
  console.info("   FiscalYear → Objective → Campaign → KeyResult");
  console.info("");
  console.info("   3 Objectives created");
  console.info("   3 Campaigns created (Q1, Q2, Q3)");
  console.info("   3 Key Results created");
  console.info("   3 Budget Requests created");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

