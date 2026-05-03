/**
 * Input Sanitization Utility
 * Prevents injection attacks by sanitizing user input
 */

/**
 * Sanitize string input to prevent XSS and injection attacks
 * Time Complexity: O(n) where n is input length
 * Space Complexity: O(n)
 */
export function sanitizeInput(input: unknown): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>\"']/g, '') // Remove potential XSS characters
    .slice(0, 1000); // Prevent DoS via large inputs
}

/**
 * Sanitize HTML content using DOMPurify-like approach
 * For production, use actual DOMPurify library
 */
export function sanitizeHtml(html: string): string {
  // Basic sanitization - in production use DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/g, '')
    .replace(/on\w+='[^']*'/g, '');
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const allowedProtocols = ['http:', 'https:'];
    
    if (!allowedProtocols.includes(parsed.protocol)) {
      return null;
    }
    
    return parsed.toString();
  } catch {
    return null;
  }
}
