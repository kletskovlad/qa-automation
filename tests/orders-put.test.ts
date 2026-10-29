
import {
  describe,
  it,
  expect,
  beforeEach,
} from 'vitest';

import request from 'supertest';
import { createApp } from '../src/app';
import { loginAs, createOrder } from './helpers';
import { expectSchema } from './schema';
import { orderSchema } from './schemas/order.schema';

describe('PUT /orders/:id — варіант №5', () => {
  let app: ReturnType<typeof createApp>;
  let token: string;
  let orderId: string;
  let original: Record<string, unknown>;

  const replacement = [
    { sku: 'NEW', price: 400, qty: 2 },
    { sku: 'EXTRA', price: 300, qty: 1 },
  ];

  beforeEach(async () => {
    app = createApp();

    token = await loginAs(
      app,
      'bob@example.com',
    );

    const created = await createOrder(app, token, [
      { sku: 'OLD', price: 100, qty: 1 },
    ]);

    expect(created.status).toBe(201);

    orderId = created.body.id;
    original = created.body;
  });

  const put = (items: unknown, authToken = token) =>
    request(app)
      .put(`/orders/${orderId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ items });

  it('повністю замінює позиції та перераховує суму', async () => {
    const response = await put(replacement);

    expect(response.status).toBe(200);

    expect(response.headers['content-type'])
      .toMatch(/application\/json/);

    expect(response.body.id).toBe(orderId);
    expect(response.body.items).toEqual(replacement);

    expect(response.body.subtotal).toBe(1100);
    expect(response.body.total).toBe(1100);

    expect(response.body.createdAt).toBe(
      original.createdAt,
    );

    expect(response.body).not.toHaveProperty('ownerId');

    expectSchema(response.body, orderSchema);

    const saved = await request(app)
      .get(`/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(saved.status).toBe(200);
    expect(saved.body).toEqual(response.body);
  });

  it('перераховує знижку gold для суми 2000', async () => {
    const alice = await loginAs(
      app,
      'alice@example.com',
    );

    const created = await createOrder(app, alice, [
      { sku: 'A', price: 100, qty: 1 },
    ]);

    const response = await request(app)
      .put(`/orders/${created.body.id}`)
      .set('Authorization', `Bearer ${alice}`)
      .send({
        items: [
          { sku: 'B', price: 1000, qty: 2 },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.subtotal).toBe(2000);
    expect(response.body.total).toBe(1700);
  });

  it('є ідемпотентним для трьох однакових PUT', async () => {
    const responses = [];

    for (let i = 0; i < 3; i++) {
      const response = await put(replacement);

      expect(response.status).toBe(200);

      responses.push(response.body);
    }

    expect(responses[1]).toEqual(responses[0]);
    expect(responses[2]).toEqual(responses[0]);

    const saved = await request(app)
      .get(`/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(saved.status).toBe(200);
    expect(saved.body).toEqual(responses[0]);

    const list = await request(app)
      .get('/orders')
      .set('Authorization', `Bearer ${token}`);

    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].items).toEqual(replacement);
  });

  it.each([
    {
      name: 'порожній масив',
      items: [],
      code: 'EMPTY_ORDER',
    },
    {
      name: 'від’ємна ціна',
      items: [{ sku: 'A', price: -1, qty: 1 }],
      code: 'INVALID_PRICE',
    },
    {
      name: 'ціна як рядок',
      items: [{ sku: 'A', price: '100', qty: 1 }],
      code: 'INVALID_PRICE',
    },
    {
      name: 'нульова кількість',
      items: [{ sku: 'A', price: 100, qty: 0 }],
      code: 'INVALID_QTY',
    },
    {
      name: 'дробова кількість',
      items: [{ sku: 'A', price: 100, qty: 1.5 }],
      code: 'INVALID_QTY',
    },
    {
      name: 'порожній SKU',
      items: [{ sku: '', price: 100, qty: 1 }],
      code: 'INVALID_SKU',
    },
  ])(
    'відхиляє некоректні дані: $name',
    async ({ items, code }) => {
      const response = await put(items);

      expect(response.status).toBe(400);
      expect(response.body.code).toBe(code);

      const saved = await request(app)
        .get(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(saved.status).toBe(200);
      expect(saved.body).toEqual(original);
    },
  );

  it('повертає 401 без токена', async () => {
    const response = await request(app)
      .put(`/orders/${orderId}`)
      .send({ items: replacement });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('UNAUTHORIZED');
  });

  it('повертає 401 із підробленим токеном', async () => {
    const response = await put(
      replacement,
      'fake-token',
    );

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('UNAUTHORIZED');
  });

  it('повертає 404 для чужого замовлення', async () => {
    const alice = await loginAs(
      app,
      'alice@example.com',
    );

    const response = await put(replacement, alice);

    expect(response.status).toBe(404);
    expect(response.body.code).toBe('NOT_FOUND');

    const saved = await request(app)
      .get(`/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(saved.status).toBe(200);
    expect(saved.body).toEqual(original);
  });

  it('повертає 404 для неіснуючого ID', async () => {
    const response = await request(app)
      .put('/orders/non-existent-id')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: replacement });

    expect(response.status).toBe(404);
    expect(response.body.code).toBe('NOT_FOUND');
  });
});
