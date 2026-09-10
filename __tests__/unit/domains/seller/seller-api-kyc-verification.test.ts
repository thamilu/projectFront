import { apiClient } from '@/core/client';
import { sellerApi } from '@/domains/seller/infrastructure/api/seller-api';

jest.mock('@/core/client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

const mockPost = apiClient.post as jest.Mock;

describe('sellerApi KYC verification — must fail closed, never fake a pass', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Regression: verifyPan/verifyGstin/verifyAadhar previously caught a 404
  // from the real verification endpoint and silently fell back to a
  // client-side regex format check (with an artificial 800ms delay to look
  // like a real network call), returning `{ verified: true }` for any
  // correctly-formatted-but-never-actually-verified government ID number.
  // A KYC gate that can be satisfied by merely typing a well-formed string
  // is not a KYC gate. These must now propagate the failure instead.

  it('verifyPan propagates a 404 instead of falling back to a fake regex pass', async () => {
    const notFound = Object.assign(new Error('Not Found'), {
      response: { status: 404 },
      statusCode: 404,
    });
    mockPost.mockRejectedValue(notFound);

    await expect(sellerApi.verifyPan('ABCDE1234F')).rejects.toBe(notFound);
  });

  it('verifyGstin propagates a 404 instead of falling back to a fake regex pass', async () => {
    const notFound = Object.assign(new Error('Not Found'), {
      response: { status: 404 },
      statusCode: 404,
    });
    mockPost.mockRejectedValue(notFound);

    await expect(sellerApi.verifyGstin('22AAAAA0000A1Z5')).rejects.toBe(notFound);
  });

  it('verifyAadhar propagates a 404 instead of falling back to a fake regex pass', async () => {
    const notFound = Object.assign(new Error('Not Found'), {
      response: { status: 404 },
      statusCode: 404,
    });
    mockPost.mockRejectedValue(notFound);

    await expect(sellerApi.verifyAadhar('123456789012')).rejects.toBe(notFound);
  });

  it('verifyPan returns the real backend verification result on success', async () => {
    mockPost.mockResolvedValue({ data: { verified: true, message: 'PAN verified' } });

    const result = await sellerApi.verifyPan('ABCDE1234F');

    expect(result).toEqual({ verified: true, message: 'PAN verified' });
    expect(mockPost).toHaveBeenCalledWith(
      '/api/v1/sellers/verify/pan',
      { panNumber: 'ABCDE1234F' },
      expect.objectContaining({ headers: { 'X-Bypass-Toast': 'true' } })
    );
  });
});
