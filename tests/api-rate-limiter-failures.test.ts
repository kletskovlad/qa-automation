
import { describe, it, expect, vi } from 'vitest';

import { ApiRateLimiter } from '../src/api-rate-limiter';

import type {
  ApiClient,
  RequestStore,
  Clock,
} from '../src/api-rate-limiter';

import { InMemoryRequestStore } from './fakes/in-memory-request-store';

describe('ApiRateLimiter — відмови залежностей', () => {
  const clock: Clock = {
    now: () => 1000,
  };

  it('передає помилку зовнішнього API та зберігає спробу', async () => {
    const api: ApiClient = {
      get: vi.fn().mockRejectedValue(
        new Error('API_UNAVAILABLE'),
      ),
    };

    const store = new InMemoryRequestStore();

    const limiter = new ApiRateLimiter(
      api,
      store,
      clock,
    );

    await expect(
      limiter.request('/data'),
    ).rejects.toThrow('API_UNAVAILABLE');

    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith('/data');
    expect(store.size).toBe(1);
  });

  it('не викликає API, якщо читання сховища завершується помилкою', async () => {
    const api: ApiClient = {
      get: vi.fn().mockResolvedValue({ data: 'ok' }),
    };

    const store: RequestStore = {
      getTimestamps: vi.fn().mockImplementation(() => {
        throw new Error('STORE_READ_FAILED');
      }),

      setTimestamps: vi.fn(),
    };

    const limiter = new ApiRateLimiter(
      api,
      store,
      clock,
    );

    await expect(
      limiter.request('/data'),
    ).rejects.toThrow('STORE_READ_FAILED');

    expect(api.get).not.toHaveBeenCalled();
    expect(store.setTimestamps).not.toHaveBeenCalled();
  });

  it('не викликає API, якщо запис у сховище завершується помилкою', async () => {
    const api: ApiClient = {
      get: vi.fn().mockResolvedValue({ data: 'ok' }),
    };

    const store: RequestStore = {
      getTimestamps: vi.fn().mockReturnValue([]),

      setTimestamps: vi.fn().mockImplementation(() => {
        throw new Error('STORE_WRITE_FAILED');
      }),
    };

    const limiter = new ApiRateLimiter(
      api,
      store,
      clock,
    );

    await expect(
      limiter.request('/data'),
    ).rejects.toThrow('STORE_WRITE_FAILED');

    expect(api.get).not.toHaveBeenCalled();
    expect(store.getTimestamps).toHaveBeenCalledTimes(1);
    expect(store.setTimestamps).toHaveBeenCalledTimes(1);
  });
});
