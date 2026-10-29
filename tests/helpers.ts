
import request from 'supertest';
import { createApp } from '../src/app';

export type TestApp = ReturnType<typeof createApp>;

export interface TestItem {
  sku: string;
  price: number;
  qty: number;
}

export async function loginAs(
  app: TestApp,
  email = 'alice@example.com',
): Promise<string> {
  const response = await request(app)
    .post('/auth/login')
    .send({
      email,
      password: 'Secret123',
    });

  if (
    response.status !== 200 ||
    typeof response.body.accessToken !== 'string'
  ) {
    throw new Error('TEST_LOGIN_FAILED');
  }

  return response.body.accessToken;
}

export function createOrder(
  app: TestApp,
  token: string,
  items: TestItem[],
) {
  return request(app)
    .post('/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({ items });
}
