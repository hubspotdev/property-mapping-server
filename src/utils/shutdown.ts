import { logger } from "./logger";
import handleError from "./error";
import disconnectPrisma from "../../prisma/disconnect";
import server from "../app";

async function shutdown(): Promise<void> {
  try {
    logger.info({
      type: "Shutdown",
      logMessage: { message: "Initiating graceful shutdown..." }
    });

    const closeServerPromise = new Promise<void>((resolve, reject) => {
      server.close((err) => {
        logger.info({
          type: "Shutdown",
          logMessage: { message: "Server close callback called." }
        });
        if (err) {
          handleError(err, "Error closing the server");
          reject(err);
        } else {
          resolve();
        }
      });

      // Set a timeout in case the server does not close within a reasonable time
      setTimeout(() => {
        logger.warn({
          type: "Shutdown",
          logMessage: { message: "Forcing server shutdown after timeout." }
        });
        resolve();
      }, 5000);
    });

    await Promise.all([
      closeServerPromise
        .then(() => {
          logger.info({
            type: "Shutdown",
            logMessage: { message: "HTTP server closed successfully." }
          });
        })
        .catch((err) => {
          handleError(err, "Error during server close");
        }),
      disconnectPrisma().catch((err) =>
        handleError(err, "Error during Prisma disconnection")
      ),
    ]);

    logger.info({
      type: "Shutdown",
      logMessage: { message: "Graceful shutdown complete." }
    });
    process.exit(0);
  } catch (err) {
    handleError(err, "Error during shutdown", true);
  }
}

export default shutdown;
