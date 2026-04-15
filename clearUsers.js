import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const nonAdmins = await prisma.user.findMany({
    where: {
      email: {
        not: 'admin@bazarbeats.com'
      }
    },
    select: { id: true }
  });

  const ids = nonAdmins.map(u => u.id);
  
  if (ids.length > 0) {
    // Delete related records
    await prisma.cart.deleteMany({ where: { userId: { in: ids } } });
    await prisma.review.deleteMany({ where: { userId: { in: ids } } });
    await prisma.order.deleteMany({ where: { userId: { in: ids } } });
    
    // Delete the users
    const result = await prisma.user.deleteMany({
      where: {
        id: { in: ids }
      }
    });
    console.log(`Deleted ${result.count} non-admin users and their related data.`);
  } else {
    console.log('No other users found.');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
