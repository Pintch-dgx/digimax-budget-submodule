import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 });
    }

    const campaignId = Number(params.id);
    if (!campaignId || Number.isNaN(campaignId)) {
      return NextResponse.json({ error: "Campaign id non valido" }, { status: 400 });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { fiscalYearId: true },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campagna non trovata" }, { status: 404 });
    }

    const body = await request.json();
    const { goal, quarterSprintId, keyResultId, allocation } = body ?? {};

    const normalizedQuarterSprintId =
      quarterSprintId === undefined || quarterSprintId === null
        ? quarterSprintId
        : Number(quarterSprintId);

    if (
      normalizedQuarterSprintId !== undefined &&
      normalizedQuarterSprintId !== null &&
      Number.isNaN(normalizedQuarterSprintId)
    ) {
      return NextResponse.json({ error: "Quarter sprint non valido" }, { status: 400 });
    }

    const allocationUpdate: { allocated?: number; spent?: number } = {};
    if (allocation) {
      if (allocation.allocated !== undefined) {
        const allocated = Number(allocation.allocated);
        if (!Number.isFinite(allocated) || allocated < 0) {
          return NextResponse.json({ error: "Valore 'allocated' non valido" }, { status: 400 });
        }
        allocationUpdate.allocated = Math.round(allocated);
      }
      if (allocation.spent !== undefined) {
        const spent = Number(allocation.spent);
        if (!Number.isFinite(spent) || spent < 0) {
          return NextResponse.json({ error: "Valore 'spent' non valido" }, { status: 400 });
        }
        allocationUpdate.spent = Math.round(spent);
      }
    }

    await prisma.$transaction(async (tx) => {
      const campaignUpdateData: Prisma.CampaignUpdateInput = {};

      if (goal !== undefined) {
        campaignUpdateData.goal = typeof goal === "string" ? goal : String(goal ?? "");
      }

      if (normalizedQuarterSprintId !== undefined) {
        if (normalizedQuarterSprintId === null) {
          (campaignUpdateData as any).quarterSprint = { disconnect: true };
        } else {
          (campaignUpdateData as any).quarterSprint = { connect: { id: normalizedQuarterSprintId } };
        }
      }

      if (keyResultId !== undefined) {
        if (keyResultId === null || keyResultId === "") {
          (campaignUpdateData as any).keyResult = { disconnect: true };
        } else {
          const parsedKeyResult = Number(keyResultId);
          if (!Number.isFinite(parsedKeyResult)) {
            throw new Error("Key Result non valido");
          }
          (campaignUpdateData as any).keyResult = { connect: { id: parsedKeyResult } };
        }
      }

      if (Object.keys(campaignUpdateData).length > 0) {
        await (tx as any).campaign.update({
          where: { id: campaignId },
          data: campaignUpdateData,
        });
      }

      if (Object.keys(allocationUpdate).length > 0) {
        const existingAllocation = await tx.budgetAllocation.findFirst({
          where: { campaignId },
          orderBy: { createdAt: "asc" },
        });

        if (existingAllocation) {
          await tx.budgetAllocation.update({
            where: { id: existingAllocation.id },
            data: allocationUpdate,
          });
        } else {
          await tx.budgetAllocation.create({
            data: {
              campaignId,
              fiscalYearId: campaign.fiscalYearId,
              allocated: allocationUpdate.allocated ?? 0,
              spent: allocationUpdate.spent ?? 0,
            },
          });
        }
      }
    });

      const updatedCampaign = await (prisma as any).campaign.findUnique({
      where: { id: campaignId },
      include: {
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
          orderBy: { createdAt: "asc" },
        },
        fiscalYear: {
          select: {
            id: true,
            code: true,
            label: true,
          },
        },
        quarterSprint: {
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
        },
        keyResult: {
          select: {
            id: true,
            title: true,
            metric: true,
            targetValue: true,
            progressValue: true,
            status: true,
            weight: true,
          },
        },
      },
    });

    if (!updatedCampaign) {
      return NextResponse.json({ error: "Campagna non trovata dopo l'aggiornamento" }, { status: 404 });
    }

    return NextResponse.json({ data: updatedCampaign });
  } catch (error) {
    console.error("PATCH /api/campaigns/[id] - Error", error);
    return NextResponse.json(
      { error: "Impossibile aggiornare la campagna", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

