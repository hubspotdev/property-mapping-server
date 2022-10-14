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
}
