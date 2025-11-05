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
    } = body as {
      status?: BudgetRequestStatus;
      notes?: string | null;
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
        campaignId: true,
      },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: "Budget request not found" }, { status: 404 });
    }

    const updateData: Prisma.BudgetRequestUpdateInput = {};
    if (status) {
      updateData.status = status as BudgetRequestStatus;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Se lo status viene cambiato a APPROVED, aggiorna anche l'allocatedBudget della campagna
    const isApproving = status === BudgetRequestStatus.APPROVED && 
                        existingRequest.campaignId;

    let budgetRequest;
    
    if (isApproving) {
      // Usa una transazione per aggiornare sia la richiesta che la campagna
      budgetRequest = await prisma.$transaction(async (tx) => {
        // 1. Recupera la richiesta corrente per l'importo
        const currentRequest = await tx.budgetRequest.findUnique({
          where: { id: requestId },
          select: { amount: true, campaignId: true },
        });

        if (!currentRequest) {
          throw new Error("Budget request not found");
        }

        // 2. Aggiorna la richiesta
        const updated = await tx.budgetRequest.update({
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
                allocatedBudget: true,
              },
            },
          },
        });

        // 3. Aggiorna l'allocatedBudget della campagna
        if (updated.campaign && currentRequest.campaignId) {
          const currentAllocated = updated.campaign.allocatedBudget || 0;
          const newAllocated = currentAllocated + currentRequest.amount;

          await tx.campaign.update({
            where: { id: currentRequest.campaignId },
            data: {
              allocatedBudget: newAllocated,
              // Quando viene approvato il primo budget, la campagna passa ad ACTIVE
              status: currentAllocated === 0 ? "ACTIVE" : undefined,
            },
          });

          console.log(`💰 Budget approved - Updated campaign ${currentRequest.campaignId} - allocatedBudget: ${currentAllocated} → ${newAllocated}`);
        }

        return updated;
      });
    } else {
      // Aggiornamento normale senza transazione
      budgetRequest = await prisma.budgetRequest.update({
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
    }

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
