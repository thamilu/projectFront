import { formatBadgeCount } from '@/shared/utils/format-badge-count';

describe('formatBadgeCount', () => {
  it('should return "0" for 0', () => {
    expect(formatBadgeCount(0)).toBe('0');
  });

  it('should return "0" for negative numbers', () => {
    expect(formatBadgeCount(-5)).toBe('0');
  });

  it('should return string representation of count if <= max', () => {
    expect(formatBadgeCount(1)).toBe('1');
    expect(formatBadgeCount(5)).toBe('5');
    expect(formatBadgeCount(9)).toBe('9');
  });

  it('should return "max+" if count is strictly greater than max', () => {
    expect(formatBadgeCount(10)).toBe('9+');
    expect(formatBadgeCount(100)).toBe('9+');
  });

  it('should support custom maximum threshold', () => {
    expect(formatBadgeCount(10, 99)).toBe('10');
    expect(formatBadgeCount(99, 99)).toBe('99');
    expect(formatBadgeCount(100, 99)).toBe('99+');
  });

  it('should always return a string', () => {
    const result = formatBadgeCount(5);
    expect(typeof result).toBe('string');
  });
});
