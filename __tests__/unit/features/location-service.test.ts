import axios from 'axios';
import { locationService } from '@/features/locations/infrastructure/api/service';
import { locationApi } from '@/features/locations/infrastructure/api/api';

jest.mock('@/features/locations/infrastructure/api/api', () => ({
  locationApi: {
    getByPinCode: jest.fn(),
  },
}));

const mockedLocationApi = locationApi as jest.Mocked<typeof locationApi>;

function buildValidPincodeResponse() {
  return {
    pincode: '600001',
    country: 'India',
    countryCode: 'IN',
    state: 'Tamil Nadu',
    stateCode: 'TN',
    district: 'Chennai',
    taluk: 'Chennai Central',
    localities: [{ locality: 'Fort', postOffice: 'Fort PO' }],
  };
}

describe('locationService.getByPinCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the mapped location on success', async () => {
    mockedLocationApi.getByPinCode.mockResolvedValue(buildValidPincodeResponse());

    const result = await locationService.getByPinCode('600001');

    expect(result).toEqual(
      expect.objectContaining({ pincode: '600001', state: 'Tamil Nadu', district: 'Chennai' })
    );
  });

  it('returns null for a canceled request', async () => {
    const cancelError = new axios.Cancel('canceled');
    mockedLocationApi.getByPinCode.mockRejectedValue(cancelError);

    const result = await locationService.getByPinCode('600001');

    expect(result).toBeNull();
  });

  it('returns null when the backend confirms the pincode does not exist (404)', async () => {
    const notFoundError = Object.assign(new Error('Not Found'), {
      isAxiosError: true,
      response: { status: 404 },
    });
    mockedLocationApi.getByPinCode.mockRejectedValue(notFoundError);

    const result = await locationService.getByPinCode('999999');

    expect(result).toBeNull();
  });

  // Regression: this previously caught every error indiscriminately and
  // returned null, making a genuine backend outage indistinguishable from
  // an invalid pincode — an address form had no way to tell the user "try
  // again" instead of "check what you typed."
  it('propagates a genuine failure (e.g. 500 or network error) instead of silently returning null', async () => {
    const serverError = Object.assign(new Error('Internal Server Error'), {
      isAxiosError: true,
      response: { status: 500 },
    });
    mockedLocationApi.getByPinCode.mockRejectedValue(serverError);

    await expect(locationService.getByPinCode('600001')).rejects.toThrow(
      'Internal Server Error'
    );
  });
});
