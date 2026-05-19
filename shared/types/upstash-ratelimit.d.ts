/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '@upstash/ratelimit' {
  export class Ratelimit {
    constructor(opts?: any);
    limit(key: string): Promise<any>;
  }
}
