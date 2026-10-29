
import {
  describe,
  it,
  expect,
  beforeEach,
} from 'vitest';

import request from 'supertest';
import { createApp } from '../src/app';

import {
  loginAs,
  createOrder,
} from './helpers';

import type { TestApp } from './helpers';

describe('REST API — замовлення', () => {
  let app: TestApp;

  beforeEach(() => {
    app = createApp();
  });

  describe('Авторизація', () => {
    it('повертає токен для правильних даних', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'alice@example.com',
          password: 'Secret123',
        });

      expect(response.status).toBe(200);
      expect(response.body.accessToken)
        .toEqual(expect.any(String));
    });

    it('повертає 401 для неправильного пароля', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'alice@example.com',
          password: 'wrong',
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        code: 'INVALID_CREDENTIALS',
      });
    });

    it('забороняє перегляд без токена', async () => {
      const response = await request(app)
        .get('/orders');

      expect(response.status).toBe(401);
      expect(response.body.code)
        .toBe('UNAUTHORIZED');
    });

    it('забороняє створення без токена', async () => {
      const response = await request(app)
        .post('/orders')
        .send({
          items: [
            { sku: 'A', price: 100, qty: 1 },
          ],
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /orders', () => {
    it('створює замовлення та повертає 201', async () => {
      const token = await loginAs(
        app,
        'bob@example.com',
      );

      const response = await createOrder(app, token, [
        { sku: 'A', price: 100, qty: 2 },
        { sku: 'B', price: 50, qty: 1 },
      ]);

      expect(response.status).toBe(201);

      expect(response.headers['content-type'])
        .toMatch(/application\/json/);

      expect(response.body).toMatchObject({
        tier: 'basic',
        subtotal: 250,
        total: 310,
      });

      expect(response.body.id)
        .toEqual(expect.any(String));

      expect(response.body.createdAt)
        .toEqual(expect.any(String));

      expect(response.headers.location)
        .toBe(`/orders/${response.body.id}`);

      expect(response.body)
        .not.toHaveProperty('ownerId');
    });

    it.each([
      {
        name: 'порожнє замовлення',
        items: [],
        code: 'EMPTY_ORDER',
      },
      {
        name: 'від’ємна ціна',
        items: [{ sku: 'A', price: -5, qty: 1 }],
        code: 'INVALID_PRICE',
      },
      {
        name: 'ціна у вигляді рядка',
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
    ])(
      'повертає 400: $name',
      async ({ items, code }) => {
        const token = await loginAs(app);

        const response = await request(app)
          .post('/orders')
          .set('Authorization', `Bearer ${token}`)
          .send({ items });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(code);
      },
    );

    it.each([
      {
        name: 'basic, сума 100',
        email: 'bob@example.com',
        price: 100,
        expectedTotal: 160,
      },
      {
        name: 'gold, сума 100',
        email: 'alice@example.com',
        price: 100,
        expectedTotal: 150,
      },
      {
        name: 'basic, сума 2000',
        email: 'bob@example.com',
        price: 2000,
        expectedTotal: 1900,
      },
      {
        name: 'gold, сума 2000',
        email: 'alice@example.com',
        price: 2000,
        expectedTotal: 1700,
      },
    ])(
      'правильно обчислює $name',
      async ({ email, price, expectedTotal }) => {
        const token = await loginAs(app, email);

        const response = await createOrder(app, token, [
          { sku: 'A', price, qty: 1 },
        ]);

        expect(response.status).toBe(201);
        expect(response.body.subtotal).toBe(price);
        expect(response.body.total).toBe(expectedTotal);
      },
    );
  });

  describe('GET /orders', () => {
    it('повертає порожній список для нового користувача', async () => {
      const token = await loginAs(app);

      const response = await request(app)
        .get('/orders')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('повертає тільки власні замовлення', async () => {
      const aliceToken = await loginAs(
        app,
        'alice@example.com',
      );

      const bobToken = await loginAs(
        app,
        'bob@example.com',
      );

      await createOrder(app, aliceToken, [
        { sku: 'A', price: 100, qty: 1 },
      ]);

      await createOrder(app, bobToken, [
        { sku: 'B', price: 200, qty: 1 },
      ]);

      const response = await request(app)
        .get('/orders')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].items[0].sku).toBe('A');
      expect(response.body[0])
        .not.toHaveProperty('ownerId');
    });

    it('повертає власне замовлення за ID', async () => {
      const token = await loginAs(app);

      const created = await createOrder(app, token, [
        { sku: 'A', price: 100, qty: 1 },
      ]);

      const response = await request(app)
        .get(`/orders/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(created.body.id);
      expect(response.body).toEqual(created.body);
    });

    it('приховує чуже замовлення через 404', async () => {
      const aliceToken = await loginAs(
        app,
        'alice@example.com',
      );

      const bobToken = await loginAs(
        app,
        'bob@example.com',
      );

      const created = await createOrder(
        app,
        aliceToken,
        [{ sku: 'A', price: 100, qty: 1 }],
      );

      const response = await request(app)
        .get(`/orders/${created.body.id}`)
        .set('Authorization', `Bearer ${bobToken}`);

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('повертає 404 для неіснуючого ID', async () => {
      const token = await loginAs(app);

      const response = await request(app)
        .get('/orders/unknown-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /orders/:id', () => {
    it('видаляє власне замовлення з кодом 204', async () => {
      const token = await loginAs(app);

      const created = await createOrder(app, token, [
        { sku: 'A', price: 100, qty: 1 },
      ]);

      const deleted = await request(app)
        .delete(`/orders/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(deleted.status).toBe(204);
      expect(deleted.text).toBe('');

      const afterDelete = await request(app)
        .get(`/orders/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(afterDelete.status).toBe(404);
    });

    it('не дозволяє видаляти чуже замовлення', async () => {
      const aliceToken = await loginAs(
        app,
        'alice@example.com',
      );

      const bobToken = await loginAs(
        app,
        'bob@example.com',
      );

      const created = await createOrder(
        app,
        aliceToken,
        [{ sku: 'A', price: 100, qty: 1 }],
      );

      const response = await request(app)
        .delete(`/orders/${created.body.id}`)
        .set('Authorization', `Bearer ${bobToken}`);

      expect(response.status).toBe(404);

      const original = await request(app)
        .get(`/orders/${created.body.id}`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(original.status).toBe(200);
    });
  });
});
