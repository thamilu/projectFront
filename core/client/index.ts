import { apiClient } from './axios';
import { registerInterceptors } from '../interceptors';

// Initialize the Interceptors immediately
registerInterceptors(apiClient);

export { apiClient as httpClient };
export { apiClient };
export default apiClient;

export * from './fetch';
export * from './types';
