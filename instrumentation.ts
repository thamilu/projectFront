export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    /**
     * Suppress legacy url.parse() deprecation warning (DEP0169)
     */
    const originalEmit = process.emit;
    process.emit = function (name: any, data: any, ...args: any[]) {
      if (name === 'warning' && typeof data === 'object' && (data as any).code === 'DEP0169') {
        return false;
      }
      return (originalEmit as any).apply(process, [name, data, ...args]);
    } as any;

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
