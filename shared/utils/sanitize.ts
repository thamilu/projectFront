import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(html: string) {
  if (!html) return '';

  // Keep a conservative allow-list of tags and attributes suitable for product descriptions.
  const purifier = DOMPurify as unknown as { sanitize: (s: string, opts?: unknown) => string }
  const clean = purifier.sanitize(html, {
    USE_PROFILES: { html: true },
    SAFE_FOR_TEMPLATES: true,
    ALLOWED_TAGS: [
      'a', 'b', 'strong', 'i', 'em', 'p', 'ul', 'ol', 'li', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'img', 'blockquote', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'rel', 'target', 'class', 'height', 'width'],
  });

  return clean;
}

// Minimal client-side sanitizer used as a fallback when DOMPurify isn't installed.
// This removes HTML tags and trims whitespace. It is intentionally small —
// keep server-side validation and sanitization as authoritative.
export function sanitize(input: string) {
  if (!input) return input;
  // Remove script/style and HTML tags
  return input
    .replace(/<\/?(script|style)[^>]*>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}
// Keep `sanitizeHtml` as the default export and `sanitize` as a named export.
export default sanitizeHtml;
