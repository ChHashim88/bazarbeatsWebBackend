import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bazarbeats.com' },
    update: {
      role: 'ADMIN',
      password: hashedPassword
    },
    create: {
      name: 'Admin User',
      email: 'admin@bazarbeats.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('Admin user created successfully:', admin.email);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
