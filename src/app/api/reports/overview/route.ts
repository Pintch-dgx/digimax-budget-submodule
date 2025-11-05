import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { BudgetRequestStatus, Prisma } from "@prisma/client";

type ParsedFilters = {
  fiscalYearId?: number;
  startDate?: Date;
  endDate?: Date;
};

type CampaignWithBudget = {
  id: number;
  name: string;
  status: string;
  goal: string | null;
  allocatedBudget: number;
  spentBudget: number;
  channel: { name: string };
  owner: { fullName: string };
  objective: {
    id: number;
    title: string;
    description: string | null;
    status: string;
  } | null;
  startDate: Date | null;
  endDate: Date | null;
};

function parseFilters(searchParams: URLSearchParams): ParsedFilters {
  const filters: ParsedFilters = {};

  const fiscalYearParam = searchParams.get("fiscalYearId");
  if (fiscalYearParam) {
    const fiscalYearId = parseInt(fiscalYearParam, 10);
    if (!Number.isNaN(fiscalYearId)) {
      filters.fiscalYearId = fiscalYearId;
    }
  }

  const startParam = searchParams.get("startDate");
  if (startParam) {
    const startDate = new Date(startParam);
    if (!Number.isNaN(startDate.getTime())) {
      filters.startDate = startDate;
    }
  }

  const endParam = searchParams.get("endDate");
  if (endParam) {
    const endDate = new Date(endParam);
    if (!Number.isNaN(endDate.getTime())) {
      endDate.setHours(23, 59, 59, 999);
      filters.endDate = endDate;
    }
  }

  return filters;
}

function buildRequestWhere(filters: ParsedFilters): Prisma.BudgetRequestWhereInput {
  const where: Prisma.BudgetRequestWhereInput = {};

  if (filters.fiscalYearId) {
    where.fiscalYearId = filters.fiscalYearId;
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  return where;
}

function buildCampaignWhere(filters: ParsedFilters): Prisma.CampaignWhereInput {
  const where: Prisma.CampaignWhereInput = {};

  if (filters.fiscalYearId) {
    where.fiscalYearId = filters.fiscalYearId;
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  return where;
}

async function buildOverviewData(filters: ParsedFilters) {
  const requestWhere = buildRequestWhere(filters);
  const campaignWhere = buildCampaignWhere(filters);

  const [requestSummary, requestsByStatus, topRequesterGroups, campaignSummary, topCampaigns] = await Promise.all([
    prisma.budgetRequest.aggregate({
      where: requestWhere,
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.budgetRequest.groupBy({
      by: ["status"],
      where: requestWhere,
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.budgetRequest.groupBy({
      by: ["requesterId"],
      where: requestWhere,
      _sum: { amount: true },
      _count: { _all: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 5,
    }),
    prisma.campaign.aggregate({
      where: campaignWhere,
      _sum: { allocatedBudget: true, spentBudget: true },
      _count: { _all: true },
    }),
    prisma.campaign.findMany({
      where: campaignWhere,
      include: {
        channel: { select: { name: true } },
        owner: { select: { fullName: true } },
        objective: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
          },
        },
      },
      orderBy: [{ spentBudget: "desc" }],
      take: 5,
    }) as unknown as Promise<CampaignWithBudget[]>,
  ]);

  const topRequesterIds = topRequesterGroups.map((group) => group.requesterId);

  const requesters = topRequesterIds.length
    ? await prisma.marketingUser.findMany({
        where: { id: { in: topRequesterIds } },
        select: { id: true, fullName: true, email: true },
      })
    : [];

  const totalRequests = requestSummary._count._all ?? 0;
  const totalAmountRequested = requestSummary._sum.amount ?? 0;

  const approvedStatus = requestsByStatus.find((entry) => entry.status === BudgetRequestStatus.APPROVED);
  const approvedWithChangesStatus = requestsByStatus.find((entry) => entry.status === BudgetRequestStatus.APPROVED_WITH_CHANGES);
  const rejectedStatus = requestsByStatus.find((entry) => entry.status === BudgetRequestStatus.REJECTED);
  const pendingStatus = requestsByStatus.find((entry) => entry.status === BudgetRequestStatus.PENDING_APPROVAL);

  const approvedCount = (approvedStatus?._count._all ?? 0) + (approvedWithChangesStatus?._count._all ?? 0);
  const approvedAmount = (approvedStatus?._sum.amount ?? 0) + (approvedWithChangesStatus?._sum.amount ?? 0);
  const rejectedCount = rejectedStatus?._count._all ?? 0;
  const pendingCount = pendingStatus?._count._all ?? 0;

  const approvalRate = totalRequests > 0 ? (approvedCount / totalRequests) * 100 : 0;

  const requesterTotalsMap = new Map<number, { count: number; amount: number }>();
  topRequesterGroups.forEach((group) => {
    requesterTotalsMap.set(group.requesterId, {
      count: group._count._all,
      amount: group._sum.amount ?? 0,
    });
  });

  const requesterDetails = requesters
    .map((user) => {
      const totals = requesterTotalsMap.get(user.id);
      return {
        requesterId: user.id,
        fullName: user.fullName,
        email: user.email,
        requestCount: totals?.count ?? 0,
        totalAmount: totals?.amount ?? 0,
      };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount);

  const campaignData = campaignSummary._sum;
  const totalAllocated = campaignData?.allocatedBudget ?? 0;
  const totalSpent = campaignData?.spentBudget ?? 0;
  const totalRemaining = totalAllocated - totalSpent;

  const campaignPerformance = topCampaigns.map((campaign) => {
    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      channel: campaign.channel.name,
      owner: campaign.owner.fullName,
      allocated: campaign.allocatedBudget,
      spent: campaign.spentBudget,
      remaining: campaign.allocatedBudget - campaign.spentBudget,
      status: campaign.status,
      goal: campaign.goal ?? null,
      objective: campaign.objective
        ? {
            id: campaign.objective.id,
            title: campaign.objective.title,
            description: campaign.objective.description,
            status: campaign.objective.status,
          }
        : null,
      startDate: campaign.startDate ? campaign.startDate.toISOString() : null,
      endDate: campaign.endDate ? campaign.endDate.toISOString() : null,
    };
  });

  return {
    summary: {
      totalRequests,
      totalAmountRequested,
      approvedCount,
      approvedAmount,
      pendingCount,
      rejectedCount,
      approvalRate,
    },
    requestsByStatus: requestsByStatus.map((entry) => ({
      status: entry.status,
      requestCount: entry._count._all,
      totalAmount: entry._sum.amount ?? 0,
    })),
    topRequesters: requesterDetails,
    campaignPerformance: {
      totals: {
        totalAllocated,
        totalSpent,
        totalRemaining,
      },
      topCampaigns: campaignPerformance,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const filters = parseFilters(searchParams);
    const format = searchParams.get("format");
    const dataset = searchParams.get("dataset");

    const overviewData = await buildOverviewData(filters);

    if (format === "csv" && dataset) {
      const csv = buildCsvExport(overviewData, dataset);
      if (!csv) {
        return NextResponse.json({ error: "Dataset non valido" }, { status: 400 });
      }

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="report-${dataset}.csv"`,
        },
      });
    }

    return NextResponse.json({ data: overviewData });
  } catch (error) {
    console.error("GET /api/reports/overview - Error", error);
    return NextResponse.json(
      { error: "Failed to load reports", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

function buildCsvExport(
  data: Awaited<ReturnType<typeof buildOverviewData>>,
  dataset: string
): string | null {
  if (dataset === "status") {
    const headers = "Stato,Numero richieste,Importo totale";
    const rows = data.requestsByStatus.map(
      (entry) => `${entry.status},${entry.requestCount},${entry.totalAmount}`
    );
    return [headers, ...rows].join("\n");
  }

  if (dataset === "requesters") {
    const headers = "Richiedente,Email,Ric. inviate,Importo totale";
    const rows = data.topRequesters.map(
      (entry) => `${escapeCsv(entry.fullName)},${escapeCsv(entry.email)},${entry.requestCount},${entry.totalAmount}`
    );
    return [headers, ...rows].join("\n");
  }

  if (dataset === "campaigns") {
    const headers = "Campagna,Canale,Owner,Allocato,Speso,Residuo,Stato";
    const rows = data.campaignPerformance.topCampaigns.map(
      (entry) =>
        `${escapeCsv(entry.campaignName)},${escapeCsv(entry.channel)},${escapeCsv(entry.owner)},${entry.allocated},${entry.spent},${entry.remaining},${escapeCsv(entry.status)}`
    );
    return [headers, ...rows].join("\n");
  }

  return null;
}

function escapeCsv(value: string) {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}


