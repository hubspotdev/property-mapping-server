import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const firstname = await prisma.properties.upsert({
        where: { name: "firstname" },
        update: {},
        create: {
            name: "firstname",
            label: "First Name",
            type: "String",
            object: "Contact"
        }
    })


    const lastname = await prisma.properties.upsert({
        where: { name: "lastname" },
        update: {},
        create: {
            name: "lastname",
            label: "Last Name",
            type: "String",
            object: "Contact"
        }
    })
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
    const customCompany = await prisma.properties.upsert({
        where: {
            name_object: {
                name: "example_custom",
                object: "Company"
            }
        },
        update: {},
        create: {
            name: "example_custom",
            label: "Example Custom Property",
            type: "String",
            object: "Company"
        }
    })

    const companyName = await prisma.properties.upsert({
        where: {
            name_object: {
                name: "name",
                object: "Company"
            }
        },
        update: {},
        create: {
            name: "name",
            label: "Name",
            type: "String",
            object: "Company"
        }
    }
    )

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
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })