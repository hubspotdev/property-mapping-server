import request from 'supertest';
import app from '../src/app';
import { authUrl, redeemCode } from '../src/auth';
import * as properties from '../src/properties';
import * as mappings from '../src/mappings';
import * as utils from '../src/utils/utils';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { afterAll, beforeAll } from '@jest/globals';

const Objects = {
  Contact: 'Contact',
  Company: 'Company'
} as const;

const PropertyType = {
  String: 'String',
  Number: 'Number',
  Option: 'Option'
} as const;

const Direction = {
  toHubSpot: 'toHubSpot',
  toNative: 'toNative',
  biDirectional: 'biDirectional'
} as const;

// Mock the modules
jest.mock('../src/auth', () => ({
  authUrl: 'mock-auth-url',
  redeemCode: jest.fn()
}));

jest.mock('../src/properties', () => ({
  checkForPropertyOrGroup: jest.fn(),
  getHubSpotProperties: jest.fn(),
  convertToPropertyForDB: jest.fn(),
  createNativeProperty: jest.fn(),
  createPropertyGroupForContacts: jest.fn().mockImplementation(async () => {
    // Function returns void
  })
}));

jest.mock('../src/mappings', () => ({
  saveMapping: jest.fn(),
  deleteMapping: jest.fn()
}));

jest.mock('../src/utils/utils', () => ({
  getCustomerId: jest.fn()
}));

jest.mock('../src/utils/logger');

describe('API Endpoints', () => {
  // Setup and teardown
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });


  describe('GET /api/hubspot-properties', () => {
    it('should return hubspot properties', async () => {
      const mockProperties = {
        contactProperties: [{ name: 'test-prop' }],
        companyProperties: [{ name: 'test-company-prop' }]
      };

      (utils.getCustomerId as jest.MockedFunction<typeof utils.getCustomerId>).mockReturnValue('test-customer');
      (properties.getHubSpotProperties as jest.MockedFunction<typeof properties.getHubSpotProperties>).mockResolvedValue(mockProperties);

      const response = await request(app).get('/api/hubspot-properties');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProperties);
    });

    it('should handle errors', async () => {
      (utils.getCustomerId as jest.MockedFunction<typeof utils.getCustomerId>).mockReturnValue('test-customer');
      (properties.getHubSpotProperties as jest.MockedFunction<typeof properties.getHubSpotProperties>).mockRejectedValue(new Error('Test error'));

      const response = await request(app).get('/api/hubspot-properties');

      expect(response.status).toBe(500);
      expect(response.text).toBe('{"error":"Internal Server Error","message":"Test error"}');
    });
  });

  describe('POST /api/native-properties', () => {
    it('should create a native property', async () => {
      const mockProperty = {
        object: Objects.Contact,
        name: 'test-prop',
        customerId: 'test-customer',
        label: 'Test Property',
        type: PropertyType.String,
        unique: false,
        modificationMetadata: {}
      };

      const mockCustomerId = 'test-customer';

      (utils.getCustomerId as jest.MockedFunction<typeof utils.getCustomerId>).mockReturnValue(mockCustomerId);
      (properties.convertToPropertyForDB as jest.MockedFunction<typeof properties.convertToPropertyForDB>).mockReturnValue(mockProperty);
      (properties.createNativeProperty as jest.MockedFunction<typeof properties.createNativeProperty>).mockResolvedValue(mockProperty);

      const response = await request(app)
        .post('/api/native-properties/')
        .send(mockProperty);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProperty);
    });
  });

  describe('POST /api/mappings', () => {
    it('should create a new mapping', async () => {
      const mockMapping = {
        object: Objects.Contact,
        customerId: 'test-customer',
        modificationMetadata: {},
        id: 1,
        nativeName: 'test',
        hubspotName: 'test',
        hubspotLabel: 'Test Label',
        direction: Direction.biDirectional
      };

      (mappings.saveMapping as jest.MockedFunction<typeof mappings.saveMapping>).mockResolvedValue(mockMapping);

      const response = await request(app)
        .post('/api/mappings')
        .send(mockMapping);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockMapping);
    });

    it('should handle errors', async () => {
      (mappings.saveMapping as jest.MockedFunction<typeof mappings.saveMapping>).mockRejectedValue(new Error('Test error'));

      const response = await request(app)
        .post('/api/mappings')
        .send({});

      expect(response.status).toBe(500);
      expect(response.text).toBe('Error saving mapping');
    });
  });

  describe('DELETE /api/mappings/:mappingId', () => {
    it('should delete a mapping', async () => {
      const mockMappingId = 1;
      const mockDeleteResult = {
        object: Objects.Contact,
        customerId: 'test-customer',
        modificationMetadata: {},
        id: mockMappingId,
        nativeName: 'test',
        hubspotName: 'test',
        hubspotLabel: 'Test Label',
        direction: Direction.biDirectional
      };

      (mappings.deleteMapping as jest.MockedFunction<typeof mappings.deleteMapping>).mockResolvedValue(mockDeleteResult);

      const response = await request(app)
        .delete(`/api/mappings/${mockMappingId}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockDeleteResult);
    });

    it('should handle invalid mapping ID', async () => {
      const response = await request(app)
        .delete('/api/mappings/invalid');

      expect(response.status).toBe(400);
      expect(response.text).toBe('Invalid mapping ID format');
    });
  });
});
