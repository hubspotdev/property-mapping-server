declare module "default" {
  interface Property {
    name: string;
    label?: string | null;
    type?: string;
    object: Objects;
    unique?: boolean;
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
    object: Object;
    customerId: string;
    direction: Direction;
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
