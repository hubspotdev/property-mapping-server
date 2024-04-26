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
  createCompanyIdProperty
} from "./properties";
import { saveMapping, getMappings, deleteMapping } from "./mappings";
import { PORT, getCustomerId } from "./utils";
import { Mapping, Properties } from "@prisma/client";

const app: Application = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/install", (req: Request, res: Response) => {
  res.send(authUrl);
});

app.get("/oauth-callback", async (req: Request, res: Response) => {
  const code = req.query.code;

  if (code) {
    try {
      const authInfo = await redeemCode(code.toString());
      const accessToken = authInfo.accessToken;
      createPropertyGroupForContacts(accessToken);
      createPropertyGroupForCompanies(accessToken)
      createRequiredContactProperty(accessToken);
      createContactIdProperty(accessToken)
      createCompanyIdProperty(accessToken)
      res.redirect(`http://localhost:${PORT - 1}/`);
    } catch (error: any) {
      res.redirect(`/?errMessage=${error.message}`);
    }
  }
});

app.get("/api/hubspot-properties", async (req: Request, res: Response) => {
  const customerId = getCustomerId();
  const properties = await getHubSpotProperties(customerId);
  res.send(properties);
});

app.get("/api/native-properties/", async (req: Request, res: Response) => {
  const customerId = getCustomerId();
  const properties = await getNativeProperties(customerId);
  res.send(properties);
});

app.post("/api/native-properties/", async (req: Request, res: Response) =>{
  const {body} = req
  console.log(body)
  res.send("ok")
})


app.get(
  "/api/native-properties-with-mappings",
  async (req: Request, res: Response) => {
    const customerId = getCustomerId();
    const properties: Properties[] = await getNativeProperties(customerId);
    const mappings: Mapping[] = await getMappings(customerId);
    const propertiesWithMappings = properties.map((property) => {
      const matchedMapping = mappings.find(
        (mapping) => mapping.nativeName == property.name
      );
      return { property, mapping: matchedMapping };
    });
    res.send(propertiesWithMappings);
  }
);

app.post("/api/mappings", async (req: Request, res: Response) => {
  const response = await saveMapping(req.body as Mapping);
  console.log("mapping save response", response);
  if (response instanceof Error) {
    res.status(500).send("Unkown Error");
  }
  res.send(response);
});

app.delete("/api/mappings/:mappingId", async (req: Request, res: Response) => {
  const mappingToDelete = req.params.mappingId;
  const mappingId = parseInt(mappingToDelete);
  if (!mappingId ) {
    res.status(400).send("Invalid mapping Id format");
  }

  const deleteMappingResult = await deleteMapping(mappingId);
  res.send(deleteMappingResult);
});

app.get("/api/mappings", async (req: Request, res: Response) => {
  const mappings = await getMappings(getCustomerId());
  const formattedMappings = mappings.map((mapping) => {
    const { nativeName, hubspotLabel, hubspotName, id, object } = mapping;
    return {
      id,
      nativeName,
      property: { name: hubspotName, label: hubspotLabel, object },
    };
  });
  res.send(formattedMappings);
});

app.listen(PORT, function () {
  console.log(`App is listening on port ${PORT} !`);
});
