import { sellerApi as domainSellerApi } from '@/domains/seller/infrastructure/api/seller-api';
import { 
  Store, 
  StoreCreateRequest, 
  StoreUpdateRequest, 
  SellerProfile, 
  SellerOnboardingRequest, 
  SellerOnboardingResponse 
} from '../types';
import { PageResponse, PageRequest } from '@/shared/types';
import { ProductDTO } from '@/domains/catalog/contracts/catalog.types';

/**
 * [DELEGATED] Seller API Service
 * 
 * Bridges feature-level frontend types with the domain infrastructure API.
 * Delegates all network calls directly to domains/seller/infrastructure/api/seller-api
 * to prevent duplicate axios/fetch calls and ensure SRP and bounded ownership.
 */
export const sellerApi = {
  register: (data: SellerOnboardingRequest): Promise<SellerOnboardingResponse> => {
    return domainSellerApi.register(data as any) as any;
  },

  getMyProfile: (): Promise<SellerProfile | null> => {
    return domainSellerApi.getMyProfile() as any;
  },

  profileExists: (): Promise<boolean> => {
    return domainSellerApi.profileExists();
  },

  updateProfile: (data: Partial<SellerOnboardingRequest>): Promise<SellerProfile> => {
    return domainSellerApi.updateProfile(data as any) as any;
  },

  getMyStore: (): Promise<Store | null> => {
    return domainSellerApi.getMyStore() as any;
  },

  checkStoreExists: (): Promise<boolean> => {
    return domainSellerApi.checkStoreExists();
  },

  createStore: (storeData: StoreCreateRequest): Promise<Store> => {
    return domainSellerApi.createStore(storeData as any) as any;
  },

  updateStore: (storeData: Partial<StoreUpdateRequest>): Promise<Store> => {
    return domainSellerApi.updateStore(storeData as any) as any;
  },

  getMyProducts: (params: PageRequest): Promise<PageResponse<ProductDTO>> => {
    return domainSellerApi.getMyProducts(params) as any;
  },

  createProduct: (productData: Partial<ProductDTO>): Promise<ProductDTO> => {
    return domainSellerApi.createProduct(productData) as any;
  },

  updateProduct: (id: number, productData: Partial<ProductDTO>): Promise<ProductDTO> => {
    return domainSellerApi.updateProduct(id, productData) as any;
  },

  deleteProduct: (id: number): Promise<void> => {
    return domainSellerApi.deleteProduct(id);
  },

  toggleProductStatus: (id: number): Promise<ProductDTO> => {
    return domainSellerApi.toggleProductStatus(id) as any;
  },
};

export const sellersApi = sellerApi;
export default sellerApi;
