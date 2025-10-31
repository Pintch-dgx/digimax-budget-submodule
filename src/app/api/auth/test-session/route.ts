import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";

// Test endpoint per verificare la sessione sia in GET che POST
export async function GET(request: NextRequest) {
  return testSession(request, "GET");
}

export async function POST(request: NextRequest) {
  return testSession(request, "POST");
}

async function testSession(request: NextRequest, method: string) {
  try {
    const cookies = request.cookies.getAll();
    const cookieHeader = request.headers.get("cookie");
    const authCookie = cookies.find(c => c.name.startsWith("authjs.session-token") || c.name.startsWith("__Secure-authjs.session-token") || c.name.includes("session"));
    
      const session = await getSession();
    
    return NextResponse.json({
      method,
      authenticated: !!session,
      hasCookies: cookies.length > 0,
      cookieCount: cookies.length,
      hasAuthCookie: !!authCookie,
      authCookieName: authCookie?.name || null,
      cookieHeaderPresent: !!cookieHeader,
      cookieHeaderLength: cookieHeader?.length || 0,
      session: session ? {
        user: session.user ? {
          email: session.user.email,
          name: session.user.name,
          id: (session.user as any)?.id,
        } : null,
      } : null,
      cookies: cookies.map(c => ({ name: c.name, hasValue: !!c.value && c.value.length > 0 })),
    });
  } catch (error) {
    return NextResponse.json({
      method,
      authenticated: false,
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    }, { status: 500 });
  }
}

