import { sanitizeCSSValue } from '@/lib/sanitize';

describe('sanitizeCSSValue', () => {
  it('returns an empty string for null, undefined, or empty input', () => {
    expect(sanitizeCSSValue(null)).toBe('');
    expect(sanitizeCSSValue(undefined)).toBe('');
    expect(sanitizeCSSValue('')).toBe('');
  });

  it('passes through an ordinary safe value unchanged', () => {
    expect(sanitizeCSSValue('#ff0000')).toBe('#ff0000');
    expect(sanitizeCSSValue('16px')).toBe('16px');
  });

  it('blocks javascript: protocol execution attempts', () => {
    expect(sanitizeCSSValue('javascript:alert(1)')).toBe('');
    expect(sanitizeCSSValue('JavaScript:alert(1)')).toBe('');
  });

  it('blocks url() to prevent remote resource injection', () => {
    expect(sanitizeCSSValue('url(https://evil.example/x.png)')).toBe('');
    expect(sanitizeCSSValue('URL(evil)')).toBe('');
  });

  it('blocks expression() (legacy IE CSS script execution)', () => {
    expect(sanitizeCSSValue('expression(alert(1))')).toBe('');
  });

  it('strips semicolons and braces that could break out of a style attribute', () => {
    expect(sanitizeCSSValue('red; font-weight: bold')).toBe('red font-weight: bold');
    expect(sanitizeCSSValue('{color: red}')).toBe('color: red');
  });
});
