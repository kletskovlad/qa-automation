
import { describe, it, expect } from 'vitest';

import { createApp } from '../src/app';
import { loginAs, createOrder } from './helpers';
import { expectSchema } from './schema';
import { orderSchema } from './schemas/order.schema';

describe('JSON Schema — замовлення', () => {
  it('відповідь POST /orders відповідає контракту', async () => {
    const app = createApp();

    const token = await loginAs(
      app,
      'bob@example.com',
    );

    const response = await createOrder(
      app,
      token,
      [
        {
          sku: 'A',
          price: 500,
          qty: 1,
        },
      ],
    );

    expect(response.status).toBe(201);

    expectSchema(response.body, orderSchema);
  });
});
