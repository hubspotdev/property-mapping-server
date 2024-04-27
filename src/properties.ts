import { Objects, Properties, PropertyType } from "@prisma/client";
import { getAccessToken } from "./auth";
import { hubspotClient, prisma } from "./clients";
import {  Request } from "express";

const TTL = 5 * 60 * 1000; // 5 Minute TTL in milliseconds

interface propertyConversionTable {
  [key: string]:PropertyType
}
const propertyTypeConversionTable:propertyConversionTable ={
  "string": PropertyType.String,
  "number": PropertyType.Number,
  "option": PropertyType.Option
}

interface objectConversionTable {
  [key: string]: Objects
}

const objectTypeConversionTable:objectConversionTable = {
  "contact": Objects.Contact,
  "company": Objects.Company
}

export const convertToPropertyForDB = (requestBody:Request["body"]) =>{
  const newPropertyInfo:Properties = {name:"", label:"", type:"String", object:"Contact", unique:false, customerId:"1"}

  newPropertyInfo.name = requestBody.name
  newPropertyInfo.label = requestBody.label
  newPropertyInfo.type = propertyTypeConversionTable[ requestBody.type as keyof propertyConversionTable ]
  newPropertyInfo.object = objectTypeConversionTable[requestBody.objectType as keyof objectConversionTable]
  newPropertyInfo.unique = requestBody.enforcesUniquness
  newPropertyInfo.customerId = requestBody.customerId

  return newPropertyInfo
}

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
    console.error(error);
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
  } catch (error) {
    console.error(error);
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
    console.error(error);
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
  } catch (error) {
    console.error(error);
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
  } catch (error) {
    console.error(error);
  }
};

const checkPropertiesCache = async (customerId: string) => {
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
};

const saveHubSpotPropertiesToCache = async (
  customerId: string,
  propertyData: any
) => {
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
};

export const getHubSpotProperties = async (customerId: string) => {
  // const propertiesCacheIsValid = await checkPropertiesCache(customerId);

  const accessToken: string = await getAccessToken(customerId);
  console.log(accessToken);

  hubspotClient.setAccessToken(accessToken);
  // add DB call to check if we've looked in the last 5 minutes
  // https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#updatedat
  const cacheResults = await checkPropertiesCache(customerId);
  if (cacheResults.expired) {
    try {
      const contactProperties = (
        await hubspotClient.crm.properties.coreApi.getAll("contacts")
      ).results;
      const companyProperties = (
        await hubspotClient.crm.properties.coreApi.getAll("companies")
      ).results;
      saveHubSpotPropertiesToCache(customerId, {
        contactProperties,
        companyProperties,
      });
      return {
        contactProperties,
        companyProperties,
      };
    } catch (error) {
      console.error(error);
    }
  } else {
    return cacheResults?.propertyData;
  }
};

export const getNativeProperties = async (customerId: string) => {
  const properties = await prisma.properties.findMany({
    select: {
      name: true,
      label: true,
      type: true,
      object: true,
      customerId: true,
      unique:true
    },
    where: {
      customerId,
    },
  });
  return properties;
};

export const createNativeProperty = async (customerId: string, data:Properties) =>{
  console.log('data', data)
  const createPropertyResponse = await prisma.properties.create({
    data
  })
  return createPropertyResponse
}

