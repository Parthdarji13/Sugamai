/**
 * Utility functions for Gemini model errors and quota-aware model cascading.
 */

export function isQuotaExceededError(err: unknown): boolean {
  if (!err) return false;
  const errorObj = err as {
    status?: number;
    statusCode?: number;
    response?: { status?: number };
    message?: string;
    details?: string;
  };

  const status = errorObj.status || errorObj.statusCode || errorObj.response?.status;
  if (status === 429) return true;

  const message = (errorObj.message || String(err)).toLowerCase();
  const details = typeof errorObj.details === 'string' ? errorObj.details.toLowerCase() : '';
  const combined = `${message} ${details}`;

  return (
    combined.includes('429') ||
    combined.includes('too many requests') ||
    combined.includes('quota exceeded') ||
    combined.includes('quota_exceeded') ||
    combined.includes('resource_exhausted') ||
    combined.includes('generate_content_free_tier_requests') ||
    combined.includes('rate limit')
  );
}

/**
 * Detects temporary model-side availability errors (503, 502, 504, high demand, etc.).
 * These are NOT quota errors and NOT auth/config errors.
 * The model is temporarily unavailable due to load/infrastructure — a different fallback is warranted.
 */
export function isTemporaryModelError(err: unknown): boolean {
  if (!err) return false;
  const errorObj = err as {
    status?: number;
    statusCode?: number;
    response?: { status?: number };
    message?: string;
    details?: string;
  };

  // Auth errors must never be classified as temporary
  if (isAuthConfigError(err)) return false;

  const status = errorObj.status || errorObj.statusCode || errorObj.response?.status;
  if (status === 502 || status === 503 || status === 504) return true;

  const message = (errorObj.message || String(err)).toLowerCase();
  const details = typeof errorObj.details === 'string' ? errorObj.details.toLowerCase() : '';
  const combined = `${message} ${details}`;

  return (
    combined.includes('503') ||
    combined.includes('502') ||
    combined.includes('service unavailable') ||
    combined.includes('high demand') ||
    combined.includes('temporarily unavailable') ||
    combined.includes('overloaded') ||
    combined.includes('busy') ||
    combined.includes('try again later') ||
    combined.includes('unavailable') && !combined.includes('api key') ||
    combined.includes('internal error') ||
    combined.includes('internal_error')
  );
}

export function isAuthConfigError(err: unknown): boolean {
  if (!err) return false;
  const errorObj = err as {
    status?: number;
    statusCode?: number;
    response?: { status?: number };
    message?: string;
  };

  const status = errorObj.status || errorObj.statusCode || errorObj.response?.status;
  if (status === 401 || status === 403) return true;

  const message = (errorObj.message || String(err)).toLowerCase();
  return (
    message.includes('api_key_invalid') ||
    message.includes('invalid api key') ||
    message.includes('api key not valid') ||
    message.includes('unauthorized') ||
    message.includes('forbidden')
  );
}

export function isTimeoutError(err: unknown): boolean {
  if (!err) return false;
  const errorObj = err as {
    status?: number;
    statusCode?: number;
    response?: { status?: number };
    message?: string;
  };

  const status = errorObj.status || errorObj.statusCode || errorObj.response?.status;
  if (status === 504) return true;

  const message = (errorObj.message || String(err)).toLowerCase();
  return (
    message.includes('timed out') ||
    message.includes('timeout') ||
    message.includes('deadline_exceeded')
  );
}

/**
 * Categorise any model-skippable error for logging.
 * Returns a short reason tag used in log messages.
 */
export function classifyModelError(err: unknown): 'quota' | 'temporary' | 'timeout' | 'auth' | 'unknown' {
  if (isQuotaExceededError(err)) return 'quota';
  if (isAuthConfigError(err)) return 'auth';
  if (isTemporaryModelError(err)) return 'temporary';
  if (isTimeoutError(err)) return 'timeout';
  return 'unknown';
}
