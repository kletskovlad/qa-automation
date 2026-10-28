
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';

import { server } from './msw/server';
import { HttpApiClient } from '../src/api-client';
import { ApiRateLimiter } from '../src/api-rate-limiter';

import type { Clock } from '../src/api-rate-limiter';

import { InMemoryRequestStore } from './fakes/in-memory-request-store';

const API_URL = 'https://api.example.com/data';
const client = new HttpApiClient('https://api.example.com');

describe('HttpApiClient — MSW', () => {
  it('повертає дані за успішної відповіді', async () => {
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json({ data: 'ok' }),
      ),
    );

    await expect(
      client.get('/data'),
    ).resolves.toEqual({ data: 'ok' });
  });

  it('відхиляє відповідь зі статусом 503', async () => {
    server.use(
      http.get(API_URL, () =>
        new HttpResponse(null, { status: 503 }),
      ),
    );

    await expect(
      client.get('/data'),
    ).rejects.toThrow('API_UNAVAILABLE');
  });

  it('відхиляє некоректний формат відповіді', async () => {
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json({ data: 123 }),
      ),
    );

    await expect(
      client.get('/data'),
    ).rejects.toThrow('INVALID_API_FORMAT');
  });

  it('опрацьовує мережеву помилку', async () => {
    server.use(
      http.get(API_URL, () => HttpResponse.error()),
    );

    await expect(
      client.get('/data'),
    ).rejects.toThrow('API_UNAVAILABLE');
  });
});

describe('ApiRateLimiter — інтеграція з MSW', () => {
  it('не надсилає четвертий HTTP-запит', async () => {
    let httpRequests = 0;

    server.use(
      http.get(API_URL, () => {
        httpRequests++;
        return HttpResponse.json({ data: 'ok' });
      }),
    );

    const store = new InMemoryRequestStore();

    const clock: Clock = {
      now: () => 1000,
    };

    const limiter = new ApiRateLimiter(
      client,
      store,
      clock,
    );

    for (let i = 0; i < 3; i++) {
      await expect(
        limiter.request('/data'),
      ).resolves.toEqual({ data: 'ok' });
    }

    await expect(
      limiter.request('/data'),
    ).rejects.toThrow('RATE_LIMIT_EXCEEDED');

    expect(httpRequests).toBe(3);
    expect(store.size).toBe(3);
  });
});
