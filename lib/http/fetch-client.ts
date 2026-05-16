import { apiClient } from '@/lib/http/services';

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

  const response = await apiClient.post(endpoint, params.toString(), {
    headers,
  });
  return response.data;
}
