
import type {
  ApiClient,
  ApiResponse,
} from './api-rate-limiter';

export class HttpApiClient implements ApiClient {
  constructor(private readonly baseUrl: string) {}

  async get(resource: string): Promise<ApiResponse> {
    let response: Response;

    try {
      response = await fetch(`${this.baseUrl}${resource}`);
    } catch {
      throw new Error('API_UNAVAILABLE');
    }

    if (!response.ok) {
      throw new Error('API_UNAVAILABLE');
    }

    let data: unknown;

    try {
      data = await response.json();
    } catch {
      throw new Error('INVALID_API_FORMAT');
    }

    if (
      typeof data !== 'object' ||
      data === null ||
      !('data' in data) ||
      typeof data.data !== 'string'
    ) {
      throw new Error('INVALID_API_FORMAT');
    }

    return { data: data.data };
  }
}
