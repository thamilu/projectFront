import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sellerApi } from '../api/seller-api'
import { queryKeys } from '@/lib/query/query-keys'

export function useSellerProfile() {
  return useQuery({
    queryKey: queryKeys.seller.profile(),
    queryFn: () => sellerApi.getMyProfile(),
  })
}

export function useUpdateSellerProfile() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: sellerApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seller.profile() })
    },
  })
}

export function useSellerProducts(params?: any) {
  return useQuery({
    queryKey: queryKeys.seller.products(params),
    queryFn: () => sellerApi.getMyProducts(params),
  })
}

export function useSellerStore() {
  return useQuery({
    queryKey: queryKeys.seller.store(),
    queryFn: () => sellerApi.getMyStore(),
  })
}
