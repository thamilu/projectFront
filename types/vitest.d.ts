/**
 * vitest.d.ts
 *
 * Ambient type definitions for Vitest module to resolve compiler checks
 * when `vitest` is not physically installed as a dependency in the Node workspace.
 */

declare module 'vitest' {
  export interface TestFunction {
    (name: string, fn: () => void | Promise<void>): void;
  }

  export interface TestInterface extends TestFunction {
    skip: TestFunction;
    only: TestFunction;
    todo: TestFunction;
  }

  export interface SuiteFunction {
    (name: string, fn: () => void): void;
  }

  export interface SuiteInterface extends SuiteFunction {
    skip: SuiteFunction;
    only: SuiteFunction;
    todo: SuiteFunction;
  }

  export const describe: SuiteInterface;
  export const it: TestInterface;
  export const test: TestInterface;
  export const expect: any;
  export const vi: {
    fn: <T extends (...args: any[]) => any>(implementation?: T) => any;
    spyOn: <T extends {}, M extends keyof T>(object: T, method: M) => any;
    mock: (path: string, factory?: any) => void;
    stubGlobal: (name: string, value: any) => void;
    [key: string]: any;
  };
  export const beforeAll: (fn: () => void | Promise<void>) => void;
  export const beforeEach: (fn: () => void | Promise<void>) => void;
  export const afterAll: (fn: () => void | Promise<void>) => void;
  export const afterEach: (fn: () => void | Promise<void>) => void;
}
