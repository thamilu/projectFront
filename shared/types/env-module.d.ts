declare module '@/env' {
  export const env: {
    apiBaseUrl: string;
    apiAuthUrl: string;
    keycloakUrl: string;
    appUrl: string;
    appName: string;
    enableOAuth: boolean;
    enableDirectLogin: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
}

declare module '@env' {
  export * from '@/env';
}
