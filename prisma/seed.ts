import { PrismaClient } from "@prisma/client";
import handleError from '../src/utils/error';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
});

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'test') {
    logger.info({
      type: "Database",
      logMessage: { message: "Skipping seed in test environment" }
    });
    return;
  }

  const firstname = await prisma.properties.upsert({
    where: {
      name_object_customerId: {
        name: "firstname",
        object: "Contact",
        customerId: "1",
      },
    },
    update: {},
    create: {
      name: "firstname",
      label: "First Name",
      type: "String",
      object: "Contact",
      customerId: "1",
      modificationMetadata:{
      archivable: true,
      readOnlyDefinition: false,
      readOnlyValue: false,
      }

    },
  });

  if (process.env.NODE_ENV !== 'test') {
    logger.info({
      type: "Database",
      logMessage: { message: "Created firstname property", data: firstname }
    });
  }
  const contactIdentifier = await prisma.properties.upsert({
    where: {
      name_object_customerId: {
        name: "native_system_contact_identifier",
        object: "Contact",
        customerId: "1",
      },
    },
    update: {},
    create: {
      name: "native_system_contact_identifier",
      label: "Native System Contact Identifier",
      type: "String",
      object: "Contact",
      customerId: "1",
      modificationMetadata: {
        archivable: true,
        readOnlyDefinition: false,
        readOnlyValue: false,
      },
      unique:true,
    },
  });

  if (process.env.NODE_ENV !== 'test') {
    logger.info({
      type: "Database",
      logMessage: { message: "Created native_system_contact_identifier property", data: contactIdentifier }
    });
  }

  const lastname = await prisma.properties.upsert({
    where: {
      name_object_customerId: {
        name: "lastname",
        object: "Contact",
        customerId: "1",
      },
    },
    update: {},
    create: {
      name: "lastname",
      label: "Last Name",
      type: "String",
      object: "Contact",
      customerId: "1",
      modificationMetadata:{
        archivable: true,
        readOnlyDefinition: false,
        readOnlyValue: false,
        }
    },
  });

  if (process.env.NODE_ENV !== 'test') {
    logger.info({
      type: "Database",
      logMessage: { message: "Created lastname property", data: lastname }
    });
  }
  const exampleCustom = await prisma.properties.upsert({
    where: {
      name_object_customerId: {
        name: "example_custom",
        object: "Contact",
        customerId: "1",
      },
    },
    update: {},
    create: {
      name: "example_custom",
      label: "Example Custom Property",
      type: "String",
      object: "Contact",
      customerId: "1",
      modificationMetadata:{
        archivable: true,
        readOnlyDefinition: false,
        readOnlyValue: false,
        }
    },
  });

  if (process.env.NODE_ENV !== 'test') {
    logger.info({
      type: "Database",
      logMessage: { message: "Created example_custom property", data: exampleCustom }
    });
  }
  const exampleRequired = await prisma.properties.upsert({
    where: {
      name_object_customerId: {
        name: "example_required",
        object: "Contact",
        customerId: "1",
      },
    },
    update: {},
    create: {
      name: "example_required",
      label: "Example Required Property",
      type: "String",
      object: "Contact",
      customerId: "1",
      modificationMetadata:{
        archivable: true,
        readOnlyDefinition: false,
        readOnlyValue: true,
        }
    },
  });

  if (process.env.NODE_ENV !== 'test') {
    logger.info({
      type: "Database",
      logMessage: { message: "Created example_required property", data: exampleRequired }
    });
  }
  const companyIdentifier = await prisma.properties.upsert({
    where: {
      name_object_customerId: {
        name: "native_system_company_identifier",
        object: "Company",
        customerId: "1",
      },
    },
    update: {},
    create: {
      name: "native_system_company_identifier",
      label: "Native System Company Identifier",
      type: "String",
      object: "Company",
      customerId: "1",
      modificationMetadata: {
        archivable: true,
        readOnlyDefinition: false,
        readOnlyValue: false,
      },
      unique:true,
    },
  });

  if (process.env.NODE_ENV !== 'test') {
    logger.info({
      type: "Database",
      logMessage: { message: "Created native_system_company_identifier property", data: companyIdentifier }
    });
  }
  const customCompany = await prisma.properties.upsert({
    where: {
      name_object_customerId: {
        name: "example_custom_company",
        object: "Company",
        customerId: "1",
      },
    },
    update: {},
    create: {
      name: "example_custom_company",
      label: "Example Custom Property",
      type: "String",
      object: "Company",
      customerId: "1",
      modificationMetadata:{
        archivable: true,
        readOnlyDefinition: false,
        readOnlyValue: false,
        }
    },
  });

  if (process.env.NODE_ENV !== 'test') {
    logger.info({
      type: "Database",
      logMessage: { message: "Created example_custom_company property", data: customCompany }
    });
  }
  const companyName = await prisma.properties.upsert({
    where: {
      name_object_customerId: {
        name: "company_name",
        object: "Company",
        customerId: "1",
      },
    },
    update: {},
    create: {
      name: "company_name",
      label: "Name",
      type: "String",
      object: "Company",
      customerId: "1",
      modificationMetadata:{
        archivable: true,
        readOnlyDefinition: false,
        readOnlyValue: false,
        }
    },
  });

  if (process.env.NODE_ENV !== 'test') {
    logger.info({
      type: "Database",
      logMessage: { message: "Created company_name property", data: companyName }
    });
  }
  const industry = await prisma.properties.upsert({
    where: {
      name_object_customerId: {
        name: "industry",
        object: "Company",
        customerId: "1",
      },
    },
    update: {},
    create: {
      name: "industry",
      label: "Industry",
      type: "String",
      object: "Company",
      customerId: "1",
      modificationMetadata:{
        archivable: true,
        readOnlyDefinition: false,
        readOnlyValue: false,
        }
    },
  });

  if (process.env.NODE_ENV !== 'test') {
    logger.info({
      type: "Database",
      logMessage: { message: "Created industry property", data: industry }
    });
  }
  const num_employees = await prisma.properties.upsert({
    where: {
      name_object_customerId: {
        name: "num_employees",
        object: "Company",
        customerId: "1",
      },
    },
    update: {},
    create: {
      name: "num_employees",
      label: "Number of Employees",
      type: "Number",
      object: "Company",
      customerId: "1",
      modificationMetadata:{
        archivable: true,
        readOnlyDefinition: false,
        readOnlyValue: false,
        }
    },
  });

  if (process.env.NODE_ENV !== 'test') {
    logger.info({
      type: "Database",
      logMessage: { message: "Created num_employees property", data: num_employees }
    });
  }
}

main()
  .catch((e) => {
    handleError(e, 'There was an issue seeding the database ', true)
  })

export default prisma
