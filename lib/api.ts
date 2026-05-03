import { QueryFunctionContext } from '@tanstack/react-query';
import apiClient from './axios';
import { AxiosRequestConfig } from 'axios';

// Type-safe API wrapper that accepts React Query context
export const api = {
  get: <T = unknown>(url: string, context?: QueryFunctionContext) => {
    const config: AxiosRequestConfig = {
      signal: context?.signal,
    };
    return apiClient.get<T>(url, config);
  },

  post: <T = unknown>(url: string, data?: unknown, context?: QueryFunctionContext) => {
    const config: AxiosRequestConfig = {
      signal: context?.signal,
    };
    return apiClient.post<T>(url, data, config);
  },

  put: <T = unknown>(url: string, data?: unknown, context?: QueryFunctionContext) => {
    const config: AxiosRequestConfig = {
      signal: context?.signal,
    };
    return apiClient.put<T>(url, data, config);
  },

  patch: <T = unknown>(url: string, data?: unknown, context?: QueryFunctionContext) => {
    const config: AxiosRequestConfig = {
      signal: context?.signal,
    };
    return apiClient.patch<T>(url, data, config);
  },

  delete: <T = unknown>(url: string, context?: QueryFunctionContext) => {
    const config: AxiosRequestConfig = {
      signal: context?.signal,
    };
    return apiClient.delete<T>(url, config);
  },
};
