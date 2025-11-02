import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";

// GET /api/campaigns - Lista tutte le campagne
export async function GET(request: NextRequest) {
  try {
    const session = await getSession().catch(() => null);

    const searchParams = request.nextUrl.searchParams;
    const fiscalYearId = searchParams.get("fiscalYearId");
    const quarterSprintId = searchParams.get("quarterSprintId");

    console.log("GET /api/campaigns", { fiscalYearId, quarterSprintId });

    const where: any = {};
    if (fiscalYearId) {
      where.fiscalYearId = parseInt(fiscalYearId, 10);
    }
    if (quarterSprintId) {
      const parsedQuarterSprintId = parseInt(quarterSprintId, 10);
      if (!Number.isNaN(parsedQuarterSprintId)) {
        where.quarterSprintId = parsedQuarterSprintId;
      }
    }

    const campaigns = await (prisma as any).campaign.findMany({
      where,
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        allocations: {
          include: {
            fiscalYear: {
              select: {
                id: true,
                code: true,
              },
            },
          },
        },
        fiscalYear: {
          select: {
            id: true,
            code: true,
            label: true,
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
        keyResult: {
          select: {
            id: true,
            title: true,
            metric: true,
            targetValue: true,
            progressValue: true,
            status: true,
            weight: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Always return campaigns as array, session check is handled elsewhere
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:");
    console.error("Error name:", error instanceof Error ? error.name : typeof error);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "N/A");
    return NextResponse.json(
      { 
        error: "Failed to fetch campaigns",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

