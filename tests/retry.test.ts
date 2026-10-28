
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from 'vitest';

import { withRetry } from '../src/retry';

describe('withRetry — підміна таймерів', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('повторює спробу після невдачі', async () => {
    const action = vi.fn()
      .mockRejectedValueOnce(new Error('TIMEOUT'))
      .mockResolvedValueOnce('ok');

    const promise = withRetry(action, 3, 1000);

    await vi.advanceTimersByTimeAsync(1000);

    await expect(promise).resolves.toBe('ok');

    expect(action).toHaveBeenCalledTimes(2);
  });

  it('після вичерпання спроб повертає останню помилку', async () => {
    const action = vi.fn()
      .mockRejectedValue(new Error('TIMEOUT'));

    const promise = withRetry(action, 3, 1000);

    const assertion = expect(promise)
      .rejects.toThrow('TIMEOUT');

    await vi.advanceTimersByTimeAsync(2000);

    await assertion;

    expect(action).toHaveBeenCalledTimes(3);
  });
});
