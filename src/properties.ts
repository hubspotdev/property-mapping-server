import {
  Objects,
  Properties,
  PropertyType,
  HubSpotPropertiesCache,
  Prisma,
} from "@prisma/client";
import { authenticateHubspotClient } from "./auth";



import prisma from "../prisma/seed";
import { hubspotClient } from "./clients";

import { Request } from "express";

import { PropertyCache } from "./types/common";
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

/**
 * Converts request body data to a Properties object for database storage
 * Returns Properties object ready for database insertion
 */
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

/**
 * Creates a property group for contacts in HubSpot
 */
export const createPropertyGroupForContacts = async (accessToken: string) => {
  logger.info({
    type: "HubSpot",
    logMessage: { message: "Creating contact property group..." },
  });
  await authenticateHubspotClient();
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
    handleError(
      error,
      "There was an issue while creating the contact property group",
      false
    );
    throw error;
  }
};

/**
 * Creates a property group for companies in HubSpot
 */
export const createPropertyGroupForCompanies = async (accessToken: string) => {
  logger.info({
    type: "HubSpot",
    logMessage: { message: "Creating company property group..." },
  });
  await authenticateHubspotClient();
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
  } catch (error) {
    handleError(
      error,
      "There was an issue while creating the company property group",
      false
    );
    throw error;
  }
};

/**
 * Creates a required contact property in HubSpot
 */
export const createRequiredContactProperty = async (accessToken: string) => {
  logger.info({
    type: "HubSpot",
    logMessage: { message: "Creating required contact property..." },
  });
  await authenticateHubspotClient();
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
      "There was an issue while creating the required contact property",
      false
    );
    throw error;
  }
};

/**
 * Creates a unique identifier property for contacts in HubSpot
 */
export const createContactIdProperty = async (accessToken: string) => {
  logger.info({
    type: "HubSpot",
    logMessage: { message: "Creating custom contact ID property..." },
  });
  await authenticateHubspotClient();
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
  } catch (error) {
    handleError(
      error,
      "There was an issue while creating the contact ID property",
      false
    );
    throw error;
  }
};

/**
 * Creates a unique identifier property for companies in HubSpot
 */
export const createCompanyIdProperty = async (accessToken: string) => {
  logger.info({
    type: "HubSpot",
    logMessage: { message: "Creating custom company ID property..." },
  });
  await authenticateHubspotClient();
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
  } catch (error) {
    handleError(
      error,
      "There was an issue while creating the company ID property",
      false
    );
    throw error;
  }
};

/**
 * Checks if the properties cache is valid for a given customer
 */
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
      "There was an issue while checking the properties cache",
      false
    );
    throw error;
  }
};

/**
 * Saves HubSpot properties to the cache
 * Returns the cached data
 */
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
    return results;
  } catch (error) {
    handleError(
      error,
      "There was an issue while saving HubSpot properties to cache",
      false
    );
    throw error;
  }
};

/**
 * Retrieves HubSpot properties for a customer
 * skipCache - Whether to skip the cache and fetch fresh data
 * Returns HubSpot properties for contacts and companies
 */
export const getHubSpotProperties = async (
  customerId: string,
  skipCache: boolean,
): Promise<{ contactProperties: any; companyProperties: any } | null> => {
  const client = await authenticateHubspotClient();

  if (!client) {
    return null;
  }

  // const propertiesCacheIsValid = await checkPropertiesCache(customerId);

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
        "There was an issue while getting HubSpot properties",
        false
      );
      throw error;
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
      "There was an issue while getting native properties",
      false
    );
    throw error;
  }
};

export const createNativeProperty = async (
  customerId: string,
  data: Properties,
) => {
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

/**
 * Checks if a property or property group exists in HubSpot
 * Returns Boolean indicating if the property/group exists
 */
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

  try {
    if (propertyOrGroup == 'property') {
      getPropertyResponse = await hubspotClient.crm.properties.coreApi.getByNameWithHttpInfo(objectType, propertyName);
    } else if (propertyOrGroup == 'group') {
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
      });
    } else {
      logger.info({
        type: "HubSpot",
        logMessage: { message: `Unknown response code for ${objectType} ${isGroupString} ${propertyName}` }
      });
    }
  } catch (error) {
    const errorCode: any = (error instanceof Error && "code" in error) ? error?.code : error;
    if (errorCode == 404) {
      // 404: property or group doesn't exist, and we should create it
      propertyOrGroupExists = false;
    } else {
      handleError(
        error,
        `There was an issue while checking for ${objectType} ${isGroupString} ${propertyName}`,
        false
      );
      throw error;
    }
  }
  return propertyOrGroupExists;
};

/**
 * Sets up all required properties for the integration
 * accessToken - The HubSpot access token
 */
export const setupRequiredProperties = async (accessToken: string): Promise<void> => {
  try {
    // Check and create property groups in parallel
    const [contactGroupExists, companiesGroupExists] = await Promise.all([
      checkForPropertyOrGroup(accessToken, 'contacts', 'integration_properties', 'group'),
      checkForPropertyOrGroup(accessToken, 'companies', 'integration_properties', 'group')
    ]);

    // Create property groups if they don't exist
    await Promise.all([
      !contactGroupExists && createPropertyGroupForContacts(accessToken),
      !companiesGroupExists && createPropertyGroupForCompanies(accessToken)
    ]);

    // Check and create required properties in parallel
    const [
      requiredContactPropertyExists,
      contactIdPropertyExists,
      companyIdPropertyExists
    ] = await Promise.all([
      checkForPropertyOrGroup(accessToken, 'contacts', 'example_required', 'property'),
      checkForPropertyOrGroup(accessToken, 'contacts', 'native_system_contact_identifier', 'property'),
      checkForPropertyOrGroup(accessToken, 'companies', 'native_system_company_identifier', 'property')
    ]);

    // Create properties if they don't exist
    await Promise.all([
      !requiredContactPropertyExists && createRequiredContactProperty(accessToken),
      !contactIdPropertyExists && createContactIdProperty(accessToken),
      !companyIdPropertyExists && createCompanyIdProperty(accessToken)
    ]);

    logger.info({
      type: "HubSpot",
      logMessage: { message: "Successfully setup all required properties" }
    });
  } catch (error) {
    handleError(
      error,
      "There was an issue while setting up required properties",
      false // not critical, as we want to continue even if property setup fails
    );
    throw error; // Re-throw the error to be handled by the caller
  }
};
