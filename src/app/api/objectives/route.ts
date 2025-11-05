import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/role-guards";
import type { PrismaClient } from "@prisma/client";

const objectiveSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  progress: true,
  fiscalYearId: true,
  ownerId: true,
  createdAt: true,
  keyResults: {
    select: {
      id: true,
      title: true,
      metric: true,
      targetValue: true,
      progressValue: true,
      unit: true,
      weight: true,
      objectiveId: true,
    },
  },
  owner: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
  fiscalYear: {
    select: {
      id: true,
      code: true,
      label: true,
    },
  },
} as const;

export async function GET() {
  try {
    const session = await getSession();

    if (!(await isAdmin(session))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const objectives = await (prisma as any).objective.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: objectiveSelect, // Include keyResults and other relations
    });

    console.log(`[OKR] Found ${objectives.length} objectives`);
    return NextResponse.json({ data: objectives });
  } catch (error) {
    console.error("[ERROR] GET /api/objectives error", error);
    console.error("[ERROR] Stack:", error instanceof Error ? error.stack : "N/A");
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Impossibile recuperare gli obiettivi", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!(await isAdmin(session))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, fiscalYearId, ownerId, status = "ACTIVE" } = body ?? {};

    if (!title) {
      return NextResponse.json(
        { error: "Titolo è obbligatorio" },
        { status: 400 }
      );
    }

    let resolvedFiscalYearId: number;
    if (fiscalYearId) {
      resolvedFiscalYearId = Number(fiscalYearId);
      if (!Number.isFinite(resolvedFiscalYearId)) {
        return NextResponse.json({ error: "Fiscal year non valido" }, { status: 400 });
      }
    } else {
      const latestFiscalYear = await prisma.fiscalYear.findFirst({ orderBy: { createdAt: "desc" } });
      if (!latestFiscalYear) {
        return NextResponse.json({ error: "Nessun fiscal year disponibile" }, { status: 400 });
      }
      resolvedFiscalYearId = latestFiscalYear.id;
    }

    const createData: any = {
      title: String(title),
      description: description ? String(description) : null,
      status: status === "ACTIVE" || status === "COMPLETED" || status === "ARCHIVED" ? status : "ACTIVE",
      fiscalYear: { connect: { id: resolvedFiscalYearId } },
    };

    if (ownerId) {
      const parsedOwnerId = Number(ownerId);
      if (Number.isFinite(parsedOwnerId)) {
        // Verifica che l'utente esista prima di collegarlo
        const ownerExists = await prisma.marketingUser.findUnique({
          where: { id: parsedOwnerId },
          select: { id: true },
        });
        
        if (ownerExists) {
          createData.owner = { connect: { id: parsedOwnerId } };
        } else {
          console.warn(`Owner ID ${parsedOwnerId} not found, creating objective without owner`);
        }
      }
    }

    const created = await (prisma as any).objective.create({
      data: createData,
      select: objectiveSelect,
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/objectives error", error);
    return NextResponse.json(
      { error: "Impossibile creare l'obiettivo", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}


