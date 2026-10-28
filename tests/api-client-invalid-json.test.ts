
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';

import { server } from './msw/server';
import { HttpApiClient } from '../src/api-client';

describe('HttpApiClient — некоректний JSON', () => {
  it('відхиляє пошкоджений JSON із HTTP 200', async () => {
    server.use(
      http.get('https://api.example.com/data', () =>
        new HttpResponse('{"data":', {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      ),
    );

    const client = new HttpApiClient(
      'https://api.example.com',
    );

    await expect(
      client.get('/data'),
    ).rejects.toThrow('INVALID_API_FORMAT');
  });
});
