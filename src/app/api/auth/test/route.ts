import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";

// Test endpoint per verificare l'autenticazione
export async function GET(request: NextRequest) {
  try {
    const cookies = request.cookies.getAll();
      const session = await getSession();
    
    return NextResponse.json({
      authenticated: !!session,
      hasCookies: cookies.length > 0,
      cookieCount: cookies.length,
      cookies: cookies.map(c => ({ name: c.name, hasValue: !!c.value })),
      session: session ? {
        user: session.user ? {
          email: session.user.email,
          name: session.user.name,
          id: (session.user as any).id,
        } : null,
      } : null,
      authSecret: process.env.AUTH_SECRET ? "Set" : "Missing",
    });
  } catch (error) {
    return NextResponse.json({
      authenticated: false,
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    }, { status: 500 });
  }
}

