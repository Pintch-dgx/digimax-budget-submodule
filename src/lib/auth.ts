import NextAuth, { type DefaultSession, type Session, type User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";
import type { AdapterUser } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";

type SessionUserWithId = DefaultSession["user"] & { id?: string; role?: string | null };
type AuthUser = User & { role?: string | null };
type ExtendedToken = JWT & { userId?: string; role?: string | null };

export const authOptions = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "temporary-secret-key-change-in-production",
  session: { 
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 giorni
    updateAge: 24 * 60 * 60, // 24 ore
  },
  debug: process.env.NODE_ENV === "development",
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<AuthUser | null> {
        if (!credentials?.email || !credentials?.password) {
          console.log("Authorize: Missing credentials");
          return null;
        }
        
        const normalizedEmail = credentials.email.trim().toLowerCase();
        console.log("Authorize: Looking up user:", normalizedEmail);
        const user = await prisma.marketingUser.findUnique({
          where: { email: normalizedEmail },
          include: { role: true },
        });

        if (!user) {
          console.log("Authorize: User not found");
          return null;
        }

        console.log("Authorize: User found:", user.email, "ID:", user.id);
        const passwordMatch = await compare(credentials.password as string, user.password);
        
        if (!passwordMatch) {
          console.log("Authorize: Password mismatch");
          return null;
        }

        console.log("Authorize: Password match, returning user data");
        const authUser: AuthUser = {
          id: user.id.toString(),
          email: user.email,
          name: user.fullName,
          role: user.role?.key ?? null,
        };
        return authUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: ExtendedToken; user?: AuthUser | AdapterUser | null }) {
      console.log("JWT callback triggered:", { 
        hasUser: !!user, 
        userId: user?.id, 
        hasTokenUserId: !!token.userId 
      });
      
      // Quando l'utente fa login, salva l'ID nel token
      if (user?.id) {
        token.userId = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = (user as SessionUserWithId)?.role ?? null;
        console.log("JWT callback: User data saved to token", { userId: user.id, email: user.email });
      }
      // Mantieni i dati nel token anche dopo il refresh
      return token;
    },
    async session({ session, token }: { session: Session; token: ExtendedToken }) {
      // Assicurati che l'ID sia sempre presente nella sessione
      if (session.user && token.userId && typeof token.userId === "string") {
        (session.user as SessionUserWithId).id = token.userId;
      }
      if (session.user) {
        (session.user as SessionUserWithId).role = typeof token.role === "string" ? token.role : token.role ?? null;
      }
      // Debug: log nella sessione (solo in dev)
      if (process.env.NODE_ENV === "development") {
        console.log("Session callback - token.userId:", token.userId, "session.user.id:", (session.user as any)?.id);
        console.log("Session callback - token.role:", token.role);
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
};
