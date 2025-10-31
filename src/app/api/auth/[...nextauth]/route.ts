import NextAuth from "@/lib/auth";

// NextAuth v4 with App Router
const handler = NextAuth as any;
export { handler as GET, handler as POST };
