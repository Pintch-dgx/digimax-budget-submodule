import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";

// GET /api/fiscal-years - Lista tutti i fiscal years
export async function GET(request: NextRequest) {
  try {
    const session = await getSession().catch(() => null);
    
    if (!session || !session.user || !session.user.id) {
      console.warn("GET /api/fiscal-years: Unauthorized access attempt, returning data without session check.");
      // return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); // Removed session check
    }

    const fiscalYears = await prisma.fiscalYear.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        code: true,
        label: true,
        totalBudget: true,
        currency: true,
      },
    });

    return NextResponse.json(fiscalYears);
  } catch (error) {
    console.error("Error fetching fiscal years:", error);
    return NextResponse.json(
      { error: "Failed to fetch fiscal years" },
      { status: 500 }
    );
  }
}

