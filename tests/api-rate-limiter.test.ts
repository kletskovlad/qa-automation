
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from 'vitest';

import {
  ApiRateLimiter,
  SystemClock,
} from '../src/api-rate-limiter';

import type {
  ApiClient,
} from '../src/api-rate-limiter';

import { InMemoryRequestStore } from './fakes/in-memory-request-store';

describe('ApiRateLimiter — варіант №5', () => {
  let api: ApiClient;
  let store: InMemoryRequestStore;
  let limiter: ApiRateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-15T10:00:00.000Z'));

    api = {
      get: vi.fn().mockResolvedValue({ data: 'ok' }),
    };

    store = new InMemoryRequestStore();

    limiter = new ApiRateLimiter(
      api,
      store,
      new SystemClock(),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('дозволяє три виклики за 10 секунд', async () => {
    for (let i = 0; i < 3; i++) {
      await expect(
        limiter.request('/data'),
      ).resolves.toEqual({ data: 'ok' });
    }

    expect(api.get).toHaveBeenCalledTimes(3);
    expect(store.size).toBe(3);
  });

  it('блокує четвертий виклик до завершення 10 секунд', async () => {
    for (let i = 0; i < 3; i++) {
      await limiter.request('/data');
    }

    vi.advanceTimersByTime(9999);

    await expect(
      limiter.request('/data'),
    ).rejects.toThrow('RATE_LIMIT_EXCEEDED');

    expect(api.get).toHaveBeenCalledTimes(3);
    expect(store.size).toBe(3);
  });

  it('дозволяє новий виклик рівно через 10 секунд', async () => {
    for (let i = 0; i < 3; i++) {
      await limiter.request('/data');
    }

    vi.advanceTimersByTime(10_000);

    await expect(
      limiter.request('/data'),
    ).resolves.toEqual({ data: 'ok' });

    expect(api.get).toHaveBeenCalledTimes(4);
    expect(store.size).toBe(1);
  });

  it('правильно працює з ковзним часовим вікном', async () => {
    await limiter.request('/data');

    vi.advanceTimersByTime(4000);
    await limiter.request('/data');

    vi.advanceTimersByTime(5000);
    await limiter.request('/data');

    vi.advanceTimersByTime(999);

    await expect(
      limiter.request('/data'),
    ).rejects.toThrow('RATE_LIMIT_EXCEEDED');

    vi.advanceTimersByTime(1);

    await expect(
      limiter.request('/data'),
    ).resolves.toEqual({ data: 'ok' });

    expect(api.get).toHaveBeenCalledTimes(4);
    expect(store.size).toBe(3);
  });
});
