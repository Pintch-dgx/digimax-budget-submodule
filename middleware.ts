import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  // If not authenticated, redirect to signin
  if (!req.auth) {
    const url = new URL("/signin", req.nextUrl);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  // Protect everything except auth endpoints, signin page, static assets and Next internals
  matcher: [
    "/((?!api/auth|signin|_next|favicon.ico|public|assets|.*\\.\").*)",
  ],
};


