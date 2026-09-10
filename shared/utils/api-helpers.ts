import { PageResponse, PageRequest } from '@/shared/types';

export const unwrapData = <T>(r: unknown): T => {
  if (r && typeof r === 'object' && 'data' in r) {
    return (r as { data: T }).data;
  }
  return r as T;
};

export const unwrapArray = <T>(r: unknown): T[] => {
  const unwrapped = unwrapData<any>(r);
  return Array.isArray(unwrapped) ? unwrapped : [];
};

export const toPageResponse = <T>(
  r: any,
  fallback: PageRequest = { page: 0, size: 20 }
): PageResponse<T> => {
  const unwrapped = unwrapData<any>(r);

  if (unwrapped && typeof unwrapped === 'object' && 'content' in unwrapped) {
    return {
      content: unwrapped.content || [],
      totalElements: unwrapped.totalElements || 0,
      totalPages: unwrapped.totalPages || 0,
      size: unwrapped.size || fallback.size,
      number: unwrapped.number || fallback.page,
      first: unwrapped.first ?? true,
      last: unwrapped.last ?? true,
    };
  }

  return {
    content: Array.isArray(unwrapped) ? unwrapped : [],
    totalElements: Array.isArray(unwrapped) ? unwrapped.length : 0,
    totalPages: 1,
    size: fallback.size,
    number: fallback.page,
    first: true,
    last: true,
  };
};
