export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HubSpot Integration API',
      version: '1.0.0',
      description: 'API documentation for HubSpot Integration Service',
    },
    tags: [
      {
        name: 'Properties',
        description: 'Endpoints for managing HubSpot and native properties'
      },
      {
        name: 'Mappings',
        description: 'Endpoints for managing property mappings'
      }
    ],
    components: {
      schemas: {
        Mapping: {
          type: 'object',
          required: ['nativeName', 'hubspotName', 'hubspotLabel', 'object', 'customerId', 'direction'],
          properties: {
            id: {
              type: 'integer',
              description: 'Unique identifier for the mapping'
            },
            nativeName: {
              type: 'string',
              description: 'Name of the native property'
            },
            hubspotName: {
              type: 'string',
              description: 'Name of the HubSpot property'
            },
            hubspotLabel: {
              type: 'string',
              description: 'Display label for the HubSpot property'
            },
            object: {
              type: 'string',
              enum: ['Company', 'Contact'],
              description: 'Type of object this mapping applies to'
            },
            customerId: {
              type: 'string',
              description: 'ID of the customer this mapping belongs to'
            },
            direction: {
              type: 'string',
              enum: ['toHubSpot', 'toNative', 'biDirectional'],
              description: 'Direction of data flow for this mapping'
            },
            modificationMetadata: {
              type: 'object',
              description: 'Metadata about when and who modified this mapping'
            }
          }
        },
        Property: {
          type: 'object',
          required: ['name', 'label', 'type', 'object', 'customerId'],
          properties: {
            name: {
              type: 'string',
              description: 'Name of the property'
            },
            label: {
              type: 'string',
              description: 'Display label for the property'
            },
            type: {
              type: 'string',
              enum: ['String', 'Number', 'Option'],
              description: 'Data type of the property'
            },
            object: {
              type: 'string',
              enum: ['Company', 'Contact'],
              description: 'Type of object this property belongs to'
            },
            customerId: {
              type: 'string',
              description: 'ID of the customer this property belongs to'
            },
            unique: {
              type: 'boolean',
              description: 'Whether this property should have unique values'
            },
            modificationMetadata: {
              type: 'object',
              description: 'Metadata about when and who modified this property'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            }
          }
        }
      },
      responses: {
        InternalServerError: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        BadRequest: {
          description: 'Bad Request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/app.ts'], // path to your API routes
};
