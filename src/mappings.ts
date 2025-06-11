import prisma from "../prisma/seed";
import handleError from "./utils/error";
import { getCustomerId } from "./utils/utils";
import { Mapping } from "@prisma/client";
import { logger } from "./utils/logger";

const getMappings = async (
  customerId: string,
): Promise<Mapping[] | undefined> => {
  try {
    const mappings: Mapping[] = await prisma.mapping.findMany({
      select: {
        nativeName: true,
        hubspotLabel: true,
        hubspotName: true,
        id: true,
        object: true,
        direction: true,
        customerId: true,
        modificationMetadata: true,
      },
      where: {
        customerId,
      },
    });
    logger.info({
      type: "Mappings",
      logMessage: { message: "Retrieved mappings", data: mappings }
    });
    return mappings;
  } catch (error) {
    handleError(error, "There was an issue while querying property mappings");
  }
};

const deleteMapping = async (
  mappingId: number,
): Promise<Mapping | undefined> => {
  try {
    const deleteResults = await prisma.mapping.delete({
      where: {
        id: mappingId,
      },
    });

    return deleteResults;
  } catch (error) {
    handleError(
      error,
      "There was an issue while attempting to delete property mappings",
    );
  }
};

const saveMapping = async (
  maybeMapping: Mapping,
): Promise<Mapping | undefined> => {
  logger.info({
    type: "Mappings",
    logMessage: { message: "Attempting to save mapping", data: maybeMapping }
  });
  const mappingName = maybeMapping.nativeName;
  const hubspotName = maybeMapping.hubspotName;
  const hubspotLabel = maybeMapping.hubspotLabel;
  const object = maybeMapping.object;
  const direction = maybeMapping.direction;
  const modificationMetadata = maybeMapping.modificationMetadata;
  const customerId = getCustomerId();
  try {
    const mappingResult = await prisma.mapping.upsert({
      where: {
        nativeName_object_customerId: {
          nativeName: mappingName,
          customerId: customerId,
          object: object,
        },
      },
      update: {
        hubspotLabel,
        hubspotName,
        direction,
      },
      create: {
        hubspotLabel,
        hubspotName,
        nativeName: mappingName,
        object: object,
        customerId: customerId,
        direction: direction,
        modificationMetadata: modificationMetadata || {},
      },
    });

    return mappingResult;
  } catch (error) {
    handleError(error, "There was an issue while attempting to save the property mapping");
  }
};

export { deleteMapping, getMappings, saveMapping };
