import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { compare } from "bcryptjs";

// Endpoint di debug per verificare se l'utente esiste e la password è corretta
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    
    // Log DATABASE_URL per debug
    const dbUrl = process.env.DATABASE_URL || "not set";
    console.log("Check-user: DATABASE_URL:", dbUrl);
    
    // Conta tutti gli utenti per debug
    const allUsers = await prisma.marketingUser.findMany({
      select: { email: true, id: true },
    });
    console.log("Check-user: Total users in database:", allUsers.length, allUsers.map(u => u.email));
    
    const user = await prisma.marketingUser.findUnique({
      where: { email },
      include: { role: true },
    });
    
    if (!user) {
      return NextResponse.json({ 
        found: false,
        message: "User not found in database",
        email 
      });
    }
    
    const passwordMatch = await compare(password, user.password);
    
    return NextResponse.json({
      found: true,
      email: user.email,
      fullName: user.fullName,
      id: user.id,
      hasPassword: !!user.password,
      passwordLength: user.password?.length || 0,
      passwordMatch,
      role: user.role ? {
        key: user.role.key,
        name: user.role.name,
      } : null,
    });
  } catch (error) {
    console.error("Check user error:", error);
    return NextResponse.json(
      { error: "Failed to check user", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

