/**
 * [LEGACY] Product API Proxy
 * 
 * This file is maintained for backward compatibility. 
 * Please migrate to imports from '@/domains/catalog/infrastructure/api/catalog-api'.
 */
export { productApi } from '@/domains/catalog/infrastructure/api/catalog-api';
export { isBackendDown } from '@/core/http/utils';

export * from '../types';
