import { config } from './config';
import { formatErrorMessage } from './error-messages';

export class ApiError extends Error {
  public readonly statusCode?: number;
  public readonly errorCode?: string;
  public readonly params?: Record<string, unknown>;

  constructor(message: string, statusCode?: number, errorCode?: string, params?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.params = params;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 2,
  retryDelayMs = 1500,
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${config.apiUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('X-Requested-With')) {
    headers.set('X-Requested-With', 'XMLHttpRequest');
  }

  const method = (options.method || 'GET').toUpperCase();
  const isIdempotent = method === 'GET' || method === 'HEAD';

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkError) {
    if (isIdempotent && retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      return apiClient<T>(endpoint, options, retries - 1, retryDelayMs * 1.5);
    }
    throw networkError;
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = formatErrorMessage(
      errorData.errorCode,
      errorData.params,
      errorData.message || `คำขอไม่สำเร็จ (HTTP ${res.status})`,
    );
    throw new ApiError(message, res.status, errorData.errorCode, errorData.params);
  }

  return res.json() as Promise<T>;
}
