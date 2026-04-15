import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const defaultCategories = ['Men', 'Women', 'Unisex'];

  for (const name of defaultCategories) {
    const exists = await prisma.category.findFirst({ where: { name } });
    if (!exists) {
      await prisma.category.create({
        data: { name, description: `Footwear for ${name}` },
      });
      console.log(`Created category: ${name}`);
    } else {
      console.log(`Category already exists: ${name}`);
    }
  }

  // Assign existing products without a proper category to Unisex as a fallback
  const firstCategory = await prisma.category.findFirst({ where: { name: 'Unisex' } });
  if (firstCategory) {
    const defaultUnknowns = await prisma.category.findFirst({ where: { name: 'Uncategorized' } });
    if (defaultUnknowns) {
      await prisma.product.updateMany({
        where: { categoryId: defaultUnknowns.id },
        data: { categoryId: firstCategory.id }
      });
      
      // Cleanup the old auto-generated one if not needed
      const remainingProducts = await prisma.product.count({ where: { categoryId: defaultUnknowns.id } });
      if (remainingProducts === 0) {
        await prisma.category.delete({ where: { id: defaultUnknowns.id } });
        console.log('Cleaned up Uncategorized fallback.');
      }
    }
  }

  console.log('Category seeding complete.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
