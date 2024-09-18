import { Authorization, PrismaClient, Objects } from "@prisma/client";
import * as hubspot from "@hubspot/api-client";

//Should be refactored to a single PrismaClient instance
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
const hubspotClient = new hubspot.Client({});

export { prisma, hubspotClient };
