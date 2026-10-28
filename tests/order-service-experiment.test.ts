
import { describe, it, expect, vi } from 'vitest';

import { OrderService } from '../src/order-service';

import type {
  RateProvider,
  OrderRepository,
  Notifier,
} from '../src/order-service';

import { InMemoryOrderRepository } from './fakes/in-memory-repository';

const createRates = (): RateProvider => ({
  getRate: vi.fn().mockResolvedValue(41),
});

const createNotifier = (): Notifier => ({
  send: vi.fn().mockResolvedValue(undefined),
});

const order = {
  id: 'A-EXP',
  amountUsd: 10,
  email: 'u@e.com',
};

describe('Експеримент: стан проти взаємодії', () => {
  it('перевірка взаємодії: save викликано один раз', async () => {
    const repo: OrderRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(undefined),
    };

    const service = new OrderService(
      createRates(),
      repo,
      createNotifier(),
    );

    await service.placeOrder(order);

    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('перевірка стану: замовлення збережено правильно', async () => {
    const repo = new InMemoryOrderRepository();

    const service = new OrderService(
      createRates(),
      repo,
      createNotifier(),
    );

    const record = await service.placeOrder(order);

    const saved = await repo.findById('A-EXP');

    expect(saved).toEqual(record);
    expect(repo.size).toBe(1);
  });
});
