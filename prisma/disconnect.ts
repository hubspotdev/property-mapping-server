import prismaSeed from '../prisma/seed';
import { logger } from '../src/utils/logger';
import handleError from '../src/utils/error';

async function disconnectPrisma(): Promise<void> {
  try {
    logger.info({
      type: "Database",
      logMessage: { message: "Disconnecting from the database..." }
    });
    await prismaSeed.$disconnect();
    logger.info({
      type: "Database",
      logMessage: { message: "Disconnected from the database successfully." }
    });
  } catch (error) {
    handleError(error, "Error while disconnecting from the database");
    throw error;
  }
}

export default disconnectPrisma
