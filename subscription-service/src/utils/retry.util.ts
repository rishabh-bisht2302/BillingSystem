type OnRetryFn = (attempt: number, error: unknown) => void;

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  onRetry?: OnRetryFn;
}

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Executes an async operation with retry semantics.
 * Retries the provided function up to `maxAttempts` times with linear backoff.
 */
export const executeWithRetry = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> => {
  const { maxAttempts = 3, delayMs = 500, onRetry } = options;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) {
        break;
      }
      onRetry?.(attempt, error);
      await wait(delayMs * attempt);
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error('Operation failed after maximum retry attempts');
};

