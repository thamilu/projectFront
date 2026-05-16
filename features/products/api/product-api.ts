/**
 * [LEGACY] Product API Proxy
 * 
 * This file is maintained for backward compatibility. 
 * Please migrate to imports from '@/lib/http/services'.
 */
export { productApi } from '@/lib/http/services';
export { isBackendDown } from '@/lib/http/utils';

// Keep local types or re-export from types
export * from '../types/product.types';
