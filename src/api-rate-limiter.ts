
export interface ApiResponse {
  data: string;
}

export interface ApiClient {
  get(resource: string): Promise<ApiResponse>;
}

export interface RequestStore {
  getTimestamps(): number[];
  setTimestamps(timestamps: number[]): void;
}

export interface Clock {
  now(): number;
}

export class SystemClock implements Clock {
  now(): number {
    return Date.now();
  }
}

const MAX_REQUESTS = 3;
const WINDOW_MS = 10_000;

export class ApiRateLimiter {
  constructor(
    private api: ApiClient,
    private store: RequestStore,
    private clock: Clock,
  ) {}

  async request(resource: string): Promise<ApiResponse> {
    const now = this.clock.now();

    const recentRequests = this.store
      .getTimestamps()
      .filter((timestamp) => now - timestamp < WINDOW_MS);

    if (recentRequests.length >= MAX_REQUESTS) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }

    this.store.setTimestamps([...recentRequests, now]);

    return this.api.get(resource);
  }
}
