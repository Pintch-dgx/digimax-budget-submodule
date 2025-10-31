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
  allocated: number;
  spent: number;
};

export type UpcomingApproval = {
  title: string;
  requester: string;
  amount: number;
  dueDate: Date;
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

  if (!fiscalYear) {
    return { summaryMetrics: [], campaignAllocations: [], upcomingApprovals: [], insights: [] };
  }

  const [snapshots, campaigns, requests, insights] = await Promise.all([
    prisma.budgetSnapshot.findMany({
      where: { fiscalYearId: fiscalYear.id },
      orderBy: { label: "asc" },
    }),
    prisma.campaign.findMany({
      where: { fiscalYearId: fiscalYear.id },
      include: {
        allocations: {
          where: { fiscalYearId: fiscalYear.id },
        },
        channel: true,
        owner: true,
      },
      orderBy: { createdAt: "asc" },
    }),
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
  ]);

  const summaryMetrics: SummaryMetric[] = snapshots.map((snapshot) => ({
    label: snapshot.label,
    amount: snapshot.amount,
    trend: mapTrend(snapshot.trend),
    changePercentage: snapshot.changePercentage,
  }));

  const campaignAllocations: CampaignAllocation[] = campaigns.map((campaign) => {
    const allocation = campaign.allocations[0];
    return {
      name: campaign.name,
      channel: campaign.channel.name,
      owner: campaign.owner.fullName,
      allocated: allocation?.allocated ?? 0,
      spent: allocation?.spent ?? 0,
    };
  });

  const upcomingApprovals: UpcomingApproval[] = requests.map((request) => ({
    title: request.title,
    requester: request.requester.fullName,
    amount: request.amount,
    dueDate: request.dueDate,
  }));

  const mappedInsights: Insight[] = insights.map((insight) => ({
    title: insight.title,
    description: insight.description,
    priority: insight.priority,
  }));

  return {
    summaryMetrics,
    campaignAllocations,
    upcomingApprovals,
    insights: mappedInsights,
  };
}
