declare module '@prisma/client' {
  export class PrismaClient {
    constructor(): void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    productImage: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    product: any;
    $disconnect(): Promise<void>;
  }
  export { PrismaClient };
}
