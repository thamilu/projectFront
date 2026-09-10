import { sanitizeHtml } from '@/shared/utils/sanitize';

describe('sanitizeHtml', () => {
  it('returns an empty string for falsy input', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('keeps ordinary allow-listed markup unchanged', () => {
    expect(sanitizeHtml('<p>Hello <strong>world</strong></p>')).toBe(
      '<p>Hello <strong>world</strong></p>'
    );
  });

  it('strips disallowed tags like <script>', () => {
    expect(sanitizeHtml('<script>alert(1)</script><p>safe</p>')).toBe('<p>safe</p>');
  });

  it('forces rel="noopener noreferrer nofollow" onto any link with a target, preventing reverse tabnabbing', () => {
    const out = sanitizeHtml('<a href="https://example.com" target="_blank">link</a>');
    expect(out).toContain('rel="noopener noreferrer nofollow"');
    expect(out).toContain('target="_blank"');
  });

  it('overrides an attacker-supplied rel value rather than merging with it', () => {
    const out = sanitizeHtml(
      '<a href="https://example.com" target="_blank" rel="opener">link</a>'
    );
    expect(out).toContain('rel="noopener noreferrer nofollow"');
    expect(out).not.toContain('rel="opener"');
  });

  it('leaves rel untouched on links with no target', () => {
    const out = sanitizeHtml('<a href="https://example.com">link</a>');
    expect(out).not.toContain('rel=');
  });
});
