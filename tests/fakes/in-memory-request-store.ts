
import type {
  RequestStore,
} from '../../src/api-rate-limiter';

export class InMemoryRequestStore implements RequestStore {
  private timestamps: number[] = [];

  getTimestamps(): number[] {
    return [...this.timestamps];
  }

  setTimestamps(timestamps: number[]): void {
    this.timestamps = [...timestamps];
  }

  get size(): number {
    return this.timestamps.length;
  }
}
