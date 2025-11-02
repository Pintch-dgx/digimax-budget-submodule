import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { BudgetRequestLinkStatus, BudgetRequestStatus, Prisma } from "@prisma/client";

// GET /api/budget-requests/[id] - Dettaglio richiesta budget
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 });
    }
    
    if (!session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized - No user ID" }, { status: 401 });
    }

    const { id } = await params;
    const requestId = parseInt(id);

    if (isNaN(requestId)) {
      return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
    }

    const budgetRequest = await prisma.budgetRequest.findUnique({
      where: { id: requestId },
      include: {
        requester: {
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
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!budgetRequest) {
      return NextResponse.json({ error: "Budget request not found" }, { status: 404 });
    }

    return NextResponse.json(budgetRequest);
  } catch (error) {
    console.error("Error fetching budget request:", error);
    return NextResponse.json(
      { error: "Failed to fetch budget request" },
      { status: 500 }
    );
  }
}

// PUT /api/budget-requests/[id] - Aggiorna richiesta budget (per cambiare stato)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 });
    }
    
    if (!session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized - No user ID" }, { status: 401 });
    }

    const { id } = await params;
    const requestId = parseInt(id);

    if (isNaN(requestId)) {
      return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
    }

    const body = await request.json();
    const {
      status,
      notes,
      campaignId,
      keyResultId,
      quarterSprintId,
    } = body as {
      status?: BudgetRequestStatus;
      notes?: string | null;
      campaignId?: number | string | null;
      keyResultId?: number | string | null;
      quarterSprintId?: number | string | null;
    };

    // Validazione stato
    if (status && !Object.values(BudgetRequestStatus).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Verifica che la richiesta esista
    const existingRequest = await prisma.budgetRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        fiscalYearId: true,
        quarterSprintId: true,
        keyResultId: true,
        campaignId: true,
      },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: "Budget request not found" }, { status: 404 });
    }

    let resolvedQuarterSprintId: number | null = existingRequest.quarterSprintId;
    let resolvedKeyResultId: number | null = existingRequest.keyResultId;
    let resolvedCampaignId: number | null = existingRequest.campaignId;

    if (quarterSprintId !== undefined) {
      if (quarterSprintId === null || quarterSprintId === "") {
        resolvedQuarterSprintId = null;
      } else {
        const parsedQuarterSprintId = Number(quarterSprintId);
        if (!Number.isFinite(parsedQuarterSprintId)) {
          return NextResponse.json({ error: "Quarter sprint non valido" }, { status: 400 });
        }
        const quarterSprint = await prisma.quarterSprint.findUnique({
          where: { id: parsedQuarterSprintId },
          select: { id: true, fiscalYearId: true },
        });
        if (!quarterSprint) {
          return NextResponse.json({ error: "Quarter sprint non trovato" }, { status: 404 });
        }
        if (quarterSprint.fiscalYearId !== existingRequest.fiscalYearId) {
          return NextResponse.json(
            { error: "Il Quarter Sprint appartiene a un anno fiscale diverso" },
            { status: 400 }
          );
        }
        resolvedQuarterSprintId = quarterSprint.id;
      }
    }

    if (keyResultId !== undefined) {
      if (keyResultId === null || keyResultId === "") {
        resolvedKeyResultId = null;
      } else {
        const parsedKeyResultId = Number(keyResultId);
        if (!Number.isFinite(parsedKeyResultId)) {
          return NextResponse.json({ error: "Key Result non valido" }, { status: 400 });
        }
        const keyResult = await prisma.keyResult.findUnique({
          where: { id: parsedKeyResultId },
          select: { id: true, quarterSprintId: true },
        });
        if (!keyResult) {
          return NextResponse.json({ error: "Key Result non trovato" }, { status: 404 });
        }
        resolvedKeyResultId = keyResult.id;
        if (keyResult.quarterSprintId) {
          if (resolvedQuarterSprintId && resolvedQuarterSprintId !== keyResult.quarterSprintId) {
            return NextResponse.json(
              { error: "Il Key Result selezionato appartiene a un Quarter Sprint diverso" },
              { status: 400 }
            );
          }
          resolvedQuarterSprintId = keyResult.quarterSprintId;
        } else if (!resolvedQuarterSprintId) {
          resolvedQuarterSprintId = null;
        }
      }
    }

    if (campaignId !== undefined) {
      if (campaignId === null || campaignId === "") {
        resolvedCampaignId = null;
      } else {
        const parsedCampaignId = Number(campaignId);
        if (!Number.isFinite(parsedCampaignId)) {
          return NextResponse.json({ error: "Campagna non valida" }, { status: 400 });
        }
        const campaign = await prisma.campaign.findUnique({
          where: { id: parsedCampaignId },
          select: {
            id: true,
            fiscalYearId: true,
            quarterSprintId: true,
            keyResultId: true,
          },
        });
        if (!campaign) {
          return NextResponse.json({ error: "Campagna non trovata" }, { status: 404 });
        }
        if (campaign.fiscalYearId !== existingRequest.fiscalYearId) {
          return NextResponse.json(
            { error: "La campagna appartiene a un anno fiscale diverso" },
            { status: 400 }
          );
        }
        if (campaign.quarterSprintId) {
          if (resolvedQuarterSprintId && resolvedQuarterSprintId !== campaign.quarterSprintId) {
            return NextResponse.json(
              { error: "La campagna è collegata a un Quarter Sprint diverso" },
              { status: 400 }
            );
          }
          resolvedQuarterSprintId = campaign.quarterSprintId;
        }
        if (campaign.keyResultId) {
          if (resolvedKeyResultId && resolvedKeyResultId !== campaign.keyResultId) {
            return NextResponse.json(
              { error: "La campagna è collegata a un Key Result diverso" },
              { status: 400 }
            );
          }
          resolvedKeyResultId = campaign.keyResultId;
        }
        resolvedCampaignId = campaign.id;
      }
    }

    const linkStatus = resolvedCampaignId
      ? BudgetRequestLinkStatus.ASSIGNED_TO_CAMPAIGN
      : resolvedKeyResultId
        ? BudgetRequestLinkStatus.ASSIGNMENT_PENDING
        : BudgetRequestLinkStatus.UNDEFINED_OBJECTIVE;

    const updateData: Prisma.BudgetRequestUpdateInput = {};
    if (status) {
      updateData.status = status as BudgetRequestStatus;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    if (resolvedQuarterSprintId !== existingRequest.quarterSprintId) {
      updateData.quarterSprint = resolvedQuarterSprintId
        ? { connect: { id: resolvedQuarterSprintId } }
        : { disconnect: true };
    }
    if (resolvedKeyResultId !== existingRequest.keyResultId) {
      updateData.keyResult = resolvedKeyResultId
        ? { connect: { id: resolvedKeyResultId } }
        : { disconnect: true };
    }
    if (resolvedCampaignId !== existingRequest.campaignId) {
      updateData.campaign = resolvedCampaignId
        ? { connect: { id: resolvedCampaignId } }
        : { disconnect: true };
    }
    updateData.linkStatus = linkStatus;

    const budgetRequest = await prisma.budgetRequest.update({
      where: { id: requestId },
      data: updateData,
      include: {
        requester: {
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
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(budgetRequest);
  } catch (error) {
    console.error("Error updating budget request:", error);
    return NextResponse.json(
      { error: "Failed to update budget request" },
      { status: 500 }
    );
  }
}

// DELETE /api/budget-requests/[id] - Elimina una richiesta (solo admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 });
    }

    const { id } = await params;
    const requestId = Number.parseInt(id, 10);

    if (Number.isNaN(requestId)) {
      return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
    }

    const currentUserId = Number.parseInt(String(session.user.id), 10);
    const currentUser = Number.isNaN(currentUserId)
      ? null
      : await prisma.marketingUser.findUnique({
          where: { id: currentUserId },
          include: { role: true },
        });

    const isAdmin = (currentUser?.role?.key ?? "").toLowerCase() === "admin";

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existingRequest = await prisma.budgetRequest.findUnique({ where: { id: requestId } });

    if (!existingRequest) {
      return NextResponse.json({ error: "Budget request not found" }, { status: 404 });
    }

    await prisma.budgetRequest.delete({ where: { id: requestId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting budget request:", error);
    return NextResponse.json(
      { error: "Failed to delete budget request" },
      { status: 500 }
    );
  }
}
