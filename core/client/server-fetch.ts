import { env } from '@/env';

interface ServerBackendFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
}

export async function serverBackendFetch<T>(
  endpoint: string,
  token?: string,
  options?: ServerBackendFetchOptions
): Promise<{ data: T }> {
  const backendUrl =
    env.INTERNAL_API_URL ||
    env.SPRING_BOOT_API_URL ||
    env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:8082';

  let cleanEndpoint = endpoint;
  const normalizedBackendUrl = backendUrl.replace(/\/+$/, '');
  if (normalizedBackendUrl.endsWith('/api/v1') && endpoint.startsWith('/api/v1')) {
    cleanEndpoint = endpoint.substring('/api/v1'.length);
  }

  // Ensure cleanEndpoint starts with a slash
  if (!cleanEndpoint.startsWith('/')) {
    cleanEndpoint = '/' + cleanEndpoint;
  }

  // Strip trailing slash from base URL to avoid double slash
  const baseUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
  const url = `${baseUrl}${cleanEndpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const method = options?.method ?? 'GET';
  const response = await fetch(url, {
    method,
    headers,
    ...(options?.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    cache: 'no-store',
    signal: AbortSignal.timeout(4_000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const errorObj = {
      status: response.status,
      message: errorText || `HTTP error ${response.status}`,
    };
    throw errorObj;
  }

  const json = await response.json();
  return json;
}
