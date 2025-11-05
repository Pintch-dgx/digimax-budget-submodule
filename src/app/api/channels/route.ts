import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/channels - Lista tutti i canali marketing
export async function GET() {
  try {
    const channels = await prisma.marketingChannel.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
      },
    });

    return NextResponse.json(channels);
  } catch (error) {
    console.error("Error fetching channels:", error);
    return NextResponse.json(
      { error: "Failed to fetch channels", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

