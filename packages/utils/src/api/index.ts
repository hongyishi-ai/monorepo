export interface ApiClientOptions {
  baseUrl?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  params?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  message?: string;
}

export function createApiClient(options: ApiClientOptions = {}) {
  const { baseUrl = '', headers = {}, timeout = 30000 } = options;

  async function request<T>(path: string, config: ApiRequestConfig = {}): Promise<ApiResponse<T>> {
    const { method = 'GET', headers: extraHeaders = {}, params, body, timeout: reqTimeout = timeout } = config;

    const url = new URL(path, baseUrl);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), reqTimeout);

    try {
      const res = await fetch(url.toString(), {
        method,
        headers: { ...headers, ...extraHeaders, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timer);
      const data = await res.json().catch(() => ({}));
      return { data: data as T, status: res.status, message: data?.message };
    } catch (err: unknown) {
      clearTimeout(timer);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`Request timeout after ${reqTimeout}ms`);
      }
      throw err;
    }
  }

  return {
    get: <T>(path: string, config?: ApiRequestConfig) => request<T>(path, { ...config, method: 'GET' }),
    post: <T>(path: string, config?: ApiRequestConfig) => request<T>(path, { ...config, method: 'POST' }),
    put: <T>(path: string, config?: ApiRequestConfig) => request<T>(path, { ...config, method: 'PUT' }),
    patch: <T>(path: string, config?: ApiRequestConfig) => request<T>(path, { ...config, method: 'PATCH' }),
    delete: <T>(path: string, config?: ApiRequestConfig) => request<T>(path, { ...config, method: 'DELETE' }),
  };
}
