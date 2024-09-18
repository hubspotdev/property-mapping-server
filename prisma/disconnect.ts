import prismaSeed from '../prisma/seed';
import { prisma as prismaAuth } from '../src/auth';
import { prisma as prismaClient } from '../src/clients';

async function disconnectPrisma(): Promise<void> {
  try {
    console.log('Disconnecting from the database...');
    await prismaSeed.$disconnect();
    await prismaAuth.$disconnect();
    await prismaClient.$disconnect();
    console.log('Disconnected from the database successfully.');
  } catch (error) {
    console.error('Error while disconnecting from the database:', error);
    throw error;
  }
}

export default disconnectPrisma
