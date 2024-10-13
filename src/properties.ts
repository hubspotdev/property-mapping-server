import { Objects, Properties, PropertyType,HubSpotPropertiesCache } from "@prisma/client";
import { getAccessToken } from "./auth";
import { hubspotClient, prisma } from "./clients";
import {  Request } from "express";
import { PropertyCache } from 'default';

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
  "contacts": Objects.Contact,
  "companies": Objects.Company
}

export const convertToPropertyForDB = (requestBody:Request["body"],customerId:string) =>{
  const newPropertyInfo:Properties = {name:"", label:"", type:"String", object:"Contact", unique:false, customerId:"1"}

  newPropertyInfo.name = requestBody.propertyName
  newPropertyInfo.label = requestBody.propertyLabel
  newPropertyInfo.type = propertyTypeConversionTable[requestBody.propertyType as keyof propertyConversionTable]
  newPropertyInfo.object = objectTypeConversionTable[requestBody.objectType as keyof objectConversionTable]
  newPropertyInfo.unique = requestBody.enforcesUniquness
  newPropertyInfo.customerId = customerId

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
    console.log('Contact property group created!')
  } catch (error:any) {
    if (error instanceof Object){
      let errorBody = error.body ?? error
      console.log('API error creating contact property group:', errorBody);
    } else {
      console.log('Error creating contact property group:', error)
    }
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
    if (error instanceof Object){
      let errorBody = error.body ?? error
      console.log('API error creating company property group:', errorBody);
    } else {
      console.log('Error creating company property group:', error)
    }
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
    console.log('Required contact property created!');
  } catch (error:any) {
    if (error instanceof Object){
      let errorBody = error.body ?? error
      console.log('API error creating required contact property:', errorBody);
    } else {
      console.log('Error creating required contact property:', error)
    }
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
    if (error instanceof Object){
      let errorBody = error.body ?? error
      console.log('API error creating custom contact ID property:', errorBody);
    } else {
      console.log('Error creating custom contact ID property:', error)
    }
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
    if (error instanceof Object){
      let errorBody = error.body ?? error
      console.log('API error creating custom company ID property:', errorBody);
    } else {
      console.log('Error creating custom company ID property:', error)
    }
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
  console.error('Error checking properties cache',error)
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
  console.error('Error saving HubSpot properties to cache', error)
}
};


export const getHubSpotProperties = async (customerId: string, skipCache: boolean): Promise<{ contactProperties: any; companyProperties: any; } | undefined>  => {

  // const propertiesCacheIsValid = await checkPropertiesCache(customerId);

  const accessToken: string = await getAccessToken(customerId);
  console.log(accessToken);

  hubspotClient.setAccessToken(accessToken);
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
      console.error('Error getting HubSpot properties',error);
    }
  } else {
    return cacheResults?.propertyData;
  }
};


export const getNativeProperties = async (customerId: string): Promise<Properties[] | undefined>  => {
  try{

  const properties = await prisma.properties.findMany({
    select: {
      name: true,
      label: true,
      type: true,
      object: true,
      customerId: true,
      unique:true,
      modificationMetadata:true,

    },
    where: {
      customerId,
    },
  });
  return properties;
} catch(error){
  console.error('Error getting native properties',error)
}
};

export const createNativeProperty = async (customerId: string, data:Properties) =>{
  console.log('data', data)
  const createPropertyResponse = await prisma.properties.create({
    data
  })
  return createPropertyResponse
}

