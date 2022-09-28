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
  }
  enum Objects {
    Contact = "Contact",
    Company = "Company",
  }
}
