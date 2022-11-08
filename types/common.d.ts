declare module "default" {
  interface Property {
    name: string;
    label: string;
    type?: string;
    object: Objects;
  }
  interface Mapping {
    name: string;
    property: Property;
    direction: Direction;
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

  export interface ModificationMetadata {
    archivable: boolean;
    readOnlyDefinition: boolean;
    readOnlyValue: boolean;
  }

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
}
