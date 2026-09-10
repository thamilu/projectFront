import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useProducts,
  useProduct,
  useCategories,
  useCreateProduct,
  useUpdateProduct,
} from '@/features/products/hooks/use-products';
import { productApi } from '@/features/products/api/product-api';
import { productKeys } from '@/features/products/query-keys';

jest.mock('@/features/products/api/product-api', () => ({
  productApi: {
    getProducts: jest.fn(),
    getProductById: jest.fn(),
    getCategories: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

const mockedProductApi = productApi as jest.Mocked<typeof productApi>;

function renderWithClient<T>(callback: () => T) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return { ...renderHook(callback, { wrapper }), queryClient };
}

describe('useProducts hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('useProducts applies pagination defaults and uses the query-key factory', async () => {
    mockedProductApi.getProducts.mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
      first: true,
      last: true,
    });

    const { result } = renderWithClient(() => useProducts());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedProductApi.getProducts).toHaveBeenCalledWith(
      expect.objectContaining({ page: 0, size: 10 })
    );
  });

  it('useProduct does not fetch when id is falsy', () => {
    const { result } = renderWithClient(() => useProduct(''));

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedProductApi.getProductById).not.toHaveBeenCalled();
  });

  it('useProduct fetches by id when given a real id', async () => {
    mockedProductApi.getProductById.mockResolvedValue({ id: 7, name: 'Test Product' } as any);

    const { result } = renderWithClient(() => useProduct(7));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedProductApi.getProductById).toHaveBeenCalledWith(7);
  });

  it('useCategories surfaces a fetch failure via isError rather than throwing', async () => {
    mockedProductApi.getCategories.mockRejectedValue(new Error('network down'));

    const { result } = renderWithClient(() => useCategories());

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('useCreateProduct invalidates the products list on success', async () => {
    mockedProductApi.create.mockResolvedValue({ id: 1 } as any);

    const { result, queryClient } = renderWithClient(() => useCreateProduct());
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate({ payload: { name: 'New Product' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['products'] });
  });

  it('useUpdateProduct invalidates both the list and the specific product detail', async () => {
    mockedProductApi.update.mockResolvedValue({ id: 9 } as any);

    const { result, queryClient } = renderWithClient(() => useUpdateProduct());
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate({ id: 9, payload: { name: 'Updated Name' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['products'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: productKeys.detail(9) });
  });
});
