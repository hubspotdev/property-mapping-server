import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const firstname = await prisma.properties.upsert({
        where: {
            name_object: {
                name: "firstname",
                object: "Contact"
            }
        },
        update: {},
        create: {
            name: "firstname",
            label: "First Name",
            type: "String",
            object: "Contact"
        }
    })
    console.log(firstname)


    const lastname = await prisma.properties.upsert({
        where: {
            name_object: {
                name: "lastname",
                object: "Contact"
            }
        },
        update: {},
        create: {
            name: "lastname",
            label: "Last Name",
            type: "String",
            object: "Contact"
        }
    })
    console.log(lastname)
    const exampleCustom = await prisma.properties.upsert({
        where: {
            name_object: {
                name: "example_custom",
                object: "Contact"
            }
        },
        update: {},
        create: {
            name: "example_custom",
            label: "Example Custom Property",
            type: "String",
            object: "Contact"
        }
    })
    console.log(exampleCustom)
    const customCompany = await prisma.properties.upsert({
        where: {
            name_object: {
                name: "example_custom_company",
                object: "Company"
            }
        },
        update: {},
        create: {
            name: "example_custom_company",
            label: "Example Custom Property",
            type: "String",
            object: "Company"
        }
    })
    console.log(customCompany)
    const companyName = await prisma.properties.upsert({
        where: {
            name_object: {
                name: "company_name",
                object: "Company"
            }
        },
        update: {},
        create: {
            name: "company_name",
            label: "Name",
            type: "String",
            object: "Company"
        }
    }
    )
    console.log(companyName)
    const industry = await prisma.properties.upsert({
        where: {
            name_object: {
                name: "industry",
                object: "Company"
            }
        },
        update: {},
        create: {
            name: "industry",
            label: "Industry",
            type: "String",
            object: "Company"
        }
    })
    console.log(industry)
    const num_employees = await prisma.properties.upsert({
        where: {
            name_object: {
                name: "num_employees",
                object: "Company"
            }
        },
        update: {},
        create: {
            name: "num_employees",
            label: "Number of Employees",
            type: "Number",
            object: "Company"
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