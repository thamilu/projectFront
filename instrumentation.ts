export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    /**
     * Suppress legacy url.parse() deprecation warning (DEP0169)
     * 
     * This warning is triggered by the openid-client library used by next-auth.
     * Since this is a dependency issue and standard in the current version of next-auth,
     * we suppress it to keep the developer console clean and professional.
     */
    const originalEmit = process.emit;
    // @ts-expect-error - process.emit types are strict but we need to override warning emission
    process.emit = function (name, data, ...args) {
      if (
        name === 'warning' &&
        typeof data === 'object' &&
        (data as any).code === 'DEP0169'
      ) {
        return false;
      }
      return originalEmit.apply(process, [name, data, ...args]);
    };

    // Register backend validation or observability here
    // await import('./lib/observability/server');
  }
}
