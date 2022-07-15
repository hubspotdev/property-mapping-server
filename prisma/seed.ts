import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const firstname = await prisma.properties.upsert({
        where: {
            name_object_customerId: {
                name: "firstname",
                object: "Contact",
                customerId: "1"
            }
        },
        update: {},
        create: {
            name: "firstname",
            label: "First Name",
            type: "String",
            object: "Contact",
            customerId: "1"
        }
    })
    console.log(firstname)


    const lastname = await prisma.properties.upsert({
        where: {
            name_object_customerId: {
                name: "lastname",
                object: "Contact",
                customerId: "1"
            }
        },
        update: {},
        create: {
            name: "lastname",
            label: "Last Name",
            type: "String",
            object: "Contact",
            customerId: "1"
        }
    })
    console.log(lastname)
    const exampleCustom = await prisma.properties.upsert({
        where: {
            name_object_customerId: {
                name: "example_custom",
                object: "Contact",
                customerId: "1"
            }
        },
        update: {},
        create: {
            name: "example_custom",
            label: "Example Custom Property",
            type: "String",
            object: "Contact",
            customerId: "1"
        }
    })
    console.log(exampleCustom)
    const customCompany = await prisma.properties.upsert({
        where: {
            name_object_customerId: {
                name: "example_custom_company",
                object: "Company",
                customerId: "1"
            }
        },
        update: {},
        create: {
            name: "example_custom_company",
            label: "Example Custom Property",
            type: "String",
            object: "Company",
            customerId: "1"
        }
    })
    console.log(customCompany)
    const companyName = await prisma.properties.upsert({
        where: {
            name_object_customerId: {
                name: "company_name",
                object: "Company",
                customerId: "1"
            }
        },
        update: {},
        create: {
            name: "company_name",
            label: "Name",
            type: "String",
            object: "Company",
            customerId: "1"
        }
    }
    )
    console.log(companyName)
    const industry = await prisma.properties.upsert({
        where: {
            name_object_customerId: {
                name: "industry",
                object: "Company",
                customerId: "1"
            }
        },
        update: {},
        create: {
            name: "industry",
            label: "Industry",
            type: "String",
            object: "Company",
            customerId: "1"
        }
    })
    console.log(industry)
    const num_employees = await prisma.properties.upsert({
        where: {
            name_object_customerId: {
                name: "num_employees",
                object: "Company",
                customerId: "1"
            }
        },
        update: {},
        create: {
            name: "num_employees",
            label: "Number of Employees",
            type: "Number",
            object: "Company",
            customerId: "1"
        }
    }
    )
    console.log(num_employees)

}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })