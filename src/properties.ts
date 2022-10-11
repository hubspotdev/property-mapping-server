import { getAccessToken } from "./auth";
import { hubspotClient, prisma } from "./clients";

const createPropertyGroup = async (accessToken: string) => {
  hubspotClient.setAccessToken(accessToken);
  try {
    const propertyGroupCreateResponse =
      await hubspotClient.crm.properties.groupsApi.create("contact", {
        name: "integration_properties",
        label: "Integration Properties",
        displayOrder: 13,
      });
  } catch (error) {
    console.error(error);
  }
};

const createRequiredProperty = async (accessToken: string) => {
  hubspotClient.setAccessToken(accessToken);
  try {
    const propertyCreateResponse =
      await hubspotClient.crm.properties.coreApi.create("contact", {
        name: "example_required",
        label: "Example Required",
        type: "string",
        description: "This property is required for the integration to work",
        fieldType: "text",
        groupName: "integration_properties",
      });
  } catch (error) {
    console.error(error);
  }
};

const getHubSpotProperties = async (customerId: string) => {
  const accessToken: string = await getAccessToken(customerId);
  console.log(accessToken);

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

export {
  getHubSpotProperties,
  getNativeProperties,
  createPropertyGroup,
  createRequiredProperty,
};
