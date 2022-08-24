import "dotenv/config";
import express, { Application, Request, Response } from "express";
import axios, { AxiosRequestConfig, Axios, AxiosRequestHeaders } from "axios";
import { Authorization, PrismaClient, Objects } from "@prisma/client";
import qs from "qs";
import * as hubspot from "@hubspot/api-client";
import { BatchReadInputSimplePublicObjectId } from "@hubspot/api-client/lib/codegen/crm/objects";

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

const prisma = new PrismaClient();
const CLIENT_ID: string = process.env.CLIENT_ID || "CLIENT_ID required";
const CLIENT_SECRET: string =
  process.env.CLIENT_SECRET || "CLIENT_SECRET required";

interface ExchangeProof {
  grant_type: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  code?: string;
  refresh_token?: string;
}

const app: Application = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT: number = 3001;
const SCOPES = [
  "crm.schemas.companies.write",
  "crm.schemas.contacts.write",

  "crm.schemas.companies.read",
  "crm.schemas.contacts.read",
];

const REDIRECT_URI: string = `http://localhost:${PORT}/oauth-callback`;
const authUrl =
  "https://app.hubspot.com/oauth/authorize" +
  `?client_id=${encodeURIComponent(CLIENT_ID)}` + // app's client ID
  `&scope=${encodeURIComponent(SCOPES.join(" "))}` + // scopes being requested by the app
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`; // where to send the user after the consent page

app.get("/toto", (req: Request, res: Response) => {
  res.send("Hello toto");
});

app.get("/install", (req: Request, res: Response) => {
  console.log("");
  console.log("=== Initiating OAuth 2.0 flow with HubSpot ===");
  console.log("");
  console.log("===> Step 1: Redirecting user to your app's OAuth URL");
  res.redirect(authUrl);
  console.log("===> Step 2: User is being prompted for consent by HubSpot");
});

app.get("/oauth-callback", async (req: Request, res: Response) => {
  console.log("===> Step 3: Handling the request sent by the server");

  // Received a user authorization code, so now combine that with the other
  // required values and exchange both for an access token and a refresh token
  if (req.query.code) {
    console.log("       > Received an authorization token");

    const authCodeProof: ExchangeProof = {
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      code: req.query.code.toString(),
    };

    // Step 4
    // Exchange the authorization code for an access token and refresh token
    console.log(
      "===> Step 4: Exchanging authorization code for an access token and refresh token"
    );
    const token = await exchangeForTokens(authCodeProof);
    if (token.message) {
      return res.redirect(`/error?msg=${token.message}`);
    }

    // Once the tokens have been retrieved, use them to make a query
    // to the HubSpot API
    res.redirect(`/`);
  }
});

app.get("/api/hubspot-properties", async (req: Request, res: Response) => {
  const properties = await getHubSpotProperties("1");
  res.send(properties);
});

app.get("/api/native-properties/", async (req: Request, res: Response) => {
  const properties = await getNativeProperties("1");
  res.send(properties);
});

app.post("/api/mappings", async (req: Request, res: Response) => {
  console.log(req.headers);
  console.log(req.body);
  const response = await saveMappings(req.body as Mapping[]);
  console.log("save mappings response", response);
  res.send(response);
});

app.get("/api/mappings", async (req: Request, res: Response) => {
  const mappings = await getMappings();
  const formattedMappings = mappings.map((mapping) => {
    const { name, hubspotLabel, hubspotName } = mapping;
    return { name, property: { name: hubspotName, label: hubspotLabel } };
  });
  res.send(formattedMappings);
});

const getMappings = async () => {
  const mappings = await prisma.mapping.findMany({
    select: {
      name: true,
      hubspotLabel: true,
      hubspotName: true,
    },
  });
  return mappings;
};

const saveMappings = async (mappingsInput: Mapping[]) => {
  console.log(mappingsInput);

  if (mappingsInput.length > 0) {
    const mappingResults = mappingsInput.map(async (maybeMapping) => {
      console.log("maybemapping", maybeMapping);

      const mappingName = maybeMapping.name;
      const hubspotInfo = maybeMapping.property;
      const object = maybeMapping.property.object || "Contact";
      const getCustomerId = () => "1"; // faking this because building an account provisiong/login system is out of scope
      const customerId = getCustomerId();
      console.log("mapping name", mappingName);
      console.log("hubspotINfo", hubspotInfo);
      const mappingResult = await prisma.mapping.upsert({
        where: {
          name_object_customerId: {
            name: mappingName,
            customerId: customerId,
            object: object,
          },
        },
        update: {
          hubspotLabel: hubspotInfo.label,
          hubspotName: hubspotInfo.name,
        },
        create: {
          hubspotLabel: hubspotInfo.label,
          hubspotName: hubspotInfo.name,
          name: mappingName,
          object: object,
          customerId: customerId,
        },
      });

      return await mappingResult;
    });

    return await Promise.all(mappingResults);
  }
  return null;
};

const getNativeProperties = async (customerId: string) => {
  const properties = await prisma.properties.findMany({
    select: {
      name: true,
      label: true,
      type: true,
      object: true,
    },
    where: {
      customerId,
    },
  });
  return properties;
};

const getHubSpotProperties = async (customerId: string) => {
  const accessToken = await getAccessToken(customerId);
  console.log(accessToken);

  const hubspotClient = new hubspot.Client({ accessToken });

  try {
    const contactProperties = (
      await hubspotClient.crm.properties.coreApi.getAll("contacts")
    ).results;
    const companyProperties = (
      await hubspotClient.crm.properties.coreApi.getAll("companies")
    ).results;

    return {
      contactProperties,
      companyProperties,
    };
  } catch (error) {
    console.error(error);
    return error;
  }
};

const getAccessToken = async (customerId: string) => {
  try {
    const currentCreds = (await prisma.authorization.findFirst({
      select: {
        accessToken: true,
        expiresAt: true,
        refreshToken: true,
      },
      where: {
        customerId,
      },
    })) as Authorization;
    if (currentCreds?.expiresAt && currentCreds?.expiresAt > new Date()) {
      return currentCreds?.accessToken;
    } else {
      const updatedCreds = exchangeForTokens({
        grant_type: "refresh_token",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        refresh_token: currentCreds?.refreshToken,
      });
      return updatedCreds;
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const getExpiresAt = (expiresIn: number): Date => {
  const now = new Date();
  console.log(now);
  return new Date(now.getTime() + expiresIn * 1000);
};

const exchangeForTokens = async (exchangeProof: ExchangeProof) => {
  const config: AxiosRequestConfig = {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  };

  try {
    const responseBody = await axios.post(
      "https://api.hubapi.com/oauth/v1/token",
      qs.stringify(exchangeProof),
      config
    );
    // Usually, this token data should be persisted in a database and associated with
    // a user identity.
    const tokens = responseBody.data;
    const accessToken: string = tokens.access_token;
    const refreshToken: string = tokens.refresh_token;
    const expiresIn: number = tokens.expires_in;
    const expiresAt: Date = getExpiresAt(expiresIn);
    const tokenInfo = await prisma.authorization.upsert({
      where: {
        customerId: "1",
      },
      update: {
        refreshToken,
        accessToken,
        expiresIn,
        expiresAt,
        hsPortalId: "589323",
      },
      create: {
        refreshToken,
        accessToken,
        expiresIn,
        expiresAt,
        hsPortalId: "589323",
        customerId: "1",
      },
    });

    console.log(tokenInfo);
    console.log("       > Received an access token and refresh token");
    return tokens.access_token;
  } catch (e) {
    console.error(
      `       > Error exchanging ${exchangeProof.grant_type} for access token`
    );
    console.error(e);
    return e;
  }
};

app.listen(PORT, function () {
  console.log(`App is listening on port ${PORT} !`);
});
