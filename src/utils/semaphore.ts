/**
 * Semaphore for controlling concurrency.
 */
export class Semaphore {
  private permits: number;
  private queue: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  /**
   * Acquire a permit. If no permits available, wait in queue.
   */
  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  /**
   * Release a permit. If there are waiting tasks, grant permit to next one.
   */
  release(): void {
    this.permits++;
    const resolve = this.queue.shift();
    if (resolve) {
      this.permits--;
      resolve();
    }
  }

  /**
   * Get current available permits.
   */
  available(): number {
    return this.permits;
  }
}
