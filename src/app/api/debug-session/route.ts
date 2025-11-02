import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { isAdmin } from "@/lib/role-guards";

export async function GET() {
  try {
    console.log("[DEBUG SESSION] Starting...");
    const session = await getSession();
    console.log("[DEBUG SESSION] Session:", JSON.stringify(session, null, 2));
    
    if (!session) {
      return NextResponse.json({ 
        error: "No session found",
        session: null,
      });
    }
    
    const adminCheck = await isAdmin(session);
    console.log("[DEBUG SESSION] isAdmin:", adminCheck);
    
    return NextResponse.json({
      session: {
        user: session.user,
        expires: session.expires,
      },
      isAdmin: adminCheck,
    });
  } catch (error) {
    console.error("[DEBUG SESSION] Error:", error);
    return NextResponse.json({
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

