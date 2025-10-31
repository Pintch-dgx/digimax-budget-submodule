import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { BudgetRequestStatus } from "@prisma/client";

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
    const { status, notes } = body;

    // Validazione stato
    if (status && !Object.values(BudgetRequestStatus).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Verifica che la richiesta esista
    const existingRequest = await prisma.budgetRequest.findUnique({
      where: { id: requestId },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: "Budget request not found" }, { status: 404 });
    }

    // Aggiorna la richiesta
    const updateData: any = {};
    if (status) {
      updateData.status = status as BudgetRequestStatus;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }

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

