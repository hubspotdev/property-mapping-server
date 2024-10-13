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
  convertToPropertyForDB
} from "./properties";
import shutdown from './utils/shutdown';
import {logger} from './utils/logger';
import { saveMapping, getMappings, deleteMapping } from "./mappings";
import { PORT, getCustomerId } from "./utils/utils";
import { Mapping, Properties } from "@prisma/client";
import handleError from './utils/error'



const app: Application = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/install", (req: Request, res: Response) => {
  res.send(authUrl);
});

app.get("/oauth-callback", async (req: Request, res: Response):Promise<void> => {
  const code = req.query.code;

  if (code) {
    try {
      const authInfo = await redeemCode(code.toString());
      if(authInfo){
      const accessToken = authInfo.accessToken;

      logger.info({type: 'HubSpot', logMessage: {message:'OAuth complete! Setting up integration properties...'}})
      logger.info({type: 'HubSpot', logMessage: {message:'Creating contact property group...'}})
      await createPropertyGroupForContacts(accessToken);

      logger.info({type: 'HubSpot', logMessage: {message:'Creating company property group...'}})
      await createPropertyGroupForCompanies(accessToken);

      logger.info({type: 'HubSpot', logMessage: {message:'Creating required contact property...'}})
      await createRequiredContactProperty(accessToken);

      logger.info({type: 'HubSpot', logMessage: {message:'Creating custom contact ID property...'}})
      await createContactIdProperty(accessToken);

      logger.info({type: 'HubSpot', logMessage: {message:'Creating custom company ID property...'}})
      await createCompanyIdProperty(accessToken);

      res.redirect(`http://localhost:${PORT - 1}/`);
      }
    } catch (error: any) {
      handleError(error, 'There was an issue in the Oauth callback ')
      res.redirect(`/?errMessage=${error.message}`);
    }
  }
})

app.get("/api/hubspot-properties", async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId: string = getCustomerId();
    const properties = await getHubSpotProperties(customerId, false);
    res.send(properties);
  } catch (error) {
    handleError(error, 'There was an issue getting Hubspot properties ')
    res.status(500).send('Internal Server Error');
  }})
// app.get("/api/hubspot-properties-skip-cache", async (req: Request, res: Response) => {
//   const customerId = getCustomerId();
//   const properties = await getHubSpotProperties(customerId, true);
//   res.send(properties);
// });



// app.get("/api/native-properties/", async (req: Request, res: Response) => {
//   const customerId = getCustomerId();
//   const properties = await getNativeProperties(customerId);
//   res.send(properties);
// });

app.post("/api/native-properties/", async (req: Request, res: Response) =>{
  const {body} = req
  console.log('Raw Body', body)
  const customerId = getCustomerId();
  const propertyData = convertToPropertyForDB(body,customerId)
  console.log('Create Properties Request', propertyData)
  const createPropertyRespone = await createNativeProperty(customerId,propertyData)
  res.send(createPropertyRespone)
})


app.get(
  "/api/native-properties-with-mappings",
  async (req: Request, res: Response):Promise<void> => {
    try {
      const customerId = getCustomerId();
      const properties: Properties[] | undefined = await getNativeProperties(customerId);
      const mappings: Mapping[] | undefined = await getMappings(customerId);
      if(mappings && properties){
      const propertiesWithMappings = properties.map((property) => {
        const matchedMapping = mappings.find((mapping) => mapping.nativeName === property.name);
        return { property, mapping: matchedMapping };
      });
      res.send(propertiesWithMappings);
    }
    } catch (error) {
      handleError(error, 'There was an issue getting the native properties with mappings ')
      res.status(500).send('Internal Server Error');
    }
  })

app.post("/api/mappings", async (req: Request, res: Response): Promise<void> => {
  try{
    const response = await saveMapping(req.body as Mapping);
    res.send(response);
  } catch(error) {
    handleError(error, 'There was an issue while saving property mappings ')
    res.status(500).send('Error saving mapping')
  }
});

app.delete("/api/mappings/:mappingId", async (req: Request, res: Response): Promise<void> => {
  const mappingToDelete = req.params.mappingId;
  const mappingId = parseInt(mappingToDelete);
  if (!mappingId ) {
    res.status(400).send("Invalid mapping Id format");
  }
  try {
    const deleteMappingResult = await deleteMapping(mappingId);
    res.send(deleteMappingResult);
  } catch(error) {
    handleError(error, 'There was an issue while attempting to delete the mapping ')
  }
});

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

process.on('SIGTERM', () => {
  console.info('SIGTERM signal received.');
  shutdown()
});

export default server
