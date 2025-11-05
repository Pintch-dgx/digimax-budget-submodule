import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";

// GET /api/campaigns - Lista tutte le campagne
export async function GET(request: NextRequest) {
  try {
    const session = await getSession().catch(() => null);

    const searchParams = request.nextUrl.searchParams;
    const fiscalYearId = searchParams.get("fiscalYearId");
    const objectiveId = searchParams.get("objectiveId");

    console.log("GET /api/campaigns", { fiscalYearId, objectiveId });

    const where: any = {};
    if (fiscalYearId) {
      where.fiscalYearId = parseInt(fiscalYearId, 10);
    }
    if (objectiveId) {
      const parsedObjectiveId = parseInt(objectiveId, 10);
      if (!Number.isNaN(parsedObjectiveId)) {
        where.objectiveId = parsedObjectiveId;
      }
    }

    const campaigns = await (prisma as any).campaign.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        code: true,
        shortCode: true,
        startDate: true,
        endDate: true,
        quarter: true,
        fiscalYearId: true,
        channelId: true,
        ownerId: true,
        objectiveId: true,
        status: true,
        goal: true,
        allocatedBudget: true,
        spentBudget: true,
        createdAt: true,
        updatedAt: true,
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

// POST /api/campaigns - Crea nuova campagna
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Autorizzazione: solo admin e marketing manager
    const userId = Number(session.user.id);
    
    // SEMPRE fare il lookup nel database per ottenere il ruolo aggiornato
    // Non fidarsi del ruolo nel token JWT che potrebbe essere obsoleto
    const user = await prisma.marketingUser.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    console.log("POST /api/campaigns - User check:", {
      userId,
      userEmail: user?.email,
      userFound: !!user,
      roleKey: user?.role?.key,
      roleName: user?.role?.name,
      sessionRole: (session.user as any)?.role, // ruolo dal token (solo per debug)
    });

    const isAuthorized = user?.role?.key === "admin" || user?.role?.key === "MARKETING_MANAGER";
    if (!isAuthorized) {
      console.error("POST /api/campaigns - Authorization failed:", {
        userId,
        userEmail: user?.email,
        roleKey: user?.role?.key,
        expected: ["admin", "MARKETING_MANAGER"],
      });
      return NextResponse.json({ error: "Forbidden - Solo admin e marketing manager possono creare campagne" }, { status: 403 });
    }

    const body = await request.json();
    const { name, fiscalYearId, channelId, ownerId, objectiveId, goal, status = "PLANNED", startDate, endDate, spentBudget } = body;

    // Validazione campi obbligatori
    if (!name || !fiscalYearId || !channelId || !ownerId) {
      return NextResponse.json(
        { error: "Nome, anno fiscale, canale e owner sono obbligatori" },
        { status: 400 }
      );
    }

    // Parse IDs
    const fyId = Number(fiscalYearId);
    const chId = Number(channelId);
    const ownId = Number(ownerId);

    if (isNaN(fyId) || isNaN(chId) || isNaN(ownId)) {
      return NextResponse.json({ error: "ID non validi" }, { status: 400 });
    }

    // Validazione foreign keys
    const [fiscalYear, channel, owner] = await Promise.all([
      prisma.fiscalYear.findUnique({ where: { id: fyId } }),
      prisma.marketingChannel.findUnique({ where: { id: chId } }),
      prisma.marketingUser.findUnique({ where: { id: ownId } }),
    ]);

    if (!fiscalYear || !channel || !owner) {
      return NextResponse.json({ error: "Riferimenti non validi" }, { status: 404 });
    }

    // Validazione Objective
    let resolvedObjectiveId: number | null = null;
    if (objectiveId) {
      const objId = Number(objectiveId);
      if (!isNaN(objId)) {
        const obj = await prisma.objective.findUnique({ where: { id: objId } });
        if (obj && obj.fiscalYearId === fyId) {
          resolvedObjectiveId = objId;
        }
      }
    }

    // Parse dates
    const parsedStartDate = startDate ? new Date(startDate) : new Date();
    const parsedEndDate = endDate ? new Date(endDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    
    // Calculate quarter from start date
    const quarter = Math.floor(parsedStartDate.getMonth() / 3) + 1;

    const validStatuses = ["PLANNED", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"];
    const campaignStatus = validStatuses.includes(status) ? status : "PLANNED";

    // Parse spentBudget se fornito
    let parsedSpentBudget = 0;
    if (spentBudget !== undefined && spentBudget !== null) {
      parsedSpentBudget = Number(spentBudget);
      if (isNaN(parsedSpentBudget) || parsedSpentBudget < 0) {
        return NextResponse.json({ error: "Budget speso non valido" }, { status: 400 });
      }
    }

    const createData: any = {
      name: String(name).trim(),
      goal: goal ? String(goal).trim() : null,
      status: campaignStatus,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      quarter,
      allocatedBudget: 0, // Sarà valorizzato dalla richiesta budget approvata
      spentBudget: parsedSpentBudget,
      fiscalYear: { connect: { id: fyId } },
      channel: { connect: { id: chId } },
      owner: { connect: { id: ownId } },
    };

    if (resolvedObjectiveId) {
      createData.objective = { connect: { id: resolvedObjectiveId } };
    }

    const created = await (prisma as any).campaign.create({
      data: createData,
      include: {
        channel: true,
        owner: true,
        fiscalYear: true,
        objective: true,
      },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/campaigns error", error);
    return NextResponse.json(
      { error: "Impossibile creare la campagna", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
