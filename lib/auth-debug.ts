export type ExchangeRecord = {
  time: string
  type: 'signin' | 'refresh' | 'logout' | 'other'
  status?: number
  body?: unknown
  raw?: string
  error?: unknown
}

let lastExchange: ExchangeRecord | null = null

export function setLastExchange(rec: ExchangeRecord) {
  lastExchange = rec
}

export function getLastExchange(): ExchangeRecord | null {
  return lastExchange
}
