/**
 * @jest-environment jsdom
 */

const ioMock = jest.fn();
jest.mock('socket.io-client', () => ({
  io: (...args: unknown[]) => ioMock(...args),
}));

jest.mock('@/core/telemetry/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { wsClient } from '@/infrastructure/realtime/websocket-client';

type Handler = (...args: unknown[]) => void;

/**
 * Mimics real EventEmitter semantics closely enough to catch a duplicate-
 * registration bug: multiple .on() calls for the same event with the same
 * handler reference register it multiple times (each firing on trigger),
 * and .off() removes exactly one matching registration — matching
 * socket.io-client's actual (Node EventEmitter-based) behavior, unlike a
 * naive Map<event, handler> which can only ever hold one handler per event
 * and would hide this class of bug entirely.
 */
function makeFakeSocket() {
  const handlers = new Map<string, Handler[]>();
  return {
    connected: false,
    id: 'fake-socket-id',
    on: jest.fn((event: string, handler: Handler) => {
      const list = handlers.get(event) ?? [];
      list.push(handler);
      handlers.set(event, list);
    }),
    off: jest.fn((event: string, handler: Handler) => {
      const list = handlers.get(event);
      if (!list) return;
      const idx = list.indexOf(handler);
      if (idx !== -1) list.splice(idx, 1);
    }),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    _trigger: (event: string, ...args: unknown[]) => {
      (handlers.get(event) ?? []).forEach((h) => h(...args));
    },
    _listenerCount: (event: string) => (handlers.get(event) ?? []).length,
  };
}

describe('wsClient.connect — ticket provider', () => {
  beforeEach(() => {
    ioMock.mockReset();
    wsClient.disconnect();
  });

  it('invokes the ticketProvider and passes { ticket } to socket.io-client\'s auth callback', async () => {
    const fakeSocket = makeFakeSocket();
    ioMock.mockReturnValue(fakeSocket);

    const ticketProvider = jest.fn().mockResolvedValue('fresh-ticket-1');
    wsClient.connect('user-1', ticketProvider);

    expect(ioMock).toHaveBeenCalledTimes(1);
    const [, options] = ioMock.mock.calls[0] as [string, { auth: (cb: (data: unknown) => void) => void }];

    const ackCallback = jest.fn();
    options.auth(ackCallback);
    // auth() kicks off an async ticketProvider().then(...) chain.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(ticketProvider).toHaveBeenCalledTimes(1);
    expect(ackCallback).toHaveBeenCalledWith({ ticket: 'fresh-ticket-1' });
  });

  it('re-invokes the ticketProvider on a second connect() call (simulating a fresh attempt)', async () => {
    const fakeSocket1 = makeFakeSocket();
    ioMock.mockReturnValueOnce(fakeSocket1);

    const ticketProvider = jest.fn().mockResolvedValue('ticket-a');
    wsClient.connect('user-1', ticketProvider);
    const [, options1] = ioMock.mock.calls[0] as [string, { auth: (cb: (data: unknown) => void) => void }];
    options1.auth(jest.fn());
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(ticketProvider).toHaveBeenCalledTimes(1);

    // Disconnect and reconnect — a fresh connect() call must mint a new
    // ticket, not reuse the (already single-use) one from the first attempt.
    wsClient.disconnect();
    const fakeSocket2 = makeFakeSocket();
    ioMock.mockReturnValueOnce(fakeSocket2);
    ticketProvider.mockResolvedValue('ticket-b');
    wsClient.connect('user-1', ticketProvider);
    const [, options2] = ioMock.mock.calls[1] as [string, { auth: (cb: (data: unknown) => void) => void }];
    const ack2 = jest.fn();
    options2.auth(ack2);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(ticketProvider).toHaveBeenCalledTimes(2);
    expect(ack2).toHaveBeenCalledWith({ ticket: 'ticket-b' });
  });

  it('calls back with an empty payload (not a thrown error) when the ticketProvider rejects', async () => {
    const fakeSocket = makeFakeSocket();
    ioMock.mockReturnValue(fakeSocket);

    const ticketProvider = jest.fn().mockRejectedValue(new Error('network error'));
    wsClient.connect('user-1', ticketProvider);
    const [, options] = ioMock.mock.calls[0] as [string, { auth: (cb: (data: unknown) => void) => void }];

    const ackCallback = jest.fn();
    expect(() => options.auth(ackCallback)).not.toThrow();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(ackCallback).toHaveBeenCalledWith({});
  });
});

describe('wsClient — no duplicate handler firing across reconnects', () => {
  beforeEach(() => {
    ioMock.mockReset();
    wsClient.disconnect();
  });

  it('fires a handler exactly once per event after the initial connect, even though on() attaches immediately and the connect handler replays it', async () => {
    const fakeSocket = makeFakeSocket();
    ioMock.mockReturnValue(fakeSocket);

    wsClient.connect('user-1', jest.fn().mockResolvedValue('ticket'));
    // Mirrors real usage (use-order-updates.ts): on() is called synchronously
    // right after connect(), before the socket has actually connected.
    const handler = jest.fn();
    wsClient.on('order:123:status_changed', handler);

    // Simulate the async connection succeeding.
    fakeSocket._trigger('connect');

    fakeSocket._trigger('order:123:status_changed', { status: 'SHIPPED' });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(fakeSocket._listenerCount('order:123:status_changed')).toBe(1);
  });

  it('stays at exactly one registration after a simulated automatic reconnect (same socket instance)', async () => {
    const fakeSocket = makeFakeSocket();
    ioMock.mockReturnValue(fakeSocket);

    wsClient.connect('user-1', jest.fn().mockResolvedValue('ticket'));
    const handler = jest.fn();
    wsClient.on('cart:user-1:updated', handler);

    // Initial connect, then an automatic reconnect — socket.io-client reuses
    // the same Socket instance for both, firing 'connect' each time.
    fakeSocket._trigger('connect');
    fakeSocket._trigger('connect');

    fakeSocket._trigger('cart:user-1:updated', { action: 'item_added' });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(fakeSocket._listenerCount('cart:user-1:updated')).toBe(1);
  });
});
