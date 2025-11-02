import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/role-guards";
import type { PrismaClient } from "@prisma/client";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await getSession();

    if (!(await isAdmin(session))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Handle params as Promise (Next.js 15+) or direct object
    const resolvedParams = params instanceof Promise ? await params : params;
    const objectiveId = Number(resolvedParams.id);
    if (!Number.isFinite(objectiveId)) {
      return NextResponse.json({ error: "ID obiettivo non valido" }, { status: 400 });
    }

    const existing = await (prisma as PrismaClient).objective.findUnique({
      where: { id: objectiveId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Obiettivo non trovato" }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, status, fiscalYearId, ownerId } = body ?? {};

    const data: Record<string, unknown> = {};

    if (title !== undefined) data.title = String(title);
    if (description !== undefined) data.description = description === null || description === "" ? null : String(description);
    if (status !== undefined) {
      if (status === "ACTIVE" || status === "COMPLETED" || status === "ARCHIVED") {
        data.status = status;
      }
    }
    if (fiscalYearId !== undefined) {
      if (fiscalYearId === null || fiscalYearId === "") {
        return NextResponse.json({ error: "Fiscal year è obbligatorio" }, { status: 400 });
      } else {
        const parsedFiscalYear = Number(fiscalYearId);
        if (!Number.isFinite(parsedFiscalYear)) {
          return NextResponse.json({ error: "Fiscal year non valido" }, { status: 400 });
        }
        data.fiscalYear = { connect: { id: parsedFiscalYear } };
      }
    }
    if (ownerId !== undefined) {
      if (ownerId === null || ownerId === "") {
        data.owner = { disconnect: true };
      } else {
        const parsedOwner = Number(ownerId);
        if (!Number.isFinite(parsedOwner)) {
          return NextResponse.json({ error: "Owner non valido" }, { status: 400 });
        }
        data.owner = { connect: { id: parsedOwner } };
      }
    }

    const updated = await (prisma as PrismaClient).objective.update({
      where: { id: objectiveId },
      data: data as any,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        progress: true,
        fiscalYearId: true,
        ownerId: true,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("PATCH /api/objectives/[id] error", error);
    return NextResponse.json(
      { error: "Impossibile aggiornare l'obiettivo", details: error instanceof Error ? error.message : String(error) },
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
    
    // Log the raw params.id for debugging
    console.log("DELETE /api/objectives/[id] - params.id:", resolvedParams.id);
    console.log("DELETE /api/objectives/[id] - typeof params.id:", typeof resolvedParams.id);

    const objectiveId = Number(resolvedParams.id);
    console.log("DELETE /api/objectives/[id] - objectiveId after Number():", objectiveId);
    console.log("DELETE /api/objectives/[id] - isFinite:", Number.isFinite(objectiveId));
    
    if (!Number.isFinite(objectiveId) || isNaN(objectiveId)) {
      console.error("DELETE /api/objectives/[id] - Invalid ID:", resolvedParams.id);
      return NextResponse.json({ error: "ID obiettivo non valido" }, { status: 400 });
    }

    const existing = await (prisma as PrismaClient).objective.findUnique({
      where: { id: objectiveId },
      select: { 
        id: true,
        quarterSprints: {
          select: { 
            id: true,
            keyResults: {
              select: { id: true }
            }
          }
        }
      },
    });

    if (!existing) {
      console.error("DELETE /api/objectives/[id] - Objective not found:", objectiveId);
      return NextResponse.json({ error: "Obiettivo non trovato" }, { status: 404 });
    }

    // Count dependent items that will be deleted due to cascade
    const quarterSprintsCount = existing.quarterSprints?.length || 0;
    const keyResultsCount = existing.quarterSprints?.reduce((sum, qs) => sum + (qs.keyResults?.length || 0), 0) || 0;

    // Delete the objective (cascade will delete quarter sprints and their key results)
    await (prisma as PrismaClient).objective.delete({
      where: { id: objectiveId },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Obiettivo eliminato con successo",
      deletedQuarterSprintsCount: quarterSprintsCount,
      deletedKeyResultsCount: keyResultsCount
    });
  } catch (error) {
    console.error("DELETE /api/objectives/[id] error", error);
    return NextResponse.json(
      { error: "Impossibile eliminare l'obiettivo", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}


