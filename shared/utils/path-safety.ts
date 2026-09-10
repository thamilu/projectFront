export class PathSegmentError extends Error {
  constructor(
    public readonly segment: string,
    public readonly field: string,
    message: string
  ) {
    super(`Invalid path segment [${field}]: ${message}. Received: "${segment}"`);
    this.name = 'PathSegmentError';
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUMERIC_ID_PATTERN = /^\d+$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HANDLE_PATTERN = /^[a-zA-Z0-9_-]{3,50}$/;
const ALPHANUMERIC_PATTERN = /^[a-zA-Z0-9]{1,100}$/;

const DANGEROUS_PATTERNS = [
  /\.\./, // Path traversal
  /%2[Ff]/, // Encoded slash
  /%00/, // Null byte
  /[<>'"]/, // HTML/quote injection
];

const checkDangerousCharacters = (value: string, field: string): string => {
  if (!value || typeof value !== 'string') {
    throw new PathSegmentError(String(value), field, 'must be a non-empty string');
  }

  const trimmed = value.trim();

  // Prevent DoS by capping input lengths
  if (trimmed.length > 300) {
    throw new PathSegmentError(
      trimmed.slice(0, 20) + '...',
      field,
      'input exceeds maximum length limit'
    );
  }

  for (const dangerous of DANGEROUS_PATTERNS) {
    if (dangerous.test(trimmed)) {
      throw new PathSegmentError(trimmed, field, 'contains dangerous characters');
    }
  }

  return trimmed;
};

export const validateId = (id: string | number, field = 'id'): string => {
  const str = checkDangerousCharacters(String(id), field);
  if (str.length <= 36 && (NUMERIC_ID_PATTERN.test(str) || UUID_PATTERN.test(str))) {
    return str;
  }
  throw new PathSegmentError(str, field, 'must be numeric or UUID format');
};

export const validateSlug = (slug: string, field = 'slug'): string => {
  const str = checkDangerousCharacters(slug, field);
  if (str.length <= 200 && SLUG_PATTERN.test(str)) {
    return str;
  }
  throw new PathSegmentError(str, field, 'does not match expected slug format');
};

export const validateHandle = (handle: string, field = 'handle'): string => {
  const str = checkDangerousCharacters(handle, field);
  if (HANDLE_PATTERN.test(str)) {
    return str;
  }
  throw new PathSegmentError(str, field, 'does not match expected handle format');
};

export const validateSlugOrId = (val: string | number, field = 'slugOrId'): string => {
  const str = checkDangerousCharacters(String(val), field);
  if (
    str.length <= 200 &&
    (NUMERIC_ID_PATTERN.test(str) || UUID_PATTERN.test(str) || SLUG_PATTERN.test(str))
  ) {
    return str;
  }
  throw new PathSegmentError(str, field, 'must be slug, numeric ID, or UUID format');
};

export const validateAlphanumeric = (val: string, field = 'alphanumeric'): string => {
  const str = checkDangerousCharacters(val, field);
  if (ALPHANUMERIC_PATTERN.test(str)) {
    return str;
  }
  throw new PathSegmentError(str, field, 'must be alphanumeric');
};
