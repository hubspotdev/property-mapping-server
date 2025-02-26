import { describe, it, expect, beforeEach, afterAll, beforeAll, jest } from '@jest/globals';
import request from 'supertest';
import { Mapping, Objects, Direction, PropertyType } from '@prisma/client';
import app from '../src/app';
import * as auth from '../src/auth';
import * as properties from '../src/properties';
import * as mappings from '../src/mappings';
import { getCustomerId } from '../src/utils/utils';

// Mock dependencies
jest.mock('../src/auth');
jest.mock('../src/properties');
jest.mock('../src/mappings');
jest.mock('../src/utils/logger');
jest.mock('@prisma/client', () => ({
  PropertyType: {
    String: 'String',
    Number: 'Number',
    Option: 'Option'
  },
  Objects: {
    Contact: 'Contact',
    Company: 'Company'
  },
  Direction: {
    toHubSpot: 'toHubSpot',
    fromHubSpot: 'fromHubSpot'
  }
}));
jest.mock('@hubspot/api-client');
jest.mock('../src/utils/utils');

describe('API Endpoints', () => {
  beforeAll(() => {
    (getCustomerId as jest.Mock).mockReturnValue('1');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication Endpoints', () => {
    describe('GET /api/install', () => {
    //   it('should return auth URL', async () => {
    //     const mockAuthUrl = 'https://app.hubspot.com/oauth/authorize';
    //     jest.spyOn(auth, 'authUrl', 'get').mockReturnValue(mockAuthUrl);

    //     const response = await request(app).get('/api/install');

    //     expect(response.status).toBe(200);
    //     expect(response.text).toBe(mockAuthUrl);
    //   });
    // });

    // describe('GET /oauth-callback', () => {
    //   it('should handle successful OAuth flow', async () => {
    //     const mockCode = 'valid-code';
    //     const mockAuthInfo = {
    //       customerId: '1',
    //       hsPortalId: 'test-portal',
    //       accessToken: 'test-access-token',
    //       refreshToken: 'test-refresh-token',
    //       expiresIn: 3600,
    //       expiresAt: new Date()
    //     };

    //     (auth.redeemCode as jest.MockedFunction<typeof auth.redeemCode>).mockResolvedValueOnce(mockAuthInfo);
    //     (properties.checkForPropertyOrGroup as jest.MockedFunction<typeof properties.checkForPropertyOrGroup>).mockResolvedValue(false);
    //     (properties.createPropertyGroupForContacts as jest.MockedFunction<typeof properties.createPropertyGroupForContacts>).mockResolvedValue(undefined);
    //     (properties.createPropertyGroupForCompanies as jest.MockedFunction<typeof properties.createPropertyGroupForCompanies>).mockResolvedValue(undefined);
    //     (properties.createRequiredContactProperty as jest.MockedFunction<typeof properties.createRequiredContactProperty>).mockResolvedValue(undefined);
    //     (properties.createContactIdProperty as jest.MockedFunction<typeof properties.createContactIdProperty>).mockResolvedValue(undefined);
    //     (properties.createCompanyIdProperty as jest.MockedFunction<typeof properties.createCompanyIdProperty>).mockResolvedValue(undefined);

    //     const response = await request(app)
    //       .get('/oauth-callback')
    //       .query({ code: mockCode });

    //     expect(response.status).toBe(302);
    //     expect(response.header.location).toBe('http://localhost:3000/');
    //     expect(auth.redeemCode).toHaveBeenCalledWith(mockCode);
    //   });

      it('should handle OAuth error', async () => {
        const mockCode = 'invalid-code';
        const mockError = new Error('OAuth Error');

        (auth.redeemCode as jest.MockedFunction<typeof auth.redeemCode>).mockRejectedValueOnce(mockError);

        const response = await request(app)
          .get('/oauth-callback')
          .query({ code: mockCode });

        expect(response.status).toBe(302);
        expect(response.header.location).toContain('errMessage=OAuth Error');
      });

      it('should handle missing code parameter', async () => {
        const response = await request(app).get('/oauth-callback');

        expect(response.status).toBe(302);
        expect(response.header.location).toContain('errMessage');
      });
    });
  });

  describe('Property Endpoints', () => {
    describe('GET /api/hubspot-properties', () => {
      it('should return properties when authenticated', async () => {
        const mockProperties = {
          contactProperties: [{ name: 'email', label: 'Email', type: 'string', groupName: 'contactinformation' }],
          companyProperties: [{ name: 'name', label: 'Company Name', type: 'string', groupName: 'companyinformation' }]
        };

        (properties.getHubSpotProperties as jest.MockedFunction<typeof properties.getHubSpotProperties>).mockResolvedValueOnce(mockProperties);

        const response = await request(app).get('/api/hubspot-properties');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockProperties);
      });

      it('should return auth URL when not authenticated', async () => {
        (properties.getHubSpotProperties as jest.MockedFunction<typeof properties.getHubSpotProperties>).mockResolvedValueOnce(undefined);
        jest.spyOn(auth, 'authUrl', 'get').mockReturnValue('https://app.hubspot.com/oauth/authorize');

        const response = await request(app).get('/api/hubspot-properties');

        expect(response.status).toBe(200);
        expect(response.text).toBe('https://app.hubspot.com/oauth/authorize');
      });

      it('should handle errors properly', async () => {
        (properties.getHubSpotProperties as jest.MockedFunction<typeof properties.getHubSpotProperties>).mockRejectedValueOnce(new Error('API Error'));

        const response = await request(app).get('/api/hubspot-properties');

        expect(response.status).toBe(500);
        expect(response.text).toBe('Internal Server Error');
      });
    });

    describe('GET /api/hubspot-properties-skip-cache', () => {
      it('should return fresh properties bypassing cache', async () => {
        const mockProperties = {
          contactProperties: [{ name: 'email', label: 'Email', type: 'string', groupName: 'contactinformation' }],
          companyProperties: [{ name: 'name', label: 'Company Name', type: 'string', groupName: 'companyinformation' }]
        };

        (properties.getHubSpotProperties as jest.MockedFunction<typeof properties.getHubSpotProperties>).mockResolvedValueOnce(mockProperties);

        const response = await request(app).get('/api/hubspot-properties-skip-cache');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockProperties);
        expect(properties.getHubSpotProperties).toHaveBeenCalledWith('1', true);
      });
    });

    describe('GET /api/native-properties', () => {
      it('should return native properties', async () => {
        const mockNativeProperties = [{
          id: 1,
          name: 'custom_field',
          label: 'Custom Field',
          type: PropertyType.String,
          object: Objects.Contact,
          customerId: '1',
          unique: false,
          modificationMetadata: {}
        }];

        (properties.getNativeProperties as jest.MockedFunction<typeof properties.getNativeProperties>).mockResolvedValueOnce(mockNativeProperties);

        const response = await request(app).get('/api/native-properties');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockNativeProperties);
      });
    });

    describe('POST /api/native-properties', () => {
      it('should create a new native property', async () => {
        const mockPropertyData = {
          name: 'new_field',
          label: 'New Field',
          type: PropertyType.String,
          object: Objects.Contact,
          customerId: '1',
          unique: false,
          modificationMetadata: {}
        };

        const mockCreatedProperty = { ...mockPropertyData, id: 1 };

        (properties.convertToPropertyForDB as jest.MockedFunction<typeof properties.convertToPropertyForDB>).mockReturnValueOnce(mockPropertyData);
        (properties.createNativeProperty as jest.MockedFunction<typeof properties.createNativeProperty>).mockResolvedValueOnce(mockCreatedProperty);

        const response = await request(app)
          .post('/api/native-properties')
          .send(mockPropertyData);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockCreatedProperty);
      });
    });

    describe('GET /api/native-properties-with-mappings', () => {
      it('should return properties with their mappings', async () => {
        const mockProperties = [{
          id: 1,
          name: 'custom_field',
          label: 'Custom Field',
          type: PropertyType.String,
          object: Objects.Contact,
          customerId: '1',
          unique: false,
          modificationMetadata: {}
        }];

        const mockMappings = [{
          id: 1,
          nativeName: 'custom_field',
          hubspotName: 'hs_field',
          hubspotLabel: 'HubSpot Field',
          object: Objects.Contact,
          customerId: '1',
          direction: Direction.toHubSpot,
          modificationMetadata: {}
        }];

        (properties.getNativeProperties as jest.MockedFunction<typeof properties.getNativeProperties>).mockResolvedValueOnce(mockProperties);
        (mappings.getMappings as jest.MockedFunction<typeof mappings.getMappings>).mockResolvedValueOnce(mockMappings);

        const response = await request(app).get('/api/native-properties-with-mappings');

        expect(response.status).toBe(200);
        expect(response.body).toEqual([
          {
            property: mockProperties[0],
            mapping: mockMappings[0]
          }
        ]);
      });

      it('should handle errors properly', async () => {
        (properties.getNativeProperties as jest.MockedFunction<typeof properties.getNativeProperties>).mockRejectedValueOnce(new Error('DB Error'));

        const response = await request(app).get('/api/native-properties-with-mappings');

        expect(response.status).toBe(500);
        expect(response.text).toBe('Internal Server Error');
      });
    });
  });

  describe('Mapping Endpoints', () => {
    describe('POST /api/mappings', () => {
      it('should create a new mapping', async () => {
        const mockMapping: Mapping = {
          id: 1,
          nativeName: 'custom_field',
          hubspotName: 'hs_field',
          hubspotLabel: 'HubSpot Field',
          object: Objects.Contact,
          customerId: '1',
          direction: Direction.toHubSpot,
          modificationMetadata: {}
        };

        (mappings.saveMapping as jest.MockedFunction<typeof mappings.saveMapping>).mockResolvedValueOnce(mockMapping);

        const response = await request(app)
          .post('/api/mappings')
          .send(mockMapping);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id', 1);
        expect(response.body).toMatchObject(mockMapping);
      });

      it('should handle validation errors', async () => {
        const invalidMapping = {};

        const response = await request(app)
          .post('/api/mappings')
          .send(invalidMapping);

        expect(response.status).toBe(500);
        expect(response.text).toBe('Error saving mapping');
      });
    });

    describe('GET /api/mappings', () => {
      it('should return formatted mappings', async () => {
        const mockMappings = [{
          id: 1,
          nativeName: 'custom_field',
          hubspotName: 'hs_field',
          hubspotLabel: 'HubSpot Field',
          object: Objects.Contact,
          customerId: '1',
          direction: Direction.toHubSpot,
          modificationMetadata: {}
        }];

        (mappings.getMappings as jest.MockedFunction<typeof mappings.getMappings>).mockResolvedValueOnce(mockMappings);

        const response = await request(app).get('/api/mappings');

        expect(response.status).toBe(200);
        expect(response.body).toEqual([
          {
            id: 1,
            nativeName: 'custom_field',
            property: {
              name: 'hs_field',
              label: 'HubSpot Field',
              object: Objects.Contact
            }
          }
        ]);
      });
    });
  });

  describe('Swagger Documentation', () => {
    describe('GET /api-docs', () => {
      it('should serve Swagger UI', async () => {
        const response = await request(app).get('/api-docs');
        expect(response.status).toBe(301); // Redirects to /api-docs/
      });

      it('should serve Swagger specification', async () => {
        const response = await request(app).get('/api-docs/swagger.json');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('openapi', '3.0.0');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown routes', async () => {
      const response = await request(app).get('/non-existent-route');
      expect(response.status).toBe(404);
    });

    it('should handle invalid JSON', async () => {
      const response = await request(app)
        .post('/api/mappings')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
    });
  });

  describe('Server Lifecycle', () => {
    it('should handle SIGTERM signal', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      process.emit('SIGTERM', 'SIGTERM');

      expect(mockExit).toHaveBeenCalledWith(0);
      mockExit.mockRestore();
    });
  });
});
