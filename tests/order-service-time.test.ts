
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from 'vitest';

import { OrderService } from '../src/order-service';

import type {
  RateProvider,
  OrderRepository,
  Notifier,
} from '../src/order-service';

describe('OrderService — фіксація часу', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-15T10:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('записує момент створення замовлення', async () => {
    const rates: RateProvider = {
      getRate: vi.fn().mockResolvedValue(41),
    };

    const repo: OrderRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(undefined),
    };

    const notifier: Notifier = {
      send: vi.fn().mockResolvedValue(undefined),
    };

    const service = new OrderService(
      rates,
      repo,
      notifier,
    );

    const record = await service.placeOrder({
      id: 'A-6',
      amountUsd: 20,
      email: 'u@e.com',
    });

    expect(record.createdAt).toBe(
      '2026-03-15T10:00:00.000Z',
    );
  });
});
