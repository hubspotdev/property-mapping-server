import { prisma } from "./clients";
import { getCustomerId } from "./utils";
import { Mapping } from "@prisma/client";
const getMappings = async (customerId: string) => {
  const mappings: Mapping[] = await prisma.mapping.findMany({
    select: {
      nativeName: true,
      hubspotLabel: true,
      hubspotName: true,
      id: true,
      object: true,
      direction: true,
      customerId: true,
    },
    where: {
      customerId,
    },
  });
  console.log(mappings);
  return mappings;
};

const deleteMapping = async (mappingId: number) => {
  const deleteResults = await prisma.mapping.delete({
    where: {
      id: mappingId,
    },
  });
  return deleteResults;
};

const saveMapping = async (maybeMapping: Mapping): Promise<Mapping | Error> => {
  console.log("maybeMapping", maybeMapping);
  const mappingName = maybeMapping.nativeName;
  const hubspotName = maybeMapping.hubspotName;
  const hubspotLabel = maybeMapping.hubspotLabel;
<<<<<<< HEAD
  const object = maybeMapping.object || "Contact";
=======
  const object = maybeMapping.object;
>>>>>>> 32fb2ac (udpate for demo)
  const direction = maybeMapping.direction;
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
      },
    });

    return mappingResult;
  } catch (error) {
    return error as Error;
  }
};

<<<<<<< HEAD
const saveMappings = async (mappingsInput: any[]) => {
=======
const saveMappings = async (mappingsInput: Mapping[]) => {
>>>>>>> 32fb2ac (udpate for demo)
  console.log("mappingsInput", mappingsInput);

  if (mappingsInput.length > 0) {
    const mappingResults = mappingsInput.map(async (maybeMapping) => {
      const mappingName = maybeMapping.nativeName;
<<<<<<< HEAD
      const hubspotName = maybeMapping.property.hubspotName;
      const hubspotLabel = maybeMapping.property.hubspotLabel;
      const object = maybeMapping.property.object;
=======
      const hubspotName = maybeMapping.hubspotName;
      const hubspotLabel = maybeMapping.hubspotLabel;
      const object = maybeMapping.object;
>>>>>>> 32fb2ac (udpate for demo)
      const direction = maybeMapping.direction;
      const customerId = getCustomerId();

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
        },
      });

      return mappingResult;
    });

    return await Promise.all(mappingResults);
  }
  return {};
};

export { saveMappings, deleteMapping, getMappings, saveMapping };
