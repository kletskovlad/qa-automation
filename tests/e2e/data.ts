// Тестові, публічно наведені на сторінці Swag Labs облікові дані.
// Для справжніх сервісів паролі не зберігають у репозиторії.
export const USERS = {
  standard: { username: 'standard_user', password: 'secret_sauce' },
  locked: { username: 'locked_out_user', password: 'secret_sauce' },
  slow: { username: 'performance_glitch_user', password: 'secret_sauce' },
} as const;
