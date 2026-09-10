/**
 * Sample API Integration Test
 * Demonstrates testing patterns for API integrations
 */

import { authApi } from '@/features/auth/api/auth-api';
import { apiClient } from '@/core/client';

jest.mock('@/core/client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

const mockedClient = apiClient as jest.Mocked<typeof apiClient>;

describe('Auth API Integration', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('successfully logs in user', async () => {
      const mockResponse = {
        user: { id: '1', email: 'test@example.com' },
        token: 'mock-token',
      };

      // Mock axios call
      mockedClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await authApi.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
    });

    it('handles login errors', async () => {
      mockedClient.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        authApi.login({ email: 'test@example.com', password: 'wrong' })
      ).rejects.toThrow();
    });
  });
});
