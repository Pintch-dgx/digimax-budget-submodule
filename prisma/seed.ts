import path from "node:path";
import {
  PrismaClient,
  BudgetRequestStatus,
  MetricTrend,
  VisibilityScope,
} from "../src/generated/prisma/client";

const projectRoot = path.resolve(__dirname, "..")
const absoluteDbPath = path.join(projectRoot, "prisma", "dev.db");
process.env.DATABASE_URL = `file:${absoluteDbPath}`;

const prisma = new PrismaClient();

async function main() {
  console.info("Seeding database from", process.cwd());
  await prisma.marketingUserVertical.deleteMany();
  await prisma.operationalInsight.deleteMany();
  await prisma.budgetRequest.deleteMany();
  await prisma.budgetAllocation.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.marketingChannel.deleteMany();
  await prisma.budgetSnapshot.deleteMany();
  await prisma.fiscalYear.deleteMany();
  await prisma.marketingUser.deleteMany();
  await prisma.verticalArea.deleteMany();
  await prisma.marketingRole.deleteMany();

  const fiscalYear = await prisma.fiscalYear.create({
    data: {
      code: "FY24",
      label: "Fiscal Year 2024",
      totalBudget: 2_500_000,
      currency: "EUR",
    },
  });

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

  const digitalSpecialistRole = await prisma.marketingRole.create({
    data: {
      key: "DIGITAL_SPECIALIST",
      name: "Digital Experience Specialist",
      description: "Gestisce web design, social media, media creation e SEO operativo.",
      visibility: VisibilityScope.VERTICAL,
    },
  });

  const engagementSpecialistRole = await prisma.marketingRole.create({
    data: {
      key: "ENGAGEMENT_SPECIALIST",
      name: "Engagement & Events Specialist",
      description: "Responsabile email marketing, fiere, eventi, iniziative di team building.",
      visibility: VisibilityScope.VERTICAL,
    },
  });

  const marketingManagerRole = await prisma.marketingRole.create({
    data: {
      key: "MARKETING_MANAGER",
      name: "Marketing Manager Performance",
      description: "Focalizzazione SEO + Paid Ads con visibilità trasversale.",
      visibility: VisibilityScope.FULL,
    },
  });

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

  const elena = await prisma.marketingUser.create({
    data: {
      fullName: "Elena Ferri",
      email: "elena.ferri@digimax.mock",
      roleId: digitalSpecialistRole.id,
      verticals: {
        create: {
          verticalId: digitalVertical.id,
          visibility: VisibilityScope.VERTICAL,
        },
      },
    },
  });

  const marco = await prisma.marketingUser.create({
    data: {
      fullName: "Marco Neri",
      email: "marco.neri@digimax.mock",
      roleId: engagementSpecialistRole.id,
      verticals: {
        create: {
          verticalId: engagementVertical.id,
          visibility: VisibilityScope.VERTICAL,
        },
      },
    },
  });

  const chiara = await prisma.marketingUser.create({
    data: {
      fullName: "Chiara Bianchi",
      email: "chiara.bianchi@digimax.mock",
      roleId: marketingManagerRole.id,
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
      goal: "Coinvolgere i top clienti e presentare roadmap prodotti Q4.",
      allocations: {
        create: {
          fiscalYearId: fiscalYear.id,
          allocated: 210_000,
          spent: 162_000,
        },
      },
    },
  });

  await prisma.campaign.create({
    data: {
      name: "ABM Program Strategic Accounts",
      fiscalYearId: fiscalYear.id,
      channelId: abmChannel.id,
      ownerId: chiara.id,
      goal: "Espandere le opportunità sui 10 account chiave del settore industriale.",
      allocations: {
        create: {
          fiscalYearId: fiscalYear.id,
          allocated: 410_000,
          spent: 352_000,
        },
      },
    },
  });

  const totalAllocated = 320_000 + 210_000 + 410_000;

  await prisma.budgetRequest.createMany({
    data: [
      {
        title: "Media plan LinkedIn Q4",
        fiscalYearId: fiscalYear.id,
        requesterId: elena.id,
        amount: 78_000,
        dueDate: new Date("2024-09-18"),
        status: BudgetRequestStatus.PENDING_APPROVAL,
        notes: "Copertura awareness in vista del lancio prodotto verticale Energy.",
      },
      {
        title: "Partnership evento SaaS Summit",
        fiscalYearId: fiscalYear.id,
        requesterId: marco.id,
        amount: 54_000,
        dueDate: new Date("2024-09-22"),
        status: BudgetRequestStatus.PENDING_APPROVAL,
        notes: "Richiesta co-marketing con partner Platinum.",
      },
    ],
  });

  await prisma.operationalInsight.createMany({
    data: [
      {
        fiscalYearId: fiscalYear.id,
        title: "Campagne digital con ROI più alto",
        description:
          "Le iniziative SEM + PPC stanno generando un ROI del 165%. Valutare la riallocazione del 5% del budget social verso search.",
        priority: 1,
      },
      {
        fiscalYearId: fiscalYear.id,
        title: "Sottoutilizzo eventi corporate",
        description:
          "Gli eventi hanno ancora il 24% del budget annuale disponibile. Considerare attività con partner strategici in Q4.",
        priority: 2,
      },
    ],
  });

  await prisma.budgetSnapshot.update({
    where: {
      fiscalYearId_label: {
        fiscalYearId: fiscalYear.id,
        label: "Disponibile",
      },
    },
    data: {
      amount: fiscalYear.totalBudget - totalAllocated,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
