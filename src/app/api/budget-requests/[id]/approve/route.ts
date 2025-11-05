import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/role-guards";
import { BudgetRequestStatus } from "@prisma/client";

/**
 * POST /api/budget-requests/[id]/approve
 * Approva o rifiuta una richiesta di budget
 * 
 * Solo gli admin possono approvare/rifiutare richieste
 * 
 * Body:
 * - action: "approve" | "approve_with_changes" | "reject"
 * - modifiedAmount?: number (opzionale, solo per approve_with_changes)
 * - notes?: string (opzionale, note dell'admin)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getSession();

    // Solo admin possono approvare
    if (!(await isAdmin(session))) {
      return NextResponse.json(
        { error: "Forbidden - Solo admin possono approvare richieste di budget" },
        { status: 403 }
      );
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const requestId = Number(resolvedParams.id);

    if (!requestId || isNaN(requestId)) {
      return NextResponse.json(
        { error: "ID richiesta non valido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, modifiedAmount, notes } = body;

    if (!action || !["approve", "approve_with_changes", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Action deve essere: approve, approve_with_changes, o reject" },
        { status: 400 }
      );
    }

    // Recupera la richiesta di budget
    const budgetRequest = await prisma.budgetRequest.findUnique({
      where: { id: requestId },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            allocatedBudget: true,
            spentBudget: true,
          },
        },
        fiscalYear: true,
        requester: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!budgetRequest) {
      return NextResponse.json(
        { error: "Richiesta di budget non trovata" },
        { status: 404 }
      );
    }

    // Verifica che la richiesta sia in stato PENDING_APPROVAL
    if (budgetRequest.status !== BudgetRequestStatus.PENDING_APPROVAL) {
      return NextResponse.json(
        { error: `La richiesta è già stata processata (stato: ${budgetRequest.status})` },
        { status: 400 }
      );
    }

    let newStatus: BudgetRequestStatus;
    let amountToAllocate: number = budgetRequest.amount;
    let updateNotes = notes || null;

    switch (action) {
      case "reject":
        newStatus = BudgetRequestStatus.REJECTED;
        amountToAllocate = 0; // Non allocare budget
        console.log(`❌ Rejecting budget request ${requestId}`);
        break;

      case "approve":
        newStatus = BudgetRequestStatus.APPROVED;
        amountToAllocate = budgetRequest.amount;
        console.log(`✅ Approving budget request ${requestId} - Amount: ${amountToAllocate}`);
        break;

      case "approve_with_changes":
        newStatus = BudgetRequestStatus.APPROVED_WITH_CHANGES;
        
        // Validazione modifiedAmount
        if (modifiedAmount === undefined || modifiedAmount === null) {
          return NextResponse.json(
            { error: "modifiedAmount è obbligatorio per approve_with_changes" },
            { status: 400 }
          );
        }

        const parsedModified = Number(modifiedAmount);
        if (isNaN(parsedModified) || parsedModified <= 0) {
          return NextResponse.json(
            { error: "modifiedAmount deve essere un numero positivo" },
            { status: 400 }
          );
        }

        amountToAllocate = parsedModified;
        console.log(`✅ Approving budget request ${requestId} with changes - Original: ${budgetRequest.amount}, Modified: ${amountToAllocate}`);
        break;

      default:
        return NextResponse.json(
          { error: "Action non valida" },
          { status: 400 }
        );
    }

    // Aggiorna la richiesta di budget e la campagna in una transazione
    const result = await prisma.$transaction(async (tx) => {
      // 1. Aggiorna lo stato della richiesta di budget
      const updated = await tx.budgetRequest.update({
        where: { id: requestId },
        data: {
          status: newStatus,
          notes: updateNotes,
        },
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
              allocatedBudget: true,
              spentBudget: true,
            },
          },
          fiscalYear: true,
          requester: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      // 2. Se approvata (con o senza modifiche), aggiorna l'allocatedBudget della campagna
      if (newStatus === BudgetRequestStatus.APPROVED || newStatus === BudgetRequestStatus.APPROVED_WITH_CHANGES) {
        const currentAllocated = budgetRequest.campaign.allocatedBudget || 0;
        const newAllocated = currentAllocated + amountToAllocate;

        await tx.campaign.update({
          where: { id: budgetRequest.campaignId },
          data: {
            allocatedBudget: newAllocated,
            // Quando viene approvato il primo budget, la campagna passa ad ACTIVE
            status: currentAllocated === 0 ? "ACTIVE" : undefined,
          },
        });

        console.log(`💰 Updated campaign ${budgetRequest.campaignId} - allocatedBudget: ${currentAllocated} → ${newAllocated}`);
      }

      return updated;
    });

    console.log(`✅ Budget request ${requestId} processed successfully - Status: ${newStatus}`);

    return NextResponse.json({
      message: "Richiesta processata con successo",
      data: result,
      allocatedAmount: action === "reject" ? 0 : amountToAllocate,
    });
  } catch (error) {
    console.error("Error approving budget request:", error);
    return NextResponse.json(
      {
        error: "Errore durante l'approvazione della richiesta",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}



