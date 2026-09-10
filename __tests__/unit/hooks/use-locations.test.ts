import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLocations } from '@/features/locations/hooks/use-locations';
import { locationService } from '@/features/locations/infrastructure/api';

// use-locations.ts pulls in `@/shared/hooks` (for useDebounce), whose barrel
// transitively imports next-auth/react — unrelated to this hook's own
// logic, but jest's default transform can't parse it without this mock.
jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
}));

jest.mock('@/features/locations/infrastructure/api', () => ({
  locationService: {
    getCountries: jest.fn().mockResolvedValue([]),
    getStates: jest.fn(),
    getDistricts: jest.fn().mockResolvedValue([]),
    getTaluks: jest.fn().mockResolvedValue([]),
    getPincodes: jest.fn().mockResolvedValue([]),
    getPincodesByTaluk: jest.fn().mockResolvedValue([]),
    getByPinCode: jest.fn(),
    searchPincodes: jest.fn().mockResolvedValue([]),
  },
}));

const mockedLocationService = locationService as jest.Mocked<typeof locationService>;

function renderUseLocations() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return renderHook(() => useLocations('India'), { wrapper });
}

describe('useLocations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Regression: isLoadingStates was previously computed as `!apiStates &&
  // isIndia` — a heuristic that stayed permanently `true` after a failed
  // states request (apiStates never becomes non-undefined), indistinguishable
  // from "still loading." It now reflects the real query state.
  it('reports isLoadingStates as false (not stuck) once the states request fails', async () => {
    mockedLocationService.getStates.mockRejectedValue(new Error('network down'));

    const { result } = renderUseLocations();

    // useStatesQuery retries twice with backoff before settling — the old
    // `!apiStates && isIndia` heuristic would have stayed `true` forever
    // even after that, since `apiStates` never becomes non-undefined on a
    // permanent failure.
    await waitFor(() => expect(result.current.isLoadingStates).toBe(false), { timeout: 10000 });
  }, 15000);

  it('reports isLoadingStates as true while the states request is in flight', () => {
    mockedLocationService.getStates.mockReturnValue(new Promise(() => {})); // never resolves

    const { result } = renderUseLocations();

    expect(result.current.isLoadingStates).toBe(true);
  });

  it('includes isLoadingStates in the combined isLoading flag', () => {
    mockedLocationService.getStates.mockReturnValue(new Promise(() => {}));

    const { result } = renderUseLocations();

    expect(result.current.isLoading).toBe(true);
  });

  it('resolves states options once the query succeeds', async () => {
    mockedLocationService.getStates.mockResolvedValue([
      { id: 1, name: 'Tamil Nadu', code: 'TN' },
    ]);

    const { result } = renderUseLocations();

    await waitFor(() => expect(result.current.isLoadingStates).toBe(false));
    expect(result.current.stateOptions).toEqual([{ label: 'Tamil Nadu', value: 'Tamil Nadu' }]);
  });
});
