import { Authorization, PrismaClient, Objects } from "@prisma/client";
import * as hubspot from "@hubspot/api-client";

const prisma = new PrismaClient();
const hubspotClient = new hubspot.Client({});

export { prisma, hubspotClient };
