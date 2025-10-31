import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import path from "node:path";

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  const projectRoot = path.resolve(__dirname, "..");
  const absoluteDbPath = path.join(projectRoot, "prisma", "dev.db");
  process.env.DATABASE_URL = `file:${absoluteDbPath}`;
}

const prisma = new PrismaClient();

async function main() {
  console.log("Creating Elena user...");
  
  // Find or create role
  const role = await prisma.marketingRole.findFirst({
    where: { key: { in: ["DIGITAL_SPECIALIST", "admin"] } },
  });
  
  if (!role) {
    console.error("No role found!");
    return;
  }
  
  console.log("Found role:", role.key);
  
  const password = await hash("demo123", 10);
  
  // Create Elena user
  const elena = await prisma.marketingUser.upsert({
    where: { email: "elena.ferri@digimax.mock" },
    update: {
      fullName: "Elena Ferri",
      roleId: role.id,
      password: password,
    },
    create: {
      email: "elena.ferri@digimax.mock",
      fullName: "Elena Ferri",
      roleId: role.id,
      password: password,
    },
  });
  
  console.log("✅ Elena created:", elena.email, elena.id);
  
  // Verify it exists
  const check = await prisma.marketingUser.findUnique({
    where: { email: "elena.ferri@digimax.mock" },
  });
  
  console.log("✅ Verification:", check ? "User exists" : "User NOT found");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

