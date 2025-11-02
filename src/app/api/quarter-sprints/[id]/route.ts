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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await getSession();

    if (!(await isAdmin(session))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Handle params as Promise (Next.js 15+) or direct object
    const resolvedParams = params instanceof Promise ? await params : params;
    const quarterSprintId = Number(resolvedParams.id);
    if (!Number.isFinite(quarterSprintId)) {
      return NextResponse.json({ error: "ID Quarter Sprint non valido" }, { status: 400 });
    }

    const existing = await (prisma as any).quarterSprint.findUnique({
      where: { id: quarterSprintId },
      select: { id: true, fiscalYearId: true, objectiveId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Quarter Sprint non trovato" }, { status: 404 });
    }

    const body = await request.json();
    const { name, code, shortCode, objectiveSummary, startDate, endDate, fiscalYearId, objectiveId, quarter } = body ?? {};

    const data: Record<string, unknown> = {};

    if (name !== undefined) data.name = String(name);
    if (code !== undefined) data.code = code ? String(code) : null;
    if (shortCode !== undefined) {
      if (shortCode && String(shortCode).length > 5) {
        return NextResponse.json({ error: "Short code troppo lungo (max 5 caratteri)" }, { status: 400 });
      }
      data.shortCode = shortCode ? String(shortCode) : null;
    }
    if (objectiveSummary !== undefined) data.objectiveSummary = objectiveSummary ? String(objectiveSummary) : null;

    if (startDate !== undefined) {
      if (!startDate) {
        return NextResponse.json({ error: "La data di inizio non può essere vuota" }, { status: 400 });
      }
      data.startDate = new Date(startDate);
    }

    if (endDate !== undefined) {
      if (!endDate) {
        return NextResponse.json({ error: "La data di fine non può essere vuota" }, { status: 400 });
      }
      data.endDate = new Date(endDate);
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return NextResponse.json({ error: "La data di inizio deve essere precedente alla data di fine" }, { status: 400 });
    }

    if (quarter !== undefined) {
      if (quarter === null || quarter === "") {
        const derived = computeQuarterFromDate(startDate ?? endDate ?? null);
        if (derived) {
          data.quarter = derived;
        }
      } else {
        const parsedQuarter = Number(quarter);
        if (!Number.isFinite(parsedQuarter) || parsedQuarter < 1 || parsedQuarter > 4) {
          return NextResponse.json({ error: "Quarter non valido" }, { status: 400 });
        }
        data.quarter = parsedQuarter;
      }
    } else if (startDate) {
      const derived = computeQuarterFromDate(startDate);
      if (derived) {
        data.quarter = derived;
      }
    }

    if (fiscalYearId !== undefined) {
      if (!fiscalYearId) {
        return NextResponse.json({ error: "Fiscal year è obbligatorio" }, { status: 400 });
      }
      const parsedFiscalYear = Number(fiscalYearId);
      if (!Number.isFinite(parsedFiscalYear)) {
        return NextResponse.json({ error: "Fiscal year non valido" }, { status: 400 });
      }
      data.fiscalYear = { connect: { id: parsedFiscalYear } };
    }

    if (objectiveId !== undefined) {
      if (!objectiveId) {
        return NextResponse.json({ error: "Obiettivo collegato obbligatorio" }, { status: 400 });
      }
      const parsedObjective = Number(objectiveId);
      if (!Number.isFinite(parsedObjective)) {
        return NextResponse.json({ error: "Obiettivo non valido" }, { status: 400 });
      }
      data.objective = { connect: { id: parsedObjective } };
    }

    const updated = await (prisma as any).quarterSprint.update({
      where: { id: quarterSprintId },
      data: data as any,
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
        id: updated.id,
        name: updated.name,
        code: updated.code,
        shortCode: updated.shortCode,
        objectiveSummary: updated.objectiveSummary,
        quarter: updated.quarter,
        startDate: updated.startDate,
        endDate: updated.endDate,
        fiscalYearId: updated.fiscalYearId,
        objectiveId: updated.objectiveId,
        objective: updated.objective
          ? {
              id: updated.objective.id,
              title: updated.objective.title,
              description: updated.objective.description,
              status: updated.objective.status,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("PATCH /api/quarter-sprints/[id] error", error);
    return NextResponse.json(
      { error: "Impossibile aggiornare il Quarter Sprint", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await getSession();

    if (!(await isAdmin(session))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Handle params as Promise (Next.js 15+) or direct object
    const resolvedParams = params instanceof Promise ? await params : params;
    const quarterSprintId = Number(resolvedParams.id);
    if (!Number.isFinite(quarterSprintId)) {
      return NextResponse.json({ error: "ID Quarter Sprint non valido" }, { status: 400 });
    }

    const existing = await (prisma as any).quarterSprint.findUnique({
      where: { id: quarterSprintId },
      select: { 
        id: true,
        keyResults: {
          select: { id: true }
        }
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Quarter Sprint non trovato" }, { status: 404 });
    }

    // Before deleting, disconnect all key results by deleting them
    // (since quarterSprintId is required in schema, we can't just set it to null)
    // The key results will be deleted automatically due to cascade, but we notify about it
    if (existing.keyResults && existing.keyResults.length > 0) {
      // Key results will be deleted automatically due to cascade
      // No need to manually delete them
    }

    await (prisma as any).quarterSprint.delete({
      where: { id: quarterSprintId },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Quarter Sprint eliminato con successo",
      deletedKeyResultsCount: existing.keyResults?.length || 0
    });
  } catch (error) {
    console.error("DELETE /api/quarter-sprints/[id] error", error);
    return NextResponse.json(
      { error: "Impossibile eliminare il Quarter Sprint", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}


