import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";

type SessionUserWithId = DefaultSession["user"] & { id?: string };

export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET || "temporary-secret-key-change-in-production",
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId && typeof token.userId === "string") {
        (session.user as SessionUserWithId).id = token.userId;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      name: "email-password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const user = await prisma.marketingUser.findUnique({
          where: { email: credentials.email as string },
          include: { role: true },
        });

        if (!user) return null;

        const passwordMatch = await compare(credentials.password as string, user.password);
        if (!passwordMatch) return null;

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.fullName,
        };
      },
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  trustHost: true,
};

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);

