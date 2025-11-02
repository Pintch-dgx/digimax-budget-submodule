import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { BudgetRequestStatus, Prisma } from "@prisma/client";

type ParsedFilters = {
  fiscalYearId?: number;
  startDate?: Date;
  endDate?: Date;
};

type AllocationWithCampaign = {
  campaignId: number;
  allocated: number;
  spent: number;
  campaign: {
    name: string;
    status: string;
    goal: string | null;
    channel: { name: string };
    owner: { fullName: string };
    quarterSprint: {
      name: string;
      code: string | null;
      shortCode: string | null;
      objective: {
        id: number;
        title: string;
        description: string | null;
        status: string;
      } | null;
      startDate: Date | null;
      endDate: Date | null;
    } | null;
  };
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

function buildAllocationWhere(filters: ParsedFilters): Prisma.BudgetAllocationWhereInput {
  const where: Prisma.BudgetAllocationWhereInput = {};

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
  const allocationWhere = buildAllocationWhere(filters);

  const [requestSummary, requestsByStatus, topRequesterGroups, allocationSummary, topAllocations] = await Promise.all([
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
    prisma.budgetAllocation.aggregate({
      where: allocationWhere,
      _sum: { allocated: true, spent: true },
      _count: { _all: true },
    }),
    prisma.budgetAllocation.findMany({
      where: allocationWhere,
      include: {
        campaign: {
          include: {
            channel: { select: { name: true } },
            owner: { select: { fullName: true } },
            quarterSprint: {
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
            },
          },
        },
      } as any,
      orderBy: [{ spent: "desc" }],
      take: 5,
    }) as unknown as Promise<AllocationWithCampaign[]>,
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
  const rejectedStatus = requestsByStatus.find((entry) => entry.status === BudgetRequestStatus.REJECTED);
  const pendingStatus = requestsByStatus.find((entry) => entry.status === BudgetRequestStatus.PENDING_APPROVAL);

  const approvedCount = approvedStatus?._count._all ?? 0;
  const approvedAmount = approvedStatus?._sum.amount ?? 0;
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

  const allocationData = allocationSummary._sum;
  const totalAllocated = allocationData?.allocated ?? 0;
  const totalSpent = allocationData?.spent ?? 0;
  const totalRemaining = totalAllocated - totalSpent;

  const campaignPerformance = topAllocations.map((allocation) => {
    const quarter = allocation.campaign.quarterSprint as (typeof allocation.campaign.quarterSprint & { shortCode?: string | null }) | null;
    return {
      campaignId: allocation.campaignId,
      campaignName: allocation.campaign.name,
      channel: allocation.campaign.channel.name,
      owner: allocation.campaign.owner.fullName,
      allocated: allocation.allocated,
      spent: allocation.spent,
      remaining: allocation.allocated - allocation.spent,
      status: allocation.campaign.status,
      goal: allocation.campaign.goal ?? null,
      quarterSprint: quarter
        ? {
            name: quarter.name,
            code: quarter.code,
            shortCode: quarter.shortCode ?? null,
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
          }
        : null,
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


