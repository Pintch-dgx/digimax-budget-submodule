import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Test endpoint per verificare la connessione al database
export async function GET(request: NextRequest) {
  try {
    console.log("Testing database connection...");
    console.log("DATABASE_URL:", process.env.DATABASE_URL);
    
    // Test semplice: contare gli utenti
    const userCount = await prisma.marketingUser.count();
    const budgetRequestCount = await prisma.budgetRequest.count();
    
    return NextResponse.json({
      success: true,
      databaseUrl: process.env.DATABASE_URL,
      userCount,
      budgetRequestCount,
    });
  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      databaseUrl: process.env.DATABASE_URL,
    }, { status: 500 });
  }
}

