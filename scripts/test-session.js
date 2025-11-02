// Script per testare se getSession() funziona
console.log("Test getSession non è possibile da Node.js - richiede contesto HTTP");
console.log("Verifico invece se ci sono sessioni valide nel database...");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Verifica se ci sono sessioni attive
  const sessions = await prisma.session.findMany({
    where: {
      expires: {
        gt: new Date(),
      },
    },
    include: {
      user: {
        include: {
          role: true,
        },
      },
    },
    orderBy: {
      expires: "desc",
    },
    take: 5,
  });

  console.log(`\nSessioni attive trovate: ${sessions.length}\n`);
  
  sessions.forEach((session, index) => {
    console.log(`Sessione ${index + 1}:`);
    console.log(`  Session Token: ${session.sessionToken.substring(0, 20)}...`);
    console.log(`  User ID: ${session.userId}`);
    console.log(`  User Email: ${session.user.email}`);
    console.log(`  User Name: ${session.user.fullName}`);
    console.log(`  User Role Key: ${session.user.role?.key}`);
    console.log(`  Expires: ${session.expires}`);
    console.log('');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

