import { getMappings, deleteMapping, saveMapping } from '../src/mappings';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import prisma from '../prisma/seed';
import { Mapping } from '@prisma/client';
import handleError from '../src/utils/error';

// Mock the Prisma client
jest.mock('../prisma/seed', () => ({
  mapping: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock utils - this needs to be updated
jest.mock('../src/utils/utils', () => ({
  getCustomerId: jest.fn(() => 'cust_123')  // Provide a default mock implementation
}));

// Mock error handler
jest.mock('../src/utils/error', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('Mappings Database Client', () => {
  const mockMapping: Mapping = {
    id: 1,
    nativeName: 'test_mapping',
    hubspotName: 'test_hubspot',
    hubspotLabel: 'Test Label',
    object: 'Contact',
    direction: 'biDirectional',
    customerId: 'cust_123',
    modificationMetadata: {
      archivable: true,
      readOnlyValue: false,
      readOnlyDefinition: false,
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMappings', () => {
    it('should successfully fetch mappings by customer ID', async () => {
      const mockResults = [mockMapping];
      (prisma.mapping.findMany as jest.Mock).mockResolvedValue(mockResults);

      const result = await getMappings('cust_123');

      expect(result).toEqual(mockResults);
      expect(prisma.mapping.findMany).toHaveBeenCalledWith({
        select: {
          nativeName: true,
          hubspotLabel: true,
          hubspotName: true,
          id: true,
          object: true,
          direction: true,
          customerId: true,
          modificationMetadata: true,
        },
        where: {
          customerId: 'cust_123',
        },
      });
    });

    it('should handle empty results', async () => {
      (prisma.mapping.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getMappings('cust_123');

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const mockError = new Error('Database error');
      (prisma.mapping.findMany as jest.Mock).mockRejectedValue(mockError);

      const result = await getMappings('cust_123');

      expect(result).toBeUndefined();
      expect(handleError).toHaveBeenCalledWith(
        mockError,
        'There was an issue while querying property mappings '
      );
    });
  });

  describe('deleteMapping', () => {
    it('should successfully delete a mapping', async () => {
      (prisma.mapping.delete as jest.Mock).mockResolvedValue(mockMapping);

      const result = await deleteMapping(1);

      expect(result).toEqual(mockMapping);
      expect(prisma.mapping.delete).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });
    });

    it('should handle non-existent mapping', async () => {
      (prisma.mapping.delete as jest.Mock).mockResolvedValue(null);

      const result = await deleteMapping(999);

      expect(result).toBeNull();
    });

    it('should handle deletion errors', async () => {
      const mockError = new Error('Database error');
      (prisma.mapping.delete as jest.Mock).mockRejectedValue(mockError);

      const result = await deleteMapping(1);

      expect(result).toBeUndefined();
      expect(handleError).toHaveBeenCalledWith(
        mockError,
        'There was an issue while attempting to delete property mappings '
      );
    });
  });

  describe('saveMapping', () => {
    it('should successfully create a new mapping', async () => {
      (prisma.mapping.upsert as jest.Mock).mockImplementation((args) => Promise.resolve({
        ...mockMapping,
        nativeName: args.where.nativeName_object_customerId.nativeName,
        customerId: args.where.nativeName_object_customerId.customerId,
        object: args.where.nativeName_object_customerId.object,
      }));

      const result = await saveMapping(mockMapping);

      expect(result).toEqual(mockMapping);
      expect(prisma.mapping.upsert).toHaveBeenCalledWith({
        where: {
          nativeName_object_customerId: {
            nativeName: mockMapping.nativeName,
            customerId: 'cust_123',
            object: mockMapping.object,
          },
        },
        update: {
          hubspotLabel: mockMapping.hubspotLabel,
          hubspotName: mockMapping.hubspotName,
          direction: mockMapping.direction,
        },
        create: {
          hubspotLabel: mockMapping.hubspotLabel,
          hubspotName: mockMapping.hubspotName,
          nativeName: mockMapping.nativeName,
          object: mockMapping.object,
          customerId: 'cust_123',
          direction: mockMapping.direction,
          modificationMetadata: mockMapping.modificationMetadata,
        },
      });
    });

    it('should handle save errors', async () => {
      const mockError = new Error('Database error');
      (prisma.mapping.upsert as jest.Mock).mockRejectedValue(mockError);

      const result = await saveMapping(mockMapping);

      expect(result).toBeUndefined();
      expect(handleError).toHaveBeenCalledWith(
        mockError,
        'There was an issue while attempting to save the property mapping '
      );
    });
  });
});
