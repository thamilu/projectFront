import DOMPurify from 'isomorphic-dompurify';

// `target` is on DOMPurify's own internal deny-list regardless of
// `ALLOWED_ATTR` — DOMPurify only lets it through via the separate
// `ADD_ATTR` option (see sanitizeHtml below), specifically because an
// unguarded `target="_blank"` is a reverse-tabnabbing vector: the opened
// page gets a live `window.opener` reference back to this tab. Verified
// empirically against the installed DOMPurify — listing 'target' in
// ALLOWED_ATTR alone silently drops it, which is why this hook is required
// alongside `ADD_ATTR`, not instead of it. A seller-authored product
// description is real, if lower-trust, authenticated content, so any link
// it contains that opens a new tab gets `rel` forced here rather than
// trusted to have set it correctly. Registered once at module load,
// applies to every sanitize() call on this DOMPurify instance.
const purifierWithHooks = DOMPurify as unknown as {
  addHook: (hook: string, cb: (node: Element) => void) => void;
};
purifierWithHooks.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.getAttribute('target')) {
    node.setAttribute('rel', 'noopener noreferrer nofollow');
  }
});

export function sanitizeHtml(html: string) {
  if (!html) return '';

  // Keep a conservative allow-list of tags and attributes suitable for product descriptions.
  const purifier = DOMPurify as unknown as { sanitize: (s: string, opts?: unknown) => string };
  const clean = purifier.sanitize(html, {
    USE_PROFILES: { html: true },
    SAFE_FOR_TEMPLATES: true,
    ALLOWED_TAGS: [
      'a',
      'b',
      'strong',
      'i',
      'em',
      'p',
      'ul',
      'ol',
      'li',
      'br',
      'hr',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'img',
      'blockquote',
      'code',
      'pre',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'rel', 'target', 'class', 'height', 'width'],
    // Required in addition to ALLOWED_ATTR above — see the addHook comment.
    ADD_ATTR: ['target'],
  });

  return clean;
}

export default sanitizeHtml;
