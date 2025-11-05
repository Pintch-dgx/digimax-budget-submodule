import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(req: any) {
  // Skip middleware per API routes e asset statici
  if (req.nextUrl.pathname.startsWith("/api") || 
      req.nextUrl.pathname.startsWith("/_next") ||
      req.nextUrl.pathname.startsWith("/favicon") ||
      req.nextUrl.pathname.startsWith("/public")) {
    return NextResponse.next();
  }
  
  // If not authenticated, redirect to signin
  const token = await getToken({ req, secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET });
  
  if (!token && req.nextUrl.pathname !== "/signin") {
    const url = new URL("/signin", req.nextUrl);
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

export const config = {
  // Protect everything except auth endpoints, API routes, signin page, static assets and Next internals
  matcher: [
    "/((?!api|signin|_next|favicon.ico|public|assets|.*\\.\").*)",
  ],
};


