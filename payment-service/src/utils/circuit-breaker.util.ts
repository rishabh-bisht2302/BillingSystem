type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitBreakerOpenError extends Error {
  constructor(message = 'Circuit breaker is open') {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}

interface CircuitBreakerOptions {
  failureThreshold?: number;
  recoveryTimeMs?: number;
}

export class CircuitBreaker {
  private failureCount = 0;
  private state: CircuitState = 'CLOSED';
  private nextAttempt = Date.now();
  private readonly failureThreshold: number;
  private readonly recoveryTimeMs: number;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 3;
    this.recoveryTimeMs = options.recoveryTimeMs ?? 15_000;
  }

  async fire<T>(action: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() >= this.nextAttempt) {
        this.state = 'HALF_OPEN';
      } else {
        throw new CircuitBreakerOpenError();
      }
    }

    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount += 1;
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.recoveryTimeMs;
    }
  }
}

