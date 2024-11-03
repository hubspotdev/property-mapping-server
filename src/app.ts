import "dotenv/config";
import express, { Application, Request, Response } from "express";
import { authUrl, redeemCode } from "./auth";
import {
  getHubSpotProperties,
  getNativeProperties,
  createPropertyGroupForContacts,
  createRequiredContactProperty,
  createPropertyGroupForCompanies,
  createContactIdProperty,
  createCompanyIdProperty,
  createNativeProperty,
  convertToPropertyForDB,
  checkForPropertyOrGroup
} from "./properties";
import shutdown from "./utils/shutdown";
import { logger } from "./utils/logger";
import { saveMapping, getMappings, deleteMapping } from "./mappings";
import { PORT, getCustomerId } from "./utils/utils";
import { Mapping, Properties } from "@prisma/client";
import handleError from "./utils/error";
import { PropertyUpdate } from '@hubspot/api-client/lib/codegen/crm/properties';

const app: Application = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/install", (req: Request, res: Response) => {
  res.send(authUrl);
});

app.get(
  "/oauth-callback",
  async (req: Request, res: Response): Promise<void> => {
    const code = req.query.code;

    if (code) {
      try {
        const authInfo = await redeemCode(code.toString());
        if (authInfo) {
          const accessToken = authInfo.accessToken;
          logger.info({
            type: "HubSpot",
            logMessage: {
              message: "OAuth complete! Setting up integration properties...",
            },
          });

          // Check for contacts property group, create if missing
          const contactGroupExists = await checkForPropertyOrGroup(accessToken, 'contacts', 'integration_properties', 'group');
          if (!contactGroupExists) await createPropertyGroupForContacts(accessToken);

          // Check for companies property group, create if missing
          const companiesGroupExists = await checkForPropertyOrGroup(accessToken, 'companies', 'integration_properties', 'group');
          if (!companiesGroupExists) await createPropertyGroupForCompanies(accessToken);

          // Check for required contact property, create if missing
          const requiredContactPropertyExists = await checkForPropertyOrGroup(accessToken, 'contacts', 'example_required', 'property');
          if (!requiredContactPropertyExists) await createRequiredContactProperty(accessToken);

          // Check for custom conact id property, create if missing
          const contactIdPropertyExists = await checkForPropertyOrGroup(accessToken, 'contacts', 'native_system_contact_identifier', 'property');
          if (!contactIdPropertyExists ) await createContactIdProperty(accessToken);

          // Check for custom company id property, create if missing
          const companyIdPropertyExists = await checkForPropertyOrGroup(accessToken, 'companies', 'native_system_company_identifier', 'property');
          if (!companyIdPropertyExists) await createCompanyIdProperty(accessToken);

          res.redirect(`http://localhost:${PORT - 1}/`);
        }
      } catch (error) {
        handleError(error, "There was an issue in the Oauth callback ");
        let errMessageParam: string = `/?errMessage=${String(error)}`;
        if (error instanceof Error){
          errMessageParam = `/?errMessage=${error.message}`;
        }
        res.redirect(errMessageParam);
      }
    }
  },
);

app.get(
  "/api/hubspot-properties",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const customerId: string = getCustomerId();
      const properties = await getHubSpotProperties(customerId, false);

      if(!properties){
        res.send(authUrl)
      }
      res.send(properties);
    } catch (error) {
      handleError(error, "There was an issue getting Hubspot properties ");
      res.status(500).send("Internal Server Error");
    }
  },
);
app.get("/api/hubspot-properties-skip-cache", async (req: Request, res: Response) => {
  const customerId = getCustomerId();
  const properties = await getHubSpotProperties(customerId, true);
  res.send(properties);
});

// app.get("/api/native-properties/", async (req: Request, res: Response) => {
//   const customerId = getCustomerId();
//   const properties = await getNativeProperties(customerId);
//   res.send(properties);
// });

app.post("/api/native-properties/", async (req: Request, res: Response) => {
  const { body } = req;
  console.log("Raw Body", body);
  const customerId = getCustomerId();
  const propertyData = convertToPropertyForDB(body, customerId);
  console.log("Create Properties Request", propertyData);
  const createPropertyRespone = await createNativeProperty(
    customerId,
    propertyData,
  );
  res.send(createPropertyRespone);
});

app.get(
  "/api/native-properties-with-mappings",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const customerId = getCustomerId();
      const properties: Properties[] | undefined =
        await getNativeProperties(customerId);
      const mappings: Mapping[] | undefined = await getMappings(customerId);
      if (mappings && properties) {
        const propertiesWithMappings = properties.map((property) => {
          const matchedMapping = mappings.find(
            (mapping) => mapping.nativeName === property.name,
          );
          return { property, mapping: matchedMapping };
        });
        res.send(propertiesWithMappings);
      }
    } catch (error) {
      handleError(
        error,
        "There was an issue getting the native properties with mappings ",
      );
      res.status(500).send("Internal Server Error");
    }
  },
);

app.post(
  "/api/mappings",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const response = await saveMapping(req.body as Mapping);
      res.send(response);
    } catch (error) {
      handleError(error, "There was an issue while saving property mappings ");
      res.status(500).send("Error saving mapping");
    }
  },
);

app.delete(
  "/api/mappings/:mappingId",
  async (req: Request, res: Response): Promise<void> => {
    const mappingToDelete = req.params.mappingId;
    const mappingId = parseInt(mappingToDelete);
    if (!mappingId) {
      res.status(400).send("Invalid mapping Id format");
    }
    try {
      const deleteMappingResult = await deleteMapping(mappingId);
      res.send(deleteMappingResult);
    } catch (error) {
      handleError(
        error,
        "There was an issue while attempting to delete the mapping ",
      );
    }
  },
);

// app.get("/api/mappings", async (req: Request, res: Response) => {
//   const mappings = await getMappings(getCustomerId());
//   const formattedMappings = mappings.map((mapping) => {
//     const { nativeName, hubspotLabel, hubspotName, id, object } = mapping;
//     return {
//       id,
//       nativeName,
//       property: { name: hubspotName, label: hubspotLabel, object },
//     };
//   });
//   res.send(formattedMappings);
// });

const server = app.listen(PORT, function () {
  console.log(`App is listening on port ${PORT} !`);
});

process.on("SIGTERM", () => {
  console.info("SIGTERM signal received.");
  shutdown();
});

export default server;
