import NextAuth, { type DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";

type SessionUserWithId = DefaultSession["user"] & { id?: string };

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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Authorize: Missing credentials");
          return null;
        }
        
        console.log("Authorize: Looking up user:", credentials.email);
        const user = await prisma.marketingUser.findUnique({
          where: { email: credentials.email as string },
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
        return {
          id: user.id.toString(),
          email: user.email,
          name: user.fullName,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
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
        console.log("JWT callback: User data saved to token", { userId: user.id, email: user.email });
      }
      // Mantieni i dati nel token anche dopo il refresh
      return token;
    },
    async session({ session, token }) {
      // Assicurati che l'ID sia sempre presente nella sessione
      if (session.user && token.userId && typeof token.userId === "string") {
        (session.user as SessionUserWithId).id = token.userId;
      }
      // Debug: log nella sessione (solo in dev)
      if (process.env.NODE_ENV === "development") {
        console.log("Session callback - token.userId:", token.userId, "session.user.id:", (session.user as any)?.id);
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
};

export default NextAuth(authOptions);
