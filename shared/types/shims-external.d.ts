/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'socket.io-client' {
  export const io: any
  export type Socket = any
}

declare module '@elastic/elasticsearch' {
  export class Client {
    constructor(opts?: any)
    search(opts?: any): Promise<any>
    index(opts?: any): Promise<any>
    bulk(opts?: any): Promise<any>
    delete(opts?: any): Promise<any>
    indices: {
      create(opts?: any): Promise<any>
      delete(opts?: any): Promise<any>
    }
  }
}
