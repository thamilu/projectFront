import 'server-only';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { FetchError, safeFetch } from '@/lib/utils/fetch-utils';

// `NEXT_PUBLIC_API_URL` is often configured as `http://host:port/api/v1`, while our endpoints already include `/api/v1/*`.
// Normalize to the host root to avoid accidentally calling `/api/v1/api/v1/*`.
function normalizeApiBaseUrl(raw: string): string {
  return raw.replace(/\/api\/v1\/?$/i, '').replace(/\/+$/, '');
}

function resolveApiBaseUrl(): string {
  const raw =
    process.env.INTERNAL_API_URL ||
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    '';

  const normalized = raw ? normalizeApiBaseUrl(raw) : '';
  if (!normalized) {
    // Do not throw at module-evaluation time. Throw only when called so that
    // non-critical imports don't crash the entire route.
    throw new FetchError(
      'Missing API base URL. Set INTERNAL_API_URL, BACKEND_API_URL, NEXT_PUBLIC_API_URL, or NEXT_PUBLIC_API_BASE_URL.',
      500
    );
  }

  return normalized;
}

function headersToRecord(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) return Object.fromEntries(headers.entries());
  if (Array.isArray(headers)) return Object.fromEntries(headers);
  return headers as Record<string, string>;
}

export async function serverFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const session = await getServerSession(authOptions);
  const accessToken = (session as unknown as { accessToken?: string } | null)?.accessToken;
  const baseUrl = resolveApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...headersToRecord(options.headers),
  };

  const { headers: _headers, ...rest } = options;
  return safeFetch<T>(url, { ...rest, headers });
}
