import "dotenv/config";
import express, { Application, Request, Response } from "express";
import {
  getHubSpotProperties,
  getNativeProperties,
  createNativeProperty,
  convertToPropertyForDB,
} from "./properties";
import shutdown from "./utils/shutdown";
import { logger } from "./utils/logger";
import { saveMapping, getMappings, deleteMapping } from "./mappings";
import { PORT, getCustomerId } from "./utils/utils";
import { Mapping, Properties } from "@prisma/client";
import handleError from "./utils/error";
import { PropertyUpdate } from '@hubspot/api-client/lib/codegen/crm/properties';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { swaggerOptions } from './config/swagger';

const app: Application = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /api/hubspot-properties:
 *   get:
 *     summary: Get HubSpot properties
 *     tags: [Properties]
 *     responses:
 *       200:
 *         description: List of HubSpot properties
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contactProperties:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Property'
 *                 companyProperties:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Property'
 *       302:
 *         description: Redirect to install page if properties not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
app.get(
  "/api/hubspot-properties",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const customerId: string = getCustomerId();
      const properties = await getHubSpotProperties(customerId, false);

      if (!properties) {
        logger.info({
          type: "Auth",
          context: "OAuth Flow",
          logMessage: {
            message: "No OAuth authorization found. Redirecting to install page."
          }
        });
        res.redirect("http://localhost:3001/install");
        return;
      }
      res.send(properties);
    } catch (error) {
      handleError(
        error,
        "There was an issue while getting HubSpot properties",
        false
      );
      res.status(500).json({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  }
);

/**
 * @swagger
 * /api/hubspot-properties-skip-cache:
 *   get:
 *     summary: Get HubSpot properties bypassing cache
 *     tags: [Properties]
 *     responses:
 *       200:
 *         description: List of HubSpot properties
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contactProperties:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Property'
 *                 companyProperties:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Property'
 *       302:
 *         description: Redirect to install page if properties not found
 *       500:
 *         description: Internal Server Error
 */
app.get("/api/hubspot-properties-skip-cache", async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = getCustomerId();
    const properties = await getHubSpotProperties(customerId, true);
    if (!properties) {
      res.redirect("http://localhost:3001/install");
      return;
    }
    res.send(properties);
  } catch (error) {
    handleError(
      error,
      "There was an issue while getting HubSpot properties (skip cache)",
      false
    );
    res.status(500).send("Internal Server Error");
  }
});

/**
 * @swagger
 * /api/native-properties:
 *   post:
 *     summary: Create a new native property
 *     tags: [Properties]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Property'
 *     responses:
 *       200:
 *         description: Created property
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Property'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
app.post("/api/native-properties", async (req: Request, res: Response) => {
  try {
    const { body } = req;
    const customerId = getCustomerId();
    const propertyData = convertToPropertyForDB(body, customerId);
    const createPropertyResponse = await createNativeProperty(
      customerId,
      propertyData,
    );
    res.send(createPropertyResponse);
  } catch (error) {
    handleError(
      error,
      "There was an issue while creating native property",
      false
    );
    res.status(500).send("Internal Server Error");
  }
});

/**
 * @swagger
 * /api/native-properties-with-mappings:
 *   get:
 *     summary: Get native properties with their mappings
 *     tags: [Properties]
 *     responses:
 *       200:
 *         description: List of native properties with their mappings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   property:
 *                     $ref: '#/components/schemas/Property'
 *                   mapping:
 *                     $ref: '#/components/schemas/Mapping'
 *       500:
 *         description: Internal Server Error
 */
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
        "There was an issue while getting native properties with mappings",
        false
      );
      res.status(500).send("Internal Server Error");
    }
  },
);

/**
 * @swagger
 * /api/mappings:
 *   post:
 *     summary: Create a new mapping
 *     tags: [Mappings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Mapping'
 *     responses:
 *       200:
 *         description: Created mapping
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Mapping'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
app.post(
  "/api/mappings",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const response = await saveMapping(req.body as Mapping);
      res.send(response);
    } catch (error) {
      handleError(
        error,
        "There was an issue while saving property mappings",
        false
      );
      res.status(500).send("Error saving mapping");
    }
  },
);

/**
 * @swagger
 * /api/mappings/{mappingId}:
 *   delete:
 *     summary: Delete a mapping
 *     tags: [Mappings]
 *     parameters:
 *       - in: path
 *         name: mappingId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the mapping to delete
 *     responses:
 *       200:
 *         description: Mapping deleted successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
app.delete(
  "/api/mappings/:mappingId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const mappingToDelete = req.params.mappingId;
      const mappingId = parseInt(mappingToDelete);

      if (!mappingId) {
        handleError(
          new Error("Invalid mapping ID format"),
          "Invalid mapping ID format",
          false
        );
        res.status(400).send("Invalid mapping ID format");
        return;
      }

      const deleteMappingResult = await deleteMapping(mappingId);
      res.send(deleteMappingResult);
    } catch (error) {
      handleError(
        error,
        "There was an issue while attempting to delete the mapping",
        false
      );
      res.status(500).send("Internal Server Error");
    }
  },
);

/**
 * @swagger
 * /api/mappings:
 *   get:
 *     summary: Get all mappings for the current customer
 *     tags: [Mappings]
 *     responses:
 *       200:
 *         description: List of formatted mappings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: The mapping ID
 *                   nativeName:
 *                     type: string
 *                     description: The native property name
 *                   property:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         description: The HubSpot property name
 *                       label:
 *                         type: string
 *                         description: The HubSpot property label
 *                       object:
 *                         type: string
 *                         enum: [Contact, Company]
 *                         description: The object type
 *       500:
 *         description: Internal Server Error
 */
app.get("/api/mappings", async (req: Request, res: Response) => {
  try {
    const mappings = await getMappings(getCustomerId());
    const formattedMappings = mappings?.map((mapping) => {
      const { nativeName, hubspotLabel, hubspotName, id, object } = mapping;
      return {
        id,
        nativeName,
        property: { name: hubspotName, label: hubspotLabel, object },
      };
    });
    res.send(formattedMappings);
  } catch (error) {
    handleError(
      error,
      "There was an issue while getting mappings",
      false
    );
    res.status(500).send("Internal Server Error");
  }
});

const server = app.listen(PORT, function () {
  logger.info({
    type: "Server",
    logMessage: { message: `App is listening on port ${PORT}!` }
  });
});

process.on("SIGTERM", () => {
  logger.info({
    type: "Server",
    logMessage: { message: "SIGTERM signal received." }
  });
  shutdown();
});

export default server;
