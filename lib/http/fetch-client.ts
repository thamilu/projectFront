import { safeFetch } from '@/lib/utils/fetch-utils';

export async function tokenExchange(
  endpoint: string,
  params: URLSearchParams,
  correlationId?: string
): Promise<unknown> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'application/json',
    ...(correlationId ? { 'X-Correlation-ID': correlationId } : {}),
  };

  return safeFetch(endpoint, {
    method: 'POST',
    headers,
    body: params.toString(),
  });
}
