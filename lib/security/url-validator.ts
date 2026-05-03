export function sanitizeRedirectUrl(url: string | null | undefined): string {
  if (!url) return '/';
  const trimmed = url.trim();
  if (trimmed === '') return '/';
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    const app = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const base = new URL(app);
    if (parsed.origin === base.origin) return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    // ignore
  }
  return '/';
}
