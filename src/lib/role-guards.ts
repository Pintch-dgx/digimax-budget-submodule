import type { Session } from "next-auth";
import { prisma } from "@/lib/db";

export async function resolveUserRole(session: Session | null | undefined): Promise<string | null> {
  if (!session || !session.user) {
    return null;
  }

  if (typeof (session.user as any).role === "string") {
    return (session.user as any).role;
  }

  const userIdRaw = (session.user as any)?.id;
  const userId = typeof userIdRaw === "string" ? Number(userIdRaw) : userIdRaw;

  if (!userId || Number.isNaN(userId)) {
    return null;
  }

  const user = await prisma.marketingUser.findUnique({
    where: { id: userId },
    select: {
      role: {
        select: {
          key: true,
        },
      },
    },
  });

  return user?.role?.key ?? null;
}

export async function isAdmin(session: Session | null | undefined): Promise<boolean> {
  const role = await resolveUserRole(session);
  return role === "admin";
}


