import { apiClient } from '../axios';
import { registerInterceptors } from '../interceptors';

// Initialize Interceptors
registerInterceptors(apiClient);

// Barrel Exports for Centralized Domain Services
export * from './product-images';
export * from './products';
export * from './auth';
export * from './sellers';
export * from './locations';

// Re-export base client and types for flexibility
export { apiClient as httpClient } from '../axios';
export * from '../types';

// Default export for backward compatibility
export { apiClient };
export default apiClient;
