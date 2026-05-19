declare module '@upstash/redis' {
  export class Redis {
    constructor(options?: { url?: string; token?: string });
    static fromEnv(): Redis;
    pipeline(): {
      incr(key: string): void;
      pttl(key: string): void;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      exec<T = any[]>(): Promise<T>;
    };
    incr(key: string): Promise<number>;
    pttl(key: string): Promise<number>;
    pexpire(key: string, ms: number): Promise<number>;
    set(key: string, value: string): Promise<void>;
    get(key: string): Promise<string | null>;
    del(...keys: string[]): Promise<void>;
    keys(pattern: string): Promise<string[]>;
  }
  export { Redis };
}
