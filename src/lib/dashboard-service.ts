import { prisma } from "@/lib/db";
import { BudgetRequestStatus, MetricTrend } from "@prisma/client";

export type SummaryMetric = {
  label: string;
  amount: number;
  trend: "up" | "down" | "flat";
  changePercentage: number;
};

export type CampaignAllocation = {
  name: string;
  channel: string;
  owner: string;
  goal: string | null;
  allocated: number;
  spent: number;
  quarterSprint: {
    name: string;
    code: string | null;
    shortCode: string | null;
    quarter: number;
    objective: {
      title: string;
      description: string | null;
      status: string;
    } | null;
    startDate: string | null;
    endDate: string | null;
  } | null;
};

export type UpcomingApproval = {
  id: number;
  title: string;
  requester: string;
  requesterEmail: string;
  amount: number;
  dueDate: string;
};

export type QuarterSprintSummary = {
  id: number;
  name: string;
  code: string | null;
  shortCode: string | null;
  quarter: number;
  objective: {
    id: number;
    title: string;
    description: string | null;
    status: string;
  } | null;
  startDate: string | null;
  endDate: string | null;
};

type CampaignWithRelations = {
  name: string;
  goal: string | null;
  allocations: Array<{ allocated: number; spent: number }>;
  channel: { name: string };
  owner: { fullName: string; email: string };
  quarterSprint: {
    id: number;
    name: string;
    code: string | null;
    shortCode: string | null;
    quarter: number;
    objective: {
      id: number;
      title: string;
      description: string | null;
      status: string;
      progress: number | null;
    } | null;
    startDate: Date | null;
    endDate: Date | null;
  } | null;
};

export type Insight = {
  title: string;
  description: string;
  priority: number;
};

export type DashboardData = {
  summaryMetrics: SummaryMetric[];
  campaignAllocations: CampaignAllocation[];
  upcomingApprovals: UpcomingApproval[];
  insights: Insight[];
  quarterTimeline: QuarterSprintSummary[];
};

function mapTrend(trend: MetricTrend): SummaryMetric["trend"] {
  if (trend === "UP") return "up";
  if (trend === "DOWN") return "down";
  return "flat";
}

export async function getDashboardData(): Promise<DashboardData> {
  const fiscalYear = await prisma.fiscalYear.findFirst({
    orderBy: { createdAt: "desc" },
  });

  // Recupera quarter sprint da novembre 2024 in poi, indipendentemente dal fiscal year
  const quarterSprintsPromise = (prisma as any).quarterSprint.findMany({
    where: {
      OR: fiscalYear
        ? [
            { fiscalYearId: fiscalYear.id },
            { startDate: { gte: new Date("2024-11-01") } },
          ]
        : [{ startDate: { gte: new Date("2024-11-01") } }],
    },
    include: {
      objective: {
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
        },
      },
    },
    orderBy: [{ startDate: "asc" }, { name: "asc" }],
  });

  if (!fiscalYear) {
    const quarterSprints = await quarterSprintsPromise;
    const quarterTimeline: QuarterSprintSummary[] = quarterSprints.map((quarter: any) => {
      return {
        id: quarter.id,
        name: quarter.name,
        code: quarter.code,
        shortCode: quarter.shortCode ?? null,
        quarter: quarter.quarter,
        objective: quarter.objective
          ? {
              id: quarter.objective.id,
              title: quarter.objective.title,
              description: quarter.objective.description,
              status: quarter.objective.status,
            }
          : null,
        startDate: quarter.startDate ? quarter.startDate.toISOString() : null,
        endDate: quarter.endDate ? quarter.endDate.toISOString() : null,
      };
    });
    return { summaryMetrics: [], campaignAllocations: [], upcomingApprovals: [], insights: [], quarterTimeline };
  }

  // Trova il fiscal year più recente che ha BudgetSnapshot
  const fiscalYearWithSnapshots = await prisma.fiscalYear.findFirst({
    where: {
      budgetSnapshots: {
        some: {},
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      budgetSnapshots: {
        orderBy: { label: "asc" },
      },
    },
  });

  // Usa il fiscal year con snapshot se disponibile, altrimenti usa quello più recente
  const targetFiscalYear = fiscalYearWithSnapshots || fiscalYear;
  
  // Estrai l'anno dal fiscal year (es. "FY24" -> 2024, "FY25" -> 2025)
  const fiscalYearNumber = targetFiscalYear ? parseInt(targetFiscalYear.code.replace('FY', '')) + 2000 : new Date().getFullYear();
  
  // Definisci i 4 quarter dell'anno fiscale corrente
  const expectedQuarters = [
    { label: `Q1 ${fiscalYearNumber}`, quarter: 1 },
    { label: `Q2 ${fiscalYearNumber}`, quarter: 2 },
    { label: `Q3 ${fiscalYearNumber}`, quarter: 3 },
    { label: `Q4 ${fiscalYearNumber}`, quarter: 4 },
  ];

  // Recupera gli snapshot esistenti e crea un map per lookup veloce
  const existingSnapshots = fiscalYearWithSnapshots
    ? fiscalYearWithSnapshots.budgetSnapshots
    : await prisma.budgetSnapshot.findMany({
        where: { fiscalYearId: targetFiscalYear.id },
        orderBy: { label: "asc" },
      });

  const snapshotMap = new Map(
    existingSnapshots.map((snapshot) => [snapshot.label, snapshot])
  );
  
  // Crea anche un map per il formato vecchio (Q1, Q2, Q3, Q4 senza anno) per retrocompatibilità
  const oldFormatMap = new Map(
    existingSnapshots.map((snapshot) => {
      const quarterMatch = snapshot.label.match(/^Q([1-4])(?:\s+\d{4})?$/);
      if (quarterMatch) {
        return [quarterMatch[1], snapshot];
      }
      return null;
    }).filter((item): item is [string, typeof existingSnapshots[number]] => item !== null)
  );

  // Crea i summaryMetrics sempre con i 4 quarter, usando i dati esistenti o valori di default
  const snapshots = expectedQuarters.map((expected) => {
    // Cerca prima nel formato nuovo (Q1 2024), poi nel formato vecchio (Q1)
    const existing = snapshotMap.get(expected.label) || oldFormatMap.get(expected.quarter.toString());
    if (existing) {
      // Se esiste con formato vecchio, aggiorna la label per includere l'anno
      return {
        ...existing,
        label: expected.label,
      };
    }
    // Se non esiste, crea un valore di default
    return {
      id: 0,
      fiscalYearId: targetFiscalYear.id,
      label: expected.label,
      amount: 0,
      trend: "FLAT" as MetricTrend,
      changePercentage: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  const [campaigns, requests, insights, quarterSprints] = await Promise.all([
    prisma.campaign.findMany({
      where: { fiscalYearId: fiscalYear.id },
      include: {
        allocations: {
          where: { fiscalYearId: fiscalYear.id },
          select: {
            allocated: true,
            spent: true,
          },
        },
        channel: {
          select: {
            name: true,
          },
        },
        owner: {
          select: {
            fullName: true,
            email: true,
          },
        },
        quarterSprint: {
          include: {
            objective: {
              select: {
                id: true,
                title: true,
                description: true,
                status: true,
                progress: true,
              },
            },
          },
        },
      } as any,
      orderBy: { createdAt: "asc" },
    }) as unknown as Promise<CampaignWithRelations[]>,
    prisma.budgetRequest.findMany({
      where: {
        fiscalYearId: fiscalYear.id,
        status: BudgetRequestStatus.PENDING_APPROVAL,
      },
      include: {
        requester: true,
      },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.operationalInsight.findMany({
      where: { fiscalYearId: fiscalYear.id },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    }),
    quarterSprintsPromise,
  ]);

  const summaryMetrics: SummaryMetric[] = snapshots.map((snapshot: typeof snapshots[number]) => ({
    label: snapshot.label,
    amount: snapshot.amount,
    trend: mapTrend(snapshot.trend),
    changePercentage: snapshot.changePercentage,
  }));

  const campaignAllocations: CampaignAllocation[] = campaigns.map((campaign: CampaignWithRelations) => {
    const allocation = campaign.allocations[0];
    const quarterRecord = campaign.quarterSprint;
    const quarterSprint = quarterRecord
      ? {
          name: quarterRecord.name,
          code: quarterRecord.code,
          shortCode: quarterRecord.shortCode ?? null,
          quarter: quarterRecord.quarter,
          objective: quarterRecord.objective
            ? {
                title: quarterRecord.objective.title,
                description: quarterRecord.objective.description,
                status: quarterRecord.objective.status,
              }
            : null,
          startDate: quarterRecord.startDate ? quarterRecord.startDate.toISOString() : null,
          endDate: quarterRecord.endDate ? quarterRecord.endDate.toISOString() : null,
        }
      : null;

    return {
      name: campaign.name,
      channel: campaign.channel.name,
      owner: campaign.owner.fullName,
      goal: campaign.goal ?? null,
      allocated: allocation?.allocated ?? 0,
      spent: allocation?.spent ?? 0,
      quarterSprint,
    };
  });

  const upcomingApprovals: UpcomingApproval[] = requests.map((request: typeof requests[number]) => ({
    id: request.id,
    title: request.title,
    requester: request.requester.fullName,
    requesterEmail: request.requester.email,
    amount: request.amount,
    dueDate: request.dueDate.toISOString(),
  }));

  const mappedInsights: Insight[] = insights.map((insight: typeof insights[number]) => ({
    title: insight.title,
    description: insight.description,
    priority: insight.priority,
  }));

  const quarterTimeline: QuarterSprintSummary[] = quarterSprints.map((quarter: any) => {
    return {
      id: quarter.id,
      name: quarter.name,
      code: quarter.code,
      shortCode: quarter.shortCode ?? null,
      quarter: quarter.quarter,
      objective: quarter.objective
        ? {
            id: quarter.objective.id,
            title: quarter.objective.title,
            description: quarter.objective.description,
            status: quarter.objective.status,
          }
        : null,
      startDate: quarter.startDate ? quarter.startDate.toISOString() : null,
      endDate: quarter.endDate ? quarter.endDate.toISOString() : null,
    };
  });

  return {
    summaryMetrics,
    campaignAllocations,
    upcomingApprovals,
    insights: mappedInsights,
    quarterTimeline,
  };
}
