export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HubSpot Integration API',
      version: '1.0.0',
      description: 'API documentation for HubSpot Integration Service',
    },
    components: {
      schemas: {
        Mapping: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nativeName: { type: 'string' },
            hubspotName: { type: 'string' },
            hubspotLabel: { type: 'string' },
            object: { type: 'string', enum: ['Company', 'Contact'] },
            customerId: { type: 'string' },
            direction: { type: 'string', enum: ['toHubSpot', 'toNative', 'biDirectional'] },
            modificationMetadata: { type: 'object' }
          }
        },
        Property: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            label: { type: 'string' },
            type: { type: 'string', enum: ['String', 'Number', 'Option'] },
            object: { type: 'string', enum: ['Company', 'Contact'] },
            customerId: { type: 'string' },
            unique: { type: 'boolean' },
            modificationMetadata: { type: 'object' }
          }
        }
      }
    }
  },
  apis: ['./src/app.ts'], // path to your API routes
};
