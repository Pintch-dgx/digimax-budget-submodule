import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

type SessionUserWithId = DefaultSession["user"] & { id?: string };

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        // User roles will be loaded from MarketingUser if needed
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
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
        
        // Temporarily disabled - User model doesn't exist in schema
        // TODO: Implement authentication using MarketingUser model when needed
        // For now, return null to disable authentication
        return null;
        
        // Uncomment when User model is added:
        // const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        // if (!user || !user.isActive) return null;
        // const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        // if (!ok) return null;
        // return { id: user.id, email: user.email, name: user.name ?? undefined };
      },
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  // Disable authentication check temporarily
  trustHost: true,
};

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);

