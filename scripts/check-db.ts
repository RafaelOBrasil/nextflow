import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const tickets = await prisma.ticket.findMany();
    console.log('Ticket table exists. Count:', tickets.length);
  } catch (error) {
    console.error('Ticket table might not exist:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
