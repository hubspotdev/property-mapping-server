-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('String', 'Number', 'Option');

-- CreateEnum
CREATE TYPE "Objects" AS ENUM ('Company', 'Contact');

-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('toHubSpot', 'toNative', 'biDirectional');

-- CreateTable
CREATE TABLE "Mapping" (
    "id" SERIAL NOT NULL,
    "nativeName" VARCHAR(255) NOT NULL,
    "hubspotName" VARCHAR(255),
    "hubspotLabel" VARCHAR(255),
    "object" "Objects" NOT NULL,
    "customerId" VARCHAR(255) NOT NULL,
    "direction" "Direction" NOT NULL,
    "modificationMetadata" JSONB NOT NULL,

    CONSTRAINT "Mapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Authorization" (
    "customerId" VARCHAR(255) NOT NULL,
    "hsPortalId" VARCHAR(255) NOT NULL,
    "accessToken" VARCHAR(255) NOT NULL,
    "refreshToken" VARCHAR(255) NOT NULL,
    "expiresIn" INTEGER,
    "expiresAt" TIMESTAMP(6),

    CONSTRAINT "Authorization_pkey" PRIMARY KEY ("customerId")
);

-- CreateTable
CREATE TABLE "Properties" (
    "name" VARCHAR(255) NOT NULL,
    "label" VARCHAR(255),
    "type" "PropertyType" NOT NULL,
    "object" "Objects" NOT NULL,
    "customerId" VARCHAR(255) NOT NULL,
    "unique" BOOLEAN,
    "modificationMetadata" JSONB NOT NULL
);

-- CreateTable
CREATE TABLE "HubSpotPropertiesCache" (
    "id" SERIAL NOT NULL,
    "customerId" VARCHAR(255) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "propertyData" JSONB NOT NULL,

    CONSTRAINT "HubSpotPropertiesCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Mapping_nativeName_object_customerId_key" ON "Mapping"("nativeName", "object", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Properties_name_object_customerId_key" ON "Properties"("name", "object", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "HubSpotPropertiesCache_customerId_key" ON "HubSpotPropertiesCache"("customerId");
