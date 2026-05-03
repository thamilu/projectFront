/**
 * Sample API Integration Test
 * Demonstrates testing patterns for API integrations
 */

import { authApi } from '@/features/auth/api/auth-api';

describe('Auth API Integration', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('successfully logs in user', async () => {
      const mockResponse = {
        data: {
          data: {
            user: { id: '1', email: 'test@example.com' },
            token: 'mock-token',
          },
        },
      };

      // Mock axios call
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse.data,
      } as Response);

      const result = await authApi.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
    });

    it('handles login errors', async () => {
      jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

      await expect(
        authApi.login({ email: 'test@example.com', password: 'wrong' })
      ).rejects.toThrow();
    });
  });
});
