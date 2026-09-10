import { isValidImageUrl } from '@/shared/utils';

describe('isValidImageUrl', () => {
  it('returns false for null, undefined, empty, or non-string inputs', () => {
    expect(isValidImageUrl(null)).toBe(false);
    expect(isValidImageUrl(undefined)).toBe(false);
    expect(isValidImageUrl('')).toBe(false);
    expect(isValidImageUrl('   ')).toBe(false);
    // @ts-expect-error - testing invalid type
    expect(isValidImageUrl(123)).toBe(false);
  });

  it('allows valid remote image URLs', () => {
    expect(isValidImageUrl('https://example.com/logo.png')).toBe(true);
    expect(isValidImageUrl('http://example.com/logo.jpg')).toBe(true);
    expect(isValidImageUrl('https://example.com/path/to/image.webp')).toBe(true);
  });

  it('allows valid relative paths that look like assets', () => {
    expect(isValidImageUrl('/images/logo.png')).toBe(true);
    expect(isValidImageUrl('/static/logo.webp')).toBe(true);
    expect(isValidImageUrl('/uploads/store_logo.jpg')).toBe(true);
  });

  it('rejects paths that are local pages or routes', () => {
    expect(isValidImageUrl('/seller/register')).toBe(false);
    expect(isValidImageUrl('/admin/dashboard')).toBe(false);
    expect(isValidImageUrl('/customer/profile')).toBe(false);
    expect(isValidImageUrl('/login')).toBe(false);
    expect(isValidImageUrl('/register')).toBe(false);
  });

  it('rejects protocol-relative URLs pointing to app routes or localhost', () => {
    expect(isValidImageUrl('//localhost:3000/seller/register?flow=wizard')).toBe(false);
    expect(isValidImageUrl('//127.0.0.1:3000/admin/dashboard')).toBe(false);
    expect(isValidImageUrl('//localhost:3000/login')).toBe(false);
  });

  it('rejects absolute URLs with localhost pointing to app routes', () => {
    expect(isValidImageUrl('http://localhost:3000/seller/register?flow=wizard')).toBe(false);
    expect(isValidImageUrl('http://127.0.0.1:3000/admin/dashboard')).toBe(false);
    expect(isValidImageUrl('http://localhost:3000/login')).toBe(false);
  });

  it('allows valid dynamic remote images with query strings', () => {
    expect(isValidImageUrl('https://images.unsplash.com/photo-1234?w=500&q=80')).toBe(true);
  });
});
