import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

import { PrismaService } from './prisma.service';

// Mock the entire PrismaClient
export const mockPrisma = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaService>;

// Utility function to reset mock before tests
export const resetMockPrisma = () => {
  mockReset(mockPrisma);
};
