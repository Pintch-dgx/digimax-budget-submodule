import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(req: any) {
  // If not authenticated, redirect to signin
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  
  if (!token) {
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


