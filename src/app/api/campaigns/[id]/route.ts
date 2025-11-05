import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await getSession();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 });
    }

    // Handle params as Promise (Next.js 15+) or direct object
    const resolvedParams = params instanceof Promise ? await params : params;
    const campaignId = Number(resolvedParams.id);
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
    const { goal, objectiveId, allocatedBudget, spentBudget } = body ?? {};

    const campaignUpdateData: Prisma.CampaignUpdateInput = {};

    if (goal !== undefined) {
      campaignUpdateData.goal = typeof goal === "string" ? goal : String(goal ?? "");
    }

    if (objectiveId !== undefined) {
      if (objectiveId === null || objectiveId === "") {
        (campaignUpdateData as any).objective = { disconnect: true };
      } else {
        const parsedObjective = Number(objectiveId);
        if (!Number.isFinite(parsedObjective)) {
          return NextResponse.json({ error: "Objective non valido" }, { status: 400 });
        }
        (campaignUpdateData as any).objective = { connect: { id: parsedObjective } };
      }
    }

    // Gestione allocatedBudget - normalmente valorizzato da approvazione budget request
    if (allocatedBudget !== undefined && allocatedBudget !== null) {
      const parsed = Number(allocatedBudget);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return NextResponse.json({ error: "Budget allocato non valido" }, { status: 400 });
      }
      campaignUpdateData.allocatedBudget = parsed;
    }

    // Gestione spentBudget - può essere inserito manualmente
    if (spentBudget !== undefined && spentBudget !== null) {
      const parsed = Number(spentBudget);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return NextResponse.json({ error: "Budget speso non valido" }, { status: 400 });
      }
      campaignUpdateData.spentBudget = parsed;
    }

    if (Object.keys(campaignUpdateData).length > 0) {
      await (prisma as any).campaign.update({
        where: { id: campaignId },
        data: campaignUpdateData,
      });
    }

      const updatedCampaign = await (prisma as any).campaign.findUnique({
      where: { id: campaignId },
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
          orderBy: { createdAt: "asc" },
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

