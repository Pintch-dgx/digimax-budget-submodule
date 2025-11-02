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
    const keyResultId = Number(resolvedParams.id);
    if (!Number.isFinite(keyResultId)) {
      return NextResponse.json({ error: "ID Key Result non valido" }, { status: 400 });
    }

    const existing = await (prisma as any).keyResult.findUnique({
      where: { id: keyResultId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Key Result non trovato" }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      metric,
      targetValue,
      progressValue,
      unit,
      weight,
      quarterSprintId,
      ownerId,
      status,
    } = body ?? {};

    const data: Record<string, unknown> = {};

    if (title !== undefined) data.title = String(title);
    if (metric !== undefined) data.metric = String(metric);
    if (targetValue !== undefined) {
      const parsed = Number(targetValue);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return NextResponse.json({ error: "Target value deve essere un numero positivo" }, { status: 400 });
      }
      data.targetValue = parsed;
    }
    if (progressValue !== undefined) {
      data.progressValue = progressValue === null ? null : Number(progressValue);
    }
    if (unit !== undefined) data.unit = unit ?? "unit";
    if (status !== undefined) data.status = status;
    if (weight !== undefined) {
      const parsedWeight = Number(weight);
      if (!Number.isFinite(parsedWeight)) {
        return NextResponse.json({ error: "Peso non valido" }, { status: 400 });
      }
      data.weight = parsedWeight;
    }

    if (quarterSprintId !== undefined) {
      if (quarterSprintId === null || quarterSprintId === "") {
        return NextResponse.json({ error: "Quarter sprint è obbligatorio" }, { status: 400 });
      } else {
        const parsedQuarter = Number(quarterSprintId);
        if (!Number.isFinite(parsedQuarter)) {
          return NextResponse.json({ error: "Quarter sprint non valido" }, { status: 400 });
        }
        data.quarterSprint = { connect: { id: parsedQuarter } };
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

    const updated = await (prisma as any).keyResult.update({
      where: { id: keyResultId },
      data: data as any,
      select: {
        id: true,
        title: true,
        metric: true,
        targetValue: true,
        progressValue: true,
        unit: true,
        weight: true,
        status: true,
        quarterSprintId: true,
        ownerId: true,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("PATCH /api/key-results/[id] error", error);
    return NextResponse.json(
      { error: "Impossibile aggiornare il Key Result", details: error instanceof Error ? error.message : String(error) },
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
    const keyResultId = Number(resolvedParams.id);
    if (!Number.isFinite(keyResultId)) {
      return NextResponse.json({ error: "ID Key Result non valido" }, { status: 400 });
    }

    const existing = await (prisma as any).keyResult.findUnique({
      where: { id: keyResultId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Key Result non trovato" }, { status: 404 });
    }

    await (prisma as any).keyResult.delete({
      where: { id: keyResultId },
    });

    return NextResponse.json({ success: true, message: "Key Result eliminato con successo" });
  } catch (error) {
    console.error("DELETE /api/key-results/[id] error", error);
    return NextResponse.json(
      { error: "Impossibile eliminare il Key Result", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}


