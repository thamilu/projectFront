import { sellerApi as domainSellerApi } from '@/domains/seller/infrastructure/api/seller-api';
import {
  Store,
  StoreCreateRequest,
  StoreUpdateRequest,
  SellerProfile,
  SellerOnboardingRequest,
  SellerOnboardingResponse,
} from '../types';
import { PageResponse, PageRequest } from '@/shared/types';
import { ProductDTO } from '@/domains/catalog/contracts/catalog.types';
import { RequestOptions } from '@/core/client/types';

/**
 * [DELEGATED] Seller API Service
 *
 * Bridges feature-level frontend types with the domain infrastructure API.
 * Delegates all network calls directly to domains/seller/infrastructure/api/seller-api
 * to prevent duplicate axios/fetch calls and ensure SRP and bounded ownership.
 *
 * KNOWN ISSUE (investigated, not fixed — see PR/review notes): this file's
 * `as any` casts paper over a real divergence between this feature-level
 * SellerProfile/Store/SellerOnboardingResponse and the narrower interfaces
 * of the same names declared in domains/seller/infrastructure/api/seller-api.ts.
 * Attempting to consolidate onto the domain-level types directly surfaces
 * ~80 compile errors in app/(seller)/seller/profile/page.tsx and
 * .../store/page.tsx, which read rich fields (businessTypes, kyc, shopName,
 * storeAddressLine1, isVerified, rating, ...) that do NOT exist on the
 * domain-level types at all. Evidence suggests the domain-level interfaces
 * are simply under-specified rather than the feature-level ones being
 * aspirational fiction (useSellerSubmit.ts defensively checks BOTH
 * `response.sellerId` and `response.seller?.id`, implying real uncertainty
 * about the true shape even from the original author) — but resolving this
 * correctly requires confirming the actual backend response shape, which
 * isn't verifiable from this frontend repo. Do NOT change the domain-level
 * interfaces or these casts without that confirmation: guessing wrong in
 * either direction either masks a real bug or breaks a currently-working
 * page's type-checking against real API responses it already handles
 * correctly at runtime.
 */
export const sellerApi = {
  register: (data: SellerOnboardingRequest): Promise<SellerOnboardingResponse> => {
    return domainSellerApi.register(data as any) as any;
  },

  getMyProfile: (options?: RequestOptions): Promise<SellerProfile | null> => {
    return domainSellerApi.getMyProfile(options) as any;
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

  verifyPan: (panNumber: string, options?: RequestOptions): Promise<{ verified: boolean; message?: string }> => {
    return domainSellerApi.verifyPan(panNumber, options);
  },

  verifyGstin: (gstin: string, options?: RequestOptions): Promise<{ verified: boolean; message?: string }> => {
    return domainSellerApi.verifyGstin(gstin, options);
  },

  verifyAadhar: (aadhar: string, options?: RequestOptions): Promise<{ verified: boolean; message?: string }> => {
    return domainSellerApi.verifyAadhar(aadhar, options);
  },
};
