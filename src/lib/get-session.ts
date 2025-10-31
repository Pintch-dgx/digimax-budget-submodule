import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";

// Helper per ottenere la sessione nelle API routes e server components
export async function getSession() {
  return await getServerSession(authOptions);
}

