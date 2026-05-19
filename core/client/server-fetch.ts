import { env } from '@/env';

export async function serverBackendFetch<T>(endpoint: string, token?: string): Promise<{ data: T }> {
  const backendUrl = env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8082';
  const url = `${backendUrl}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, {
    headers,
    cache: 'no-store',
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
