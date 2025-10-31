import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";

// GET /api/campaigns - Lista tutte le campagne
export async function GET(request: NextRequest) {
  try {
      const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 });
    }
    
    if (!session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized - No user ID" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const fiscalYearId = searchParams.get("fiscalYearId");

    const where: any = {};
    if (fiscalYearId) {
      where.fiscalYearId = parseInt(fiscalYearId);
    }

    const campaigns = await prisma.campaign.findMany({
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
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

