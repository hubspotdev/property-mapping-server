import prisma from "../prisma/seed";
import handleError from './utils/error';
import { getCustomerId } from "./utils";
import { Mapping } from "@prisma/client";
const getMappings = async (customerId: string): Promise<Mapping[] | undefined> => {
 try{
  const mappings: Mapping[] = await prisma.mapping.findMany({
    select: {
      nativeName: true,
      hubspotLabel: true,
      hubspotName: true,
      id: true,
      object: true,
      direction: true,
      customerId: true,
      modificationMetadata:true,
    },
    where: {
      customerId,
    },
  });
  console.log(mappings);
  return mappings;
} catch (error) {
  handleError(error, "There was an issue while querying property mappings ")
}
};

const deleteMapping = async (mappingId: number): Promise<Mapping | undefined> => {
  console.log(mappingId, 'mappingId++')
  try {
    const deleteResults = await prisma.mapping.delete({
      where: {
        id: mappingId,
      },
    });

    return deleteResults;
  }
  catch (error) {
    handleError(error, 'There was an issue while attempting to delete property mappings ')
  }
};

const saveMapping = async (maybeMapping: Mapping): Promise<Mapping | undefined> => {
  console.log("maybeMapping", maybeMapping);
  const mappingName = maybeMapping.nativeName;
  const hubspotName = maybeMapping.hubspotName;
  const hubspotLabel = maybeMapping.hubspotLabel;
  const object = maybeMapping.object;
  const direction = maybeMapping.direction;
  const modificationMetadata = maybeMapping.modificationMetadata
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
        modificationMetadata:modificationMetadata || {},
      },
    });

    return mappingResult;
  } catch (error) {
    handleError(error, 'There was an issue while attempting to save the property mapping ')
  }
};

// const saveMappings = async (mappingsInput: Mapping[]) => {
//   console.log("mappingsInput", mappingsInput);

//   if (mappingsInput.length > 0) {
//     const mappingResults = mappingsInput.map(async (maybeMapping) => {
//       const mappingName = maybeMapping.nativeName;
//       const hubspotName = maybeMapping.hubspotName;
//       const hubspotLabel = maybeMapping.hubspotLabel;
//       const object = maybeMapping.object;
//       const direction = maybeMapping.direction;
//       const customerId = getCustomerId();

//       const mappingResult = await prisma.mapping.upsert({
//         where: {
//           nativeName_object_customerId: {
//             nativeName: mappingName,
//             customerId: customerId,
//             object: object,
//           },
//         },
//         update: {
//           hubspotLabel,
//           hubspotName,
//           direction,
//         },
//         create: {
//           hubspotLabel,
//           hubspotName,
//           nativeName: mappingName,
//           object: object,
//           customerId: customerId,
//           direction: direction,
//         },
//       });

//       return mappingResult;
//     });

//     return await Promise.all(mappingResults);
//   }
//   return {};
// };

export { deleteMapping, getMappings, saveMapping };
