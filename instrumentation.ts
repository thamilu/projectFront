export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    /**
     * Suppress legacy url.parse() deprecation warning (DEP0169)
     */
    const originalEmit = process.emit;
    // @ts-expect-error - process.emit types are strict
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

    // Register Server-Side Observability (OpenTelemetry / Sentry)
    // if (process.env.NODE_ENV === 'production') {
    //   const { init } = await import('./lib/observability/otel-server');
    //   init();
    // }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Register Edge-Side Observability
    // if (process.env.NODE_ENV === 'production') {
    //   const { init } = await import('./lib/observability/otel-edge');
    //   init();
    // }
  }
}
