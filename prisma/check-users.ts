import { PrismaClient } from "@prisma/client";
import path from "node:path";

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  const projectRoot = path.resolve(__dirname, "..");
  const absoluteDbPath = path.join(projectRoot, "prisma", "dev.db");
  process.env.DATABASE_URL = `file:${absoluteDbPath}`;
}

const prisma = new PrismaClient();

async function main() {
  console.log("Checking users in database...");
  console.log("DATABASE_URL:", process.env.DATABASE_URL);
  
  const users = await prisma.marketingUser.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      password: false,
    },
    orderBy: { id: "asc" },
  });
  
  console.log(`Found ${users.length} users:`);
  users.forEach(u => {
    console.log(`  - ${u.id}: ${u.email} (${u.fullName})`);
  });
  
  const elena = await prisma.marketingUser.findUnique({
    where: { email: "elena.ferri@digimax.mock" },
  });
  
  console.log("\nElena check:", elena ? `Found (ID: ${elena.id})` : "NOT FOUND");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

