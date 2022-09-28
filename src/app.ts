import "dotenv/config";
import express, { Application, Request, Response } from "express";

import { authUrl, redeemCode } from "./auth";
import { getHubSpotProperties, getNativeProperties } from "./properties";
import { saveMappings, getMappings, deleteMapping } from "./mappings";
import { PORT, getCustomerId } from "./utils";
import { Mapping } from "default";

const app: Application = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/install", (req: Request, res: Response) => {
  res.redirect(authUrl);
});

app.get("/oauth-callback", async (req: Request, res: Response) => {
  const code = req.query.code;

  if (code) {
    try {
      const authInfo = await redeemCode(code.toString());
      res.redirect(`/`);
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

app.post("/api/mappings", async (req: Request, res: Response) => {
  const response = await saveMappings(req.body as Mapping[]);
  res.send(response);
});

app.delete("/api/mappings/:mappingId", async (req: Request, res: Response) => {
  const mappingToDelete = req.params.mappingId;
  const mappingId = parseInt(mappingToDelete);

  const deleteMappingResult = await deleteMapping(mappingId);
  res.send(deleteMappingResult);
});

app.get("/api/mappings", async (req: Request, res: Response) => {
  const mappings = await getMappings();
  const formattedMappings = mappings.map((mapping) => {
    const { name, hubspotLabel, hubspotName, id, object } = mapping;
    return {
      id,
      name,
      property: { name: hubspotName, label: hubspotLabel, object },
    };
  });
  res.send(formattedMappings);
});

app.listen(PORT, function () {
  console.log(`App is listening on port ${PORT} !`);
});
