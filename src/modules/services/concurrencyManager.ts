import { Semaphore } from "../../utils/semaphore";
import { TranslationServices } from "./index";

/**
 * Manager for controlling per-service concurrency.
 */
export class ServiceConcurrencyManager {
  private semaphores: Map<string, { semaphore: Semaphore; limit: number }> =
    new Map();
  private services: TranslationServices;

  constructor(services: TranslationServices) {
    this.services = services;
  }

  /**
   * Get or create semaphore for a service.
   */
  private getSemaphore(serviceId: string): Semaphore {
    const service = this.services.getServiceById(serviceId);
    const limit =
      service?.concurrencyLimit && service.concurrencyLimit > 0
        ? service.concurrencyLimit
        : Infinity;
    const existing = this.semaphores.get(serviceId);
    if (!existing || existing.limit !== limit) {
      this.semaphores.set(serviceId, { semaphore: new Semaphore(limit), limit });
    }
    return this.semaphores.get(serviceId)!.semaphore;
  }

  /**
   * Execute task with concurrency control.
   */
  async runWithConcurrencyControl<T>(
    serviceId: string,
    task: () => Promise<T> | T,
  ): Promise<T> {
    const semaphore = this.getSemaphore(serviceId);

    await semaphore.acquire();
    try {
      return await task();
    } finally {
      semaphore.release();
    }
  }

  /**
   * Reset all semaphores (for testing or service changes).
   */
  reset(): void {
    this.semaphores.clear();
  }
}
