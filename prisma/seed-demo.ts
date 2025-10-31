import { PrismaClient, BudgetRequestStatus, MetricTrend, VisibilityScope } from "@prisma/client";
import { hash } from "bcryptjs";
import path from "node:path";

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  const projectRoot = path.resolve(__dirname, "..");
  const absoluteDbPath = path.join(projectRoot, "prisma", "dev.db");
  process.env.DATABASE_URL = `file:${absoluteDbPath}`;
}

const prisma = new PrismaClient();

async function main() {
  console.info("🌱 Seeding database with demo data...");

  // Clean existing data (except keep admin user if exists)
  await prisma.marketingUserVertical.deleteMany();
  await prisma.operationalInsight.deleteMany();
  await prisma.budgetRequest.deleteMany();
  await prisma.budgetAllocation.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.marketingChannel.deleteMany();
  await prisma.budgetSnapshot.deleteMany();
  await prisma.fiscalYear.deleteMany();
  await prisma.marketingUserVertical.deleteMany();
  await prisma.verticalArea.deleteMany();
  // Keep existing roles and admin user, but update if needed

  // Create/ensure admin role and user
  const adminRole = await prisma.marketingRole.upsert({
    where: { key: "admin" },
    update: { name: "Administrator", visibility: VisibilityScope.FULL },
    create: { key: "admin", name: "Administrator", visibility: VisibilityScope.FULL },
  });

  const defaultPassword = await hash("demo123", 10);

  // Ensure admin user exists with password
  await prisma.marketingUser.upsert({
    where: { email: "admin@example.com" },
    update: { 
      fullName: "Admin User", 
      roleId: adminRole.id, 
      password: defaultPassword 
    },
    create: { 
      email: "admin@example.com", 
      fullName: "Admin User", 
      roleId: adminRole.id,
      password: defaultPassword 
    },
  });

  // Create Fiscal Year
  const fiscalYear = await prisma.fiscalYear.create({
    data: {
      code: "FY24",
      label: "Fiscal Year 2024",
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
        amount: 1_475_000,
        trend: MetricTrend.DOWN,
        changePercentage: -4.2,
      },
      {
        fiscalYearId: fiscalYear.id,
        label: "Disponibile",
        amount: 1_025_000,
        trend: MetricTrend.FLAT,
        changePercentage: 0,
      },
    ],
  });

  // Create Roles
  const digitalSpecialistRole = await prisma.marketingRole.upsert({
    where: { key: "DIGITAL_SPECIALIST" },
    update: {
      name: "Digital Experience Specialist",
      description: "Gestisce web design, social media, media creation e SEO operativo.",
      visibility: VisibilityScope.VERTICAL,
    },
    create: {
      key: "DIGITAL_SPECIALIST",
      name: "Digital Experience Specialist",
      description: "Gestisce web design, social media, media creation e SEO operativo.",
      visibility: VisibilityScope.VERTICAL,
    },
  });

  const engagementSpecialistRole = await prisma.marketingRole.upsert({
    where: { key: "ENGAGEMENT_SPECIALIST" },
    update: {
      name: "Engagement & Events Specialist",
      description: "Responsabile email marketing, fiere, eventi, iniziative di team building.",
      visibility: VisibilityScope.VERTICAL,
    },
    create: {
      key: "ENGAGEMENT_SPECIALIST",
      name: "Engagement & Events Specialist",
      description: "Responsabile email marketing, fiere, eventi, iniziative di team building.",
      visibility: VisibilityScope.VERTICAL,
    },
  });

  const marketingManagerRole = await prisma.marketingRole.upsert({
    where: { key: "MARKETING_MANAGER" },
    update: {
      name: "Marketing Manager Performance",
      description: "Focalizzazione SEO + Paid Ads con visibilità trasversale.",
      visibility: VisibilityScope.FULL,
    },
    create: {
      key: "MARKETING_MANAGER",
      name: "Marketing Manager Performance",
      description: "Focalizzazione SEO + Paid Ads con visibilità trasversale.",
      visibility: VisibilityScope.FULL,
    },
  });

  // Create Vertical Areas
  const digitalVertical = await prisma.verticalArea.create({
    data: {
      slug: "digital-experience",
      name: "Digital Experience",
      description: "Web design, social media, content creation e SEO operativo.",
    },
  });

  const engagementVertical = await prisma.verticalArea.create({
    data: {
      slug: "engagement-events",
      name: "Engagement & Events",
      description: "Email marketing, fiere, eventi e iniziative di team building.",
    },
  });

  const performanceVertical = await prisma.verticalArea.create({
    data: {
      slug: "performance-seo-ads",
      name: "Performance SEO & ADS",
      description: "Ottimizzazione SEO, gestione campagne ADV e performance marketing.",
    },
  });

  // Create Users with passwords
  const elena = await prisma.marketingUser.upsert({
    where: { email: "elena.ferri@digimax.mock" },
    update: {
      fullName: "Elena Ferri",
      roleId: digitalSpecialistRole.id,
      password: defaultPassword,
    },
    create: {
      fullName: "Elena Ferri",
      email: "elena.ferri@digimax.mock",
      roleId: digitalSpecialistRole.id,
      password: defaultPassword,
      verticals: {
        create: {
          verticalId: digitalVertical.id,
          visibility: VisibilityScope.VERTICAL,
        },
      },
    },
  });

  const marco = await prisma.marketingUser.upsert({
    where: { email: "marco.neri@digimax.mock" },
    update: {
      fullName: "Marco Neri",
      roleId: engagementSpecialistRole.id,
      password: defaultPassword,
    },
    create: {
      fullName: "Marco Neri",
      email: "marco.neri@digimax.mock",
      roleId: engagementSpecialistRole.id,
      password: defaultPassword,
      verticals: {
        create: {
          verticalId: engagementVertical.id,
          visibility: VisibilityScope.VERTICAL,
        },
      },
    },
  });

  const chiara = await prisma.marketingUser.upsert({
    where: { email: "chiara.bianchi@digimax.mock" },
    update: {
      fullName: "Chiara Bianchi",
      roleId: marketingManagerRole.id,
      password: defaultPassword,
    },
    create: {
      fullName: "Chiara Bianchi",
      email: "chiara.bianchi@digimax.mock",
      roleId: marketingManagerRole.id,
      password: defaultPassword,
      verticals: {
        create: [
          {
            verticalId: performanceVertical.id,
            visibility: VisibilityScope.FULL,
          },
          {
            verticalId: digitalVertical.id,
            visibility: VisibilityScope.FULL,
          },
        ],
      },
    },
  });

  // Create Marketing Channels
  const digitalChannel = await prisma.marketingChannel.create({
    data: {
      name: "Digital Marketing",
      slug: "digital-marketing",
      description: "Campagne web, social e content marketing.",
    },
  });

  const eventsChannel = await prisma.marketingChannel.create({
    data: {
      name: "Eventi & Fiere",
      slug: "events",
      description: "Fiere, eventi di networking e iniziative di team building.",
    },
  });

  const abmChannel = await prisma.marketingChannel.create({
    data: {
      name: "Account Based Marketing",
      slug: "abm",
      description: "Programmi ABM e campagne su account strategici.",
    },
  });

  // Create Campaigns with Allocations
  await prisma.campaign.create({
    data: {
      name: "Brand Refresh Q3",
      fiscalYearId: fiscalYear.id,
      channelId: digitalChannel.id,
      ownerId: elena.id,
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

  // Create Budget Requests (Pending Approvals)
  const now = new Date();
  await prisma.budgetRequest.create({
    data: {
      title: "Richiesta Budget Q4 - Content Marketing",
      fiscalYearId: fiscalYear.id,
      requesterId: elena.id,
      amount: 85_000,
      dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: BudgetRequestStatus.PENDING_APPROVAL,
      notes: "Budget per produzione contenuti video e infografiche per campagne social Q4.",
    },
  });

  await prisma.budgetRequest.create({
    data: {
      title: "Evento Fiera IT Expo",
      fiscalYearId: fiscalYear.id,
      requesterId: marco.id,
      amount: 120_000,
      dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      status: BudgetRequestStatus.PENDING_APPROVAL,
      notes: "Budget per partecipazione fiera IT Expo con stand e networking event.",
    },
  });

  // Create Operational Insights
  await prisma.operationalInsight.create({
    data: {
      fiscalYearId: fiscalYear.id,
      title: "Sottoutilizzo canale Digital",
      description: "Il 58% del budget allocato è già speso, ma il ROI delle campagne è sopra le aspettative. Considera di aumentare l'allocazione per Q4.",
      priority: 1,
    },
  });

  await prisma.operationalInsight.create({
    data: {
      fiscalYearId: fiscalYear.id,
      title: "Richieste approvazione in ritardo",
      description: "2 richieste di budget sono in attesa di approvazione da più di 5 giorni. Valuta se accelerare il processo per evitare ritardi operativi.",
      priority: 2,
    },
  });

  await prisma.operationalInsight.create({
    data: {
      fiscalYearId: fiscalYear.id,
      title: "Ottimizzazione spesa Eventi",
      description: "La campagna 'Evento Clienti Milano' ha una spesa molto vicina all'allocato. Monitora il delta nei prossimi giorni.",
      priority: 3,
    },
  });

  console.info("✅ Demo data seeded successfully!");
  console.info("📧 Login credentials:");
  console.info("   Admin: admin@example.com / admin123");
  console.info("   Demo users (all with password 'demo123'):");
  console.info("   - elena.ferri@digimax.mock");
  console.info("   - marco.neri@digimax.mock");
  console.info("   - chiara.bianchi@digimax.mock");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
