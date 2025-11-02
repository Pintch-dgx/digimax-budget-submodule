import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/role-guards";
import type { PrismaClient } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const quarterSprintId = searchParams.get("quarterSprintId");
    const ownerId = searchParams.get("ownerId");

    const where: Record<string, unknown> = {};
    if (quarterSprintId) {
      const parsed = Number(quarterSprintId);
      if (!Number.isNaN(parsed)) {
        where.quarterSprintId = parsed;
      }
    }
    if (ownerId) {
      const parsed = Number(ownerId);
      if (!Number.isNaN(parsed)) {
        where.ownerId = parsed;
      }
    }

    const keyResults = await (prisma as any).keyResult.findMany({
      where,
      orderBy: [{ quarterSprintId: "asc" }, { title: "asc" }],
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
        quarterSprint: {
          select: {
            id: true,
            name: true,
            shortCode: true,
            objective: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ data: keyResults });
  } catch (error) {
    console.error("GET /api/key-results error", error);
    return NextResponse.json({ error: "Impossibile recuperare i Key Result" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!(await isAdmin(session))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    if (!title || !metric) {
      return NextResponse.json({ error: "Titolo e metrica sono obbligatori" }, { status: 400 });
    }

    if (!quarterSprintId) {
      return NextResponse.json({ error: "Quarter sprint è obbligatorio" }, { status: 400 });
    }

    const parsedQuarterSprintId = Number(quarterSprintId);
    if (!Number.isFinite(parsedQuarterSprintId)) {
      return NextResponse.json({ error: "Quarter sprint non valido" }, { status: 400 });
    }

    const parsedTargetValue = targetValue !== undefined && targetValue !== null ? Number(targetValue) : null;
    const parsedProgressValue = progressValue !== undefined && progressValue !== null ? Number(progressValue) : null;
    
    if (parsedTargetValue === null || parsedTargetValue === undefined || Number.isNaN(parsedTargetValue)) {
      return NextResponse.json({ error: "Target value è obbligatorio e deve essere un numero" }, { status: 400 });
    }
    
    if (parsedTargetValue < 0) {
      return NextResponse.json({ error: "Target value deve essere un numero positivo o zero" }, { status: 400 });
    }

    const parsedWeight = weight !== undefined && weight !== null ? Number(weight) : 100;
    if (Number.isNaN(parsedWeight) || parsedWeight < 0) {
      return NextResponse.json({ error: "Weight deve essere un numero positivo" }, { status: 400 });
    }

    const created = await (prisma as any).keyResult.create({
      data: {
        title: String(title),
        metric: String(metric),
        targetValue: parsedTargetValue,
        progressValue: parsedProgressValue,
        unit: unit ?? "unit",
        weight: parsedWeight,
        status: status ?? "NOT_STARTED",
        quarterSprint: {
          connect: { id: parsedQuarterSprintId },
        },
        ...(ownerId ? {
          owner: {
            connect: { id: Number(ownerId) },
          },
        } : {}),
      },
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

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/key-results error", error);
    return NextResponse.json(
      { error: "Impossibile creare il Key Result", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}


