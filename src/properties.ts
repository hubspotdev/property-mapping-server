import { getAccessToken } from "./auth";
import { hubspotClient, prisma } from "./clients";

const getHubSpotProperties = async (customerId: string) => {
  const accessToken: string | Error = await getAccessToken(customerId);
  console.log(accessToken);
  if (accessToken instanceof Error) {
    return false;
  }
  hubspotClient.setAccessToken(accessToken);

  try {
    const contactProperties = (
      await hubspotClient.crm.properties.coreApi.getAll("contacts")
    ).results;
    const companyProperties = (
      await hubspotClient.crm.properties.coreApi.getAll("companies")
    ).results;

    return {
      contactProperties,
      companyProperties,
    };
  } catch (error) {
    console.error(error);
    return error;
  }
};

const getNativeProperties = async (customerId: string) => {
  const properties = await prisma.properties.findMany({
    select: {
      name: true,
      label: true,
      type: true,
      object: true,
    },
    where: {
      customerId,
    },
  });
  return properties;
};

export { getHubSpotProperties, getNativeProperties };
