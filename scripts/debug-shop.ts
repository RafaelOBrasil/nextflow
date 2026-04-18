import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const shop = await prisma.barberShop.findUnique({
    where: { slug: 'teste' },
    include: { users: true }
  });
  console.log('Shop found:', JSON.stringify(shop, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
