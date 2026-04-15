import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";

// GET /api/fiscal-years/[id]/budget-status
// Ritorna { totalBudget, allocated, remaining, percentage } per il fiscal year richiesto.
// Usa come fonte di verita' Campaign.allocatedBudget (aggregato sul fiscalYearId).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getSession().catch(() => null);

    const { id } = await params;
    const fiscalYearId = Number.parseInt(id, 10);

    if (Number.isNaN(fiscalYearId)) {
      return NextResponse.json({ error: "Invalid fiscal year id" }, { status: 400 });
    }

    const fiscalYear = await prisma.fiscalYear.findUnique({
      where: { id: fiscalYearId },
      select: { id: true, code: true, label: true, totalBudget: true, currency: true },
    });

    if (!fiscalYear) {
      return NextResponse.json({ error: "Fiscal year not found" }, { status: 404 });
    }

    const agg = await prisma.campaign.aggregate({
      where: { fiscalYearId },
      _sum: { allocatedBudget: true, spentBudget: true },
    });

    const allocated = agg._sum.allocatedBudget ?? 0;
    const spent = agg._sum.spentBudget ?? 0;
    const remaining = Math.max(0, fiscalYear.totalBudget - allocated);
    const percentage = fiscalYear.totalBudget > 0
      ? Math.min(100, (allocated / fiscalYear.totalBudget) * 100)
      : 0;

    return NextResponse.json({
      fiscalYear,
      totalBudget: fiscalYear.totalBudget,
      allocated,
      spent,
      remaining,
      percentage,
    });
  } catch (error) {
    console.error("Error computing fiscal year budget status:", error);
    return NextResponse.json(
      { error: "Failed to compute budget status" },
      { status: 500 }
    );
  }
}
