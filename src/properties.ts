import { HubSpotPropertiesCache, Properties } from '@prisma/client';
import { getAccessToken } from "./auth";
import { hubspotClient, prisma } from "./clients";
import { PropertyCache } from 'default';
import handleError from './utils/error';

const TTL = 5 * 60 * 1000; // 5 Minute TTL in milliseconds


export const createPropertyGroupForContacts = async (accessToken: string) => {

  hubspotClient.setAccessToken(accessToken);
  try {
    const propertyGroupCreateResponse =
      await hubspotClient.crm.properties.groupsApi.create("contact", {
        name: "integration_properties",
        label: "Integration Properties",
        displayOrder: 13,
      });
  } catch (error) {
    handleError(error, 'There was an issue while creating the property group ')
  }
};


export const createPropertyGroupForCompanies = async (accessToken: string) => {
  hubspotClient.setAccessToken(accessToken);
  try {
    const propertyGroupCreateResponse =
      await hubspotClient.crm.properties.groupsApi.create("company", {
        name: "integration_properties",
        label: "Integration Properties",
        displayOrder: 13,
      });
    console.log('Company property group created!');
  } catch (error:any) {
    handleError(error, 'There was an issue while creating the company property group')
  }
};


export const createRequiredContactProperty = async (accessToken: string) => {

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
    handleError(error, 'There was an issue while creating a property that is required for this integration to work ')
  }
};

export const createContactIdProperty = async (accessToken: string) => {
  hubspotClient.setAccessToken(accessToken);
  try {
    const propertyCreateResponse =
      await hubspotClient.crm.properties.coreApi.create("contact", {
        name: "native_system_contact_identifier",
        label: "Native System Contact Identifier",
        type: "string",
        description: "This can be used in place of email adress ot uniquely identify a contact",
        fieldType: "text",
        groupName: "integration_properties",
        hasUniqueValue:true
      });
    console.log('Custom contact ID property created!');
  } catch (error:any) {
    handleError(error, 'There was an issue creating the custom contact ID property')
  }
};

export const createCompanyIdProperty = async (accessToken: string) => {
  hubspotClient.setAccessToken(accessToken);
  try {
    const propertyCreateResponse =
      await hubspotClient.crm.properties.coreApi.create("company", {
        name: "native_system_company_identifier",
        label: "Native System Company Identifier",
        type: "string",
        description: "This can be used in place of email adress ot uniquely identify a contact",
        fieldType: "text",
        groupName: "integration_properties",
        hasUniqueValue: true
      });
    console.log('Custom company ID property created!');
  } catch (error:any) {
    handleError(error, 'There was an issue creating the custom company ID property')
  }
};


const checkPropertiesCache = async (customerId: string): Promise<PropertyCache | undefined> => {
  try{

  const cacheResults = await prisma.hubSpotPropertiesCache.findFirst({
    where: { customerId },
    select: { updatedAt: true, propertyData: true },
  });

  const now = new Date();
  const updatedAt = cacheResults?.updatedAt ?? new Date(0);
  return {
    expired: now.getTime() - updatedAt.getTime() > TTL,
    propertyData: cacheResults?.propertyData,
  };
} catch(error){
  handleError(error, "There was an issue while attempting to check the properties cache ")
}
};

const saveHubSpotPropertiesToCache = async (
  customerId: string,
  propertyData: any
): Promise<HubSpotPropertiesCache | undefined> => {
  try{
  const results = await prisma.hubSpotPropertiesCache.upsert({
    where: { customerId },
    update: { propertyData },
    create: {
      customerId,
      propertyData,
    },
  });
  console.log(results);
  return results;
} catch(error) {
  handleError(error, 'There was an issue while attempting to save Hubspot properties to the cache ')
}
};


export const getHubSpotProperties = async (customerId: string, skipCache: boolean): Promise<{ contactProperties: any; companyProperties: any; } | undefined>  => {

  // const propertiesCacheIsValid = await checkPropertiesCache(customerId);

  const accessToken: string | void = await getAccessToken(customerId);
  console.log(accessToken);

 if(accessToken) hubspotClient.setAccessToken(accessToken);
  // add DB call to check if we've looked in the last 5 minutes
  // https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#updatedat
  const cacheResults = await checkPropertiesCache(customerId);
  if (!cacheResults || cacheResults.expired || skipCache) {
    try {
      const contactProperties = (
        await hubspotClient.crm.properties.coreApi.getAll("contacts")
      ).results;
      const companyProperties = (
        await hubspotClient.crm.properties.coreApi.getAll("companies")
      ).results;
      await saveHubSpotPropertiesToCache(customerId, {
        contactProperties,
        companyProperties,
      });
      return {
        contactProperties,
        companyProperties,
      };
    } catch (error) {
      handleError(error, 'There was an issue while attempting to get Hubspot properties ')
    }
  } else {
    return cacheResults?.propertyData;
  }
};


export const getNativeProperties = async (customerId: string): Promise<any[] | undefined>  => {
  try{

  const properties = await prisma.properties.findMany({
    select: {
      name: true,
      label: true,
      type: true,
      object: true,
      customerId: true,
      modificationMetadata:true,
    },
    where: {
      customerId,
    },
  });
  return properties;
} catch(error){
  handleError(error, "There was an issue while attempting to get the native properties ")
}
};

