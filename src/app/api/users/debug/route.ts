import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";

// Endpoint di debug per verificare utenti e sessioni
export async function GET(request: NextRequest) {
  try {
      const session = await getSession();
    
    // Lista tutti gli utenti nel database
    const allUsers = await prisma.marketingUser.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        password: false, // Non includere password per sicurezza
        hasPassword: true, // Questo non esiste, ma mostra se password è null
      },
      orderBy: { id: "asc" },
    });
    
    // Controlla quali utenti hanno password (controllo indiretto)
    const usersWithPasswordCheck = await Promise.all(
      allUsers.map(async (user) => {
        const fullUser = await prisma.marketingUser.findUnique({
          where: { id: user.id },
          select: { id: true, email: true, fullName: true, password: true },
        });
        return {
          id: fullUser!.id,
          email: fullUser!.email,
          fullName: fullUser!.fullName,
          hasPassword: !!fullUser!.password && fullUser!.password.length > 0,
        };
      })
    );

    return NextResponse.json({
      session: session ? {
        email: session.user?.email,
        name: session.user?.name,
        id: session.user?.id,
        idType: typeof (session.user as any)?.id,
      } : null,
      usersInDatabase: usersWithPasswordCheck,
      totalUsers: usersWithPasswordCheck.length,
      usersWithPassword: usersWithPasswordCheck.filter(u => u.hasPassword).length,
      usersWithoutPassword: usersWithPasswordCheck.filter(u => !u.hasPassword).length,
    });
  } catch (error) {
    console.error("Error in debug endpoint:", error);
    return NextResponse.json(
      { error: "Failed to get debug info", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

