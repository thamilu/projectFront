import { getSellerOnboardingStatus } from '@/features/seller/services/seller-status.service';
import { apiClient } from '@/core/client';
import { AppError } from '@/core/http/errors';

jest.mock('@/core/client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

jest.mock('@/core/telemetry/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('seller-status.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return IDLE if user is not authenticated', async () => {
    const status = await getSellerOnboardingStatus(false);
    expect(status).toBe('IDLE');
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('should return SUCCESS if the profile is ACTIVE', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      data: {
        data: { status: 'ACTIVE' },
      },
    });

    const status = await getSellerOnboardingStatus(true);
    expect(status).toBe('SUCCESS');
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('should return PENDING if the profile is PENDING', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      data: {
        data: { status: 'PENDING' },
      },
    });

    const status = await getSellerOnboardingStatus(true);
    expect(status).toBe('PENDING');
  });

  it('should return IDLE if get profile throws 404 and profile does not exist', async () => {
    const error = new AppError(404, 'NOT_FOUND', 'Not found');
    (apiClient.get as jest.Mock)
      .mockRejectedValueOnce(error) // fetch profile
      .mockResolvedValueOnce({ data: { data: false } }); // profileExists

    const status = await getSellerOnboardingStatus(true);
    expect(status).toBe('IDLE');
    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

  it('should return PENDING if get profile throws 404 but profile exists', async () => {
    const error = new AppError(404, 'NOT_FOUND', 'Not found');
    (apiClient.get as jest.Mock)
      .mockRejectedValueOnce(error) // fetch profile
      .mockResolvedValueOnce({ data: { data: true } }); // profileExists

    const status = await getSellerOnboardingStatus(true);
    expect(status).toBe('PENDING');
  });
});
