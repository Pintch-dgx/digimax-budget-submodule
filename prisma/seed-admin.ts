import { PrismaClient, VisibilityScope } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.marketingRole.upsert({
    where: { key: "admin" },
    update: { name: "Administrator", visibility: VisibilityScope.FULL },
    create: { key: "admin", name: "Administrator", visibility: VisibilityScope.FULL },
  });

  await Promise.all([
    prisma.marketingRole.upsert({
      where: { key: "manager" },
      update: { name: "Campaign Manager", visibility: VisibilityScope.VERTICAL },
      create: { key: "manager", name: "Campaign Manager", visibility: VisibilityScope.VERTICAL },
    }),
    prisma.marketingRole.upsert({
      where: { key: "viewer" },
      update: { name: "Viewer", visibility: VisibilityScope.LIMITED },
      create: { key: "viewer", name: "Viewer", visibility: VisibilityScope.LIMITED },
    }),
  ]);

  const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const defaultPassword = process.env.ADMIN_PASSWORD ?? "admin123";
  const hashedPassword = await hash(defaultPassword, 10);

  const user = await prisma.marketingUser.upsert({
    where: { email },
    update: { fullName: "Admin User", roleId: admin.id, password: hashedPassword },
    create: { email, fullName: "Admin User", roleId: admin.id, password: hashedPassword },
  });

  console.info(`Seeded admin user: ${user.email} with role ${admin.key}`);
  console.info(`Default password: ${defaultPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
