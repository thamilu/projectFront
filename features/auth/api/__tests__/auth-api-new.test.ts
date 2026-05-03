/// <reference types="jest" />
import { authApi } from '../auth-api-new';
import apiClient from '@/lib/axios';

jest.mock('@/lib/axios');

const mockedClient = apiClient as jest.Mocked<typeof apiClient>;

describe('authApi normalization', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('normalizes wrapped register response to simplified shape', async () => {
    const wrapped = {
      success: true,
      data: {
        token: 'abc123',
        userId: 10,
        username: 'jdoe',
        email: 'jdoe@example.com',
        role: 'CUSTOMER',
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedClient.post.mockResolvedValue({ data: wrapped } as any);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await authApi.register({} as any);

    expect(result.token).toBe('abc123');
    expect(result.user).toBeDefined();
    expect(result.user?.username).toBe('jdoe');
  });

  it('returns simplified shape when backend already returns token+user', async () => {
    const simple = {
      token: 'xyz789',
      user: {
        id: 11,
        username: 'janed',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'CUSTOMER',
        active: true,
        createdAt: new Date().toISOString(),
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedClient.post.mockResolvedValue({ data: simple } as any);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await authApi.register({} as any);

    expect(result.token).toBe('xyz789');
    expect(result.user).toBeDefined();
    expect(result.user?.username).toBe('janed');
  });
});
