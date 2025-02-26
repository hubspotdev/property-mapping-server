import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { jest } from '@jest/globals';

// Mock the entire PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockDeep<PrismaClient>()),
}));

// Set test environment
process.env.NODE_ENV = 'test';

// Silence console immediately
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
// Export something to make TypeScript happy
export const prismaMock = mockDeep<PrismaClient>();

