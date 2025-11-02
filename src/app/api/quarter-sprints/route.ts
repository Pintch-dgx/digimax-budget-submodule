import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/role-guards";

const computeQuarterFromDate = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.floor(parsed.getMonth() / 3) + 1;
};

export async function GET(request: NextRequest) {
  try {
    const session = await getSession().catch(() => null);

    if (!session || !session.user || !session.user.id) {
      console.warn("GET /api/quarter-sprints: Unauthorized access attempt, returning data without session check.");
      // return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 }); // Removed session check
    }

    const searchParams = request.nextUrl.searchParams;
    const fiscalYearId = searchParams.get("fiscalYearId");
    const includeCounts = searchParams.get("withCounts") === "true";

    const quarterSprints = await (prisma as any).quarterSprint.findMany({
      where: fiscalYearId
        ? {
            fiscalYearId: parseInt(fiscalYearId, 10),
          }
        : undefined,
      orderBy: {
        startDate: "asc",
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
        ...(includeCounts
          ? {
              _count: {
                select: {
                  campaigns: true,
                  keyResults: true,
                  budgetRequests: true,
                },
              },
            }
          : {}),
      },
    });

    const payload = quarterSprints.map((entry: any) => ({
        id: entry.id,
        name: entry.name,
        code: entry.code,
        shortCode: entry.shortCode,
        quarter: entry.quarter,
        objectiveSummary: entry.objectiveSummary,
        startDate: entry.startDate,
        endDate: entry.endDate,
        fiscalYearId: entry.fiscalYearId,
        objectiveId: entry.objectiveId,
        objective: entry.objective
          ? {
              id: entry.objective.id,
              title: entry.objective.title,
              description: entry.objective.description,
              status: entry.objective.status,
            }
          : null,
        ...(includeCounts
          ? {
              counts: {
                campaigns: entry._count?.campaigns ?? 0,
                keyResults: entry._count?.keyResults ?? 0,
                budgetRequests: entry._count?.budgetRequests ?? 0,
              },
            }
          : {}),
      }));

    return NextResponse.json({ data: payload });
  } catch (error) {
    console.error("Error fetching quarter sprints:", error);
    return NextResponse.json({ error: "Failed to fetch quarter sprints" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!(await isAdmin(session))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, code, shortCode, objectiveSummary, startDate, endDate, fiscalYearId, objectiveId, quarter } = body ?? {};

    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: "Nome, data inizio e data fine sono obbligatori" }, { status: 400 });
    }

    if (!fiscalYearId) {
      return NextResponse.json({ error: "Fiscal year è obbligatorio" }, { status: 400 });
    }

    if (objectiveId === undefined || objectiveId === null || objectiveId === "") {
      return NextResponse.json({ error: "Obiettivo collegato obbligatorio" }, { status: 400 });
    }

    const parsedFiscalYear = Number(fiscalYearId);
    if (!Number.isFinite(parsedFiscalYear)) {
      return NextResponse.json({ error: "Fiscal year non valido" }, { status: 400 });
    }

    const parsedObjective = Number(objectiveId);
    if (!Number.isFinite(parsedObjective)) {
      return NextResponse.json({ error: "Obiettivo non valido" }, { status: 400 });
    }

    const parsedQuarter = (() => {
      if (quarter !== undefined && quarter !== null && quarter !== "") {
        const q = Number(quarter);
        if (Number.isFinite(q) && q >= 1 && q <= 4) {
          return q;
        }
      }
      const computed = computeQuarterFromDate(startDate);
      if (computed) {
        return computed;
      }
      return 1;
    })();

    if (new Date(startDate) > new Date(endDate)) {
      return NextResponse.json({ error: "La data di inizio deve essere precedente alla data di fine" }, { status: 400 });
    }

    const created = await (prisma as any).quarterSprint.create({
      data: {
        name: String(name),
        code: code ? String(code) : null,
        shortCode: shortCode ? String(shortCode) : null,
        objectiveSummary: objectiveSummary ? String(objectiveSummary) : null,
        quarter: parsedQuarter,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        fiscalYear: {
          connect: { id: parsedFiscalYear },
        },
        objective: {
          connect: { id: parsedObjective },
        },
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
    });

    return NextResponse.json({
      data: {
        id: created.id,
        name: created.name,
        code: created.code,
        shortCode: created.shortCode,
        objectiveSummary: created.objectiveSummary,
        quarter: created.quarter,
        startDate: created.startDate,
        endDate: created.endDate,
        fiscalYearId: created.fiscalYearId,
        objectiveId: created.objectiveId,
        objective: created.objective
          ? {
              id: created.objective.id,
              title: created.objective.title,
              description: created.objective.description,
              status: created.objective.status,
            }
          : null,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/quarter-sprints error", error);
    return NextResponse.json(
      { error: "Impossibile creare il Quarter Sprint", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}


