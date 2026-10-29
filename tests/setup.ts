
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './msw/server';

beforeAll(() => {
  server.listen({
    onUnhandledRequest(request, print) {
      const url = new URL(request.url);

      const isLocalhost = [
        'localhost',
        '127.0.0.1',
        '[::1]',
      ].includes(url.hostname);

      const isOrdersApi =
        url.pathname === '/auth/login' ||
        url.pathname === '/orders' ||
        url.pathname.startsWith('/orders/');

      // Дозволяємо локальні запити Supertest до Express
      if (isLocalhost && isOrdersApi) {
        return;
      }

      // Незамокані зовнішні запити заборонені
      print.error();
    },
  });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
