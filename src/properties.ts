import {
  Objects,
  Properties,
  PropertyType,
  HubSpotPropertiesCache,
  Prisma,
} from "@prisma/client";
import { getAccessToken } from "./auth";

import prisma from "../prisma/seed";
import { hubspotClient } from "./auth";

import { Request } from "express";

import { PropertyCache } from "default";
import handleError from "./utils/error";
import {
  PropertyCreateFieldTypeEnum,
  PropertyCreateTypeEnum,
} from "@hubspot/api-client/lib/codegen/crm/properties";
import { logger } from "./utils/logger";

const TTL = 5 * 60 * 1000; // 5 Minute TTL in milliseconds

interface propertyConversionTable {
  [key: string]: PropertyType;
}
const propertyTypeConversionTable: propertyConversionTable = {
  string: PropertyType.String,
  number: PropertyType.Number,
  option: PropertyType.Option,
};

interface objectConversionTable {
  [key: string]: Objects;
}

const objectTypeConversionTable: objectConversionTable = {
  contacts: Objects.Contact,
  companies: Objects.Company,
};

export const convertToPropertyForDB = (
  requestBody: Request["body"],
  customerId: string,
) => {
  const newPropertyInfo: Properties = {
    name: "",
    label: "",
    type: "String",
    object: "Contact",
    unique: false,
    customerId: "1",
    modificationMetadata: {},
  };

  newPropertyInfo.name = requestBody.propertyName;
  newPropertyInfo.label = requestBody.propertyLabel;
  newPropertyInfo.type =
    propertyTypeConversionTable[
      requestBody.propertyType as keyof propertyConversionTable
    ];
  newPropertyInfo.object =
    objectTypeConversionTable[
      requestBody.objectType as keyof objectConversionTable
    ];
  newPropertyInfo.unique = requestBody.enforcesUniquness;
  newPropertyInfo.customerId = customerId;
  newPropertyInfo.modificationMetadata = requestBody.modificationMetadata;

  return newPropertyInfo;
};

export const createPropertyGroupForContacts = async (accessToken: string) => {
  logger.info({
    type: "HubSpot",
    logMessage: { message: "Creating contact property group..." },
  });
  hubspotClient.setAccessToken(accessToken);
  try {
    const propertyGroupCreateResponse =
      await hubspotClient.crm.properties.groupsApi.create("contact", {
        name: "integration_properties",
        label: "Integration Properties",
        displayOrder: 13,
      });
    logger.info({
      type: "HubSpot",
      logMessage: { message: "Contact property group created!" },
    });
  } catch (error) {
    handleError(error, "There was an issue while creating the property group ");
  }
};

export const createPropertyGroupForCompanies = async (accessToken: string) => {
  logger.info({
    type: "HubSpot",
    logMessage: { message: "Creating company property group..." },
  });
  hubspotClient.setAccessToken(accessToken);
  try {
    const propertyGroupCreateResponse =
      await hubspotClient.crm.properties.groupsApi.create("company", {
        name: "integration_properties",
        label: "Integration Properties",
        displayOrder: 13,
      });
    logger.info({
      type: "HubSpot",
      logMessage: { message: "Company property group created!" },
    });
  } catch (error: unknown) {
    handleError(
      error,
      "There was an issue while creating the company property group",
    );
  }
};

export const createRequiredContactProperty = async (accessToken: string) => {
  logger.info({
    type: "HubSpot",
    logMessage: { message: "Creating required contact property..." },
  });
  hubspotClient.setAccessToken(accessToken);
  try {
    const propertyCreateResponse =
      await hubspotClient.crm.properties.coreApi.create("contact", {
        name: "example_required",
        label: "Example Required",
        type: PropertyCreateTypeEnum.String,
        description: "This property is required for the integration to work",
        fieldType: PropertyCreateFieldTypeEnum.Text,
        groupName: "integration_properties",
      });
    logger.info({
      type: "HubSpot",
      logMessage: { message: "Required contact property created!" },
    });
  } catch (error) {
    handleError(
      error,
      "There was an issue while creating a property that is required for this integration ",
    );
  }
};

export const createContactIdProperty = async (accessToken: string) => {
  logger.info({
    type: "HubSpot",
    logMessage: { message: "Creating custom contact ID property..." },
  });
  hubspotClient.setAccessToken(accessToken);
  try {
    const propertyCreateResponse =
      await hubspotClient.crm.properties.coreApi.create("contact", {
        name: "native_system_contact_identifier",
        label: "Native System Contact Identifier",
        type: PropertyCreateTypeEnum.String,
        description:
          "This can be used in place of email adress ot uniquely identify a contact",
        fieldType: PropertyCreateFieldTypeEnum.Text,
        groupName: "integration_properties",
        hasUniqueValue: true,
      });
    logger.info({
      type: "HubSpot",
      logMessage: { message: "Custom contact ID property created!" },
    });
  } catch (error: unknown) {
    handleError(
      error,
      "There was an issue creating the custom contact ID property",
    );
  }
};

export const createCompanyIdProperty = async (accessToken: string) => {
  logger.info({
    type: "HubSpot",
    logMessage: { message: "Creating custom company ID property..." },
  });
  hubspotClient.setAccessToken(accessToken);
  try {
    const propertyCreateResponse =
      await hubspotClient.crm.properties.coreApi.create("company", {
        name: "native_system_company_identifier",
        label: "Native System Company Identifier",
        type: PropertyCreateTypeEnum.String,
        description:
          "This can be used in place of email adress ot uniquely identify a contact",
        fieldType: PropertyCreateFieldTypeEnum.Text,
        groupName: "integration_properties",
        hasUniqueValue: true,
      });
    logger.info({
      type: "HubSpot",
      logMessage: { message: "Custom company ID property created!" },
    });
  } catch (error: unknown) {
    handleError(
      error,
      "There was an issue creating the custom company ID property",
    );
  }
};

const checkPropertiesCache = async (
  customerId: string,
): Promise<PropertyCache | undefined> => {
  try {
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
  } catch (error) {
    handleError(
      error,
      "There was an issue while attempting to check the properties cache ",
    );
  }
};

const saveHubSpotPropertiesToCache = async (
  customerId: string,
  propertyData: any,
): Promise<HubSpotPropertiesCache | undefined> => {
  try {
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
  } catch (error) {
    handleError(
      error,
      "There was an issue while attempting to save Hubspot properties to the cache ",
    );
  }
};

export const getHubSpotProperties = async (
  customerId: string,
  skipCache: boolean,
): Promise<{ contactProperties: any; companyProperties: any } | undefined> => {
  // const propertiesCacheIsValid = await checkPropertiesCache(customerId);

  const accessToken: string | void = await getAccessToken(customerId);
  console.log(accessToken);

  if (accessToken) hubspotClient.setAccessToken(accessToken);
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
      handleError(
        error,
        "There was an issue while attempting to get Hubspot properties ",
      );
    }
  } else {
    return cacheResults?.propertyData;
  }
};

export const getNativeProperties = async (
  customerId: string,
): Promise<any[] | undefined> => {
  try {
    const properties = await prisma.properties.findMany({
      select: {
        name: true,
        label: true,
        type: true,
        object: true,
        customerId: true,
        unique: true,
        modificationMetadata: true,
      },
      where: {
        customerId,
      },
    });
    return properties;
  } catch (error) {
    handleError(
      error,
      "There was an issue while attempting to get the native properties ",
    );
  }
};

export const createNativeProperty = async (
  customerId: string,
  data: Properties,
) => {
  console.log("data", data);
  const createPropertyResponse = await prisma.properties.create({
    data: {
      ...data,
      modificationMetadata:
        data.modificationMetadata !== null
          ? data.modificationMetadata
          : Prisma.JsonNull,
    },
  });
  return createPropertyResponse;
};

// Check for an existing property or property group
export const checkForPropertyOrGroup = async (
  accessToken: string,
  objectType: string,
  propertyName: string,
  propertyOrGroup: string
) => {
  let propertyOrGroupExists: boolean = false;
  const isGroupString: string = propertyOrGroup == 'group' ? 'property group' : 'property';
  let getPropertyResponse: any;
  logger.info({
    type: "HubSpot",
    logMessage: { message: `Checking for ${objectType} ${isGroupString} ${propertyName}` }
  });
  hubspotClient.setAccessToken(accessToken);
  try{
    if ( propertyOrGroup == 'property' ){
      getPropertyResponse = await hubspotClient.crm.properties.coreApi.getByNameWithHttpInfo(objectType, propertyName);
    } else if ( propertyOrGroup == 'group' ){
      getPropertyResponse = await hubspotClient.crm.properties.groupsApi.getByNameWithHttpInfo(objectType, propertyName);
    } else {
      throw new Error(`Invalid schema type provided: ${propertyOrGroup}`);
    }

    // Check the response to see if the property or group exists
    if ( getPropertyResponse?.httpStatusCode == 404){
      // 404: property or group doesn't exist, and we should create it
      // Note: the current API client throws a 404 error if the property doesn't exist
      // Keeping this 404 check in case the client is changed
      propertyOrGroupExists = false;
    } else if (getPropertyResponse?.httpStatusCode == 200) {
      // 200: property or group was found, we can skip creating it
      propertyOrGroupExists = true
      logger.info({
        type: "HubSpot",
        logMessage: { message: `${objectType} ${isGroupString} ${propertyName} already exists, skipping...` }
      })
    } else {
      // Handle other unexpected errors
      logger.info({
        type: "HubSpot",
        logMessage: { message: `Unkown response code for ${objectType} ${isGroupString} ${propertyName}` }
      })
    }
  } catch(error:unknown) {
    // The current client throws a 404 error so we need to catch errors and check for the 404 code
    let errorCode: any = (error instanceof Error && "code" in error) ? error?.code : error;
    if (errorCode == 404) {
      // 404: property or group doesn't exist, and we should create it
      propertyOrGroupExists = false;
    } else {
      // Handle other unexpected errors
      handleError(error);
    }
  }
  return propertyOrGroupExists;
};
