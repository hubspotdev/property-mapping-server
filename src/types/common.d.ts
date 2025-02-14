
  interface Property {
    name: string;
    label?: string | null;
    type?: string;
    object: Objects;
    unique?: boolean;
    modificationMetadata: ModificationMetadata;

  }
  // interface Mapping {
  //   nativeName: string;
  //   hubspotProperty: Property;
  //   direction: Direction;
  // }
  interface Mapping {
    id: number;
    nativeName?: string;
    hubspotName?: string;
    object: object;
    customerId: string;
    direction: Direction;
    modificationMetadata: ModificationMetadata;
  }
  interface PropertyWithMapping {
    property: Property;
    mapping?: Mapping;
  }

  enum Objects {
    Contact = "Contact",
    Company = "Company",
  }

  enum Direction {
    toHubSpot = "toHubSpot",
    toNative = "toNative",
    biDirectional = "biDirectional",
  }

  export interface PropertyCache {
    expired: boolean,
    propertyData: Prisma.JsonValue | undefined
  }

  export interface ModificationMetadata {
    archivable: boolean;
    readOnlyDefinition: boolean;
    readOnlyValue: boolean;
  }

  export interface LogMessage {
    message: string;
    object?: any;
    context?:string;
    data?: any;
    stack?: string;
    code?: string;
    statusCode?: number;
    correlationId?: string;
    details?: any[];
    error?: Error
}

type LogLevel = 'Info' | 'Warning' | 'Error';

 export interface LogObject {
    logMessage : LogMessage,
    critical? : boolean,
    context? : string,
    type? : string
    level?: LogLevel
}

  //fix unused interface
  export interface HubSpotProperty {
    updatedAt: Date;
    createdAt: Date;
    name: string;
    label: string;
    type: string;
    fieldType: string;
    description: string;
    groupName: string;
    options: any[];
    createdUserId: string;
    updatedUserId: string;
    displayOrder: number;
    calculated: boolean;
    externalOptions: boolean;
    archived: boolean;
    hasUniqueValue: boolean;
    hidden: boolean;
    modificationMetadata: ModificationMetadata;
    formField: boolean;
  }
