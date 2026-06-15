const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
export const AUTH_TOKEN_KEY = 'accessToken';
export const AUTH_USER_KEY = 'user';

type RequestOptions = RequestInit & {
  skipAuth?: boolean;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getAccessToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAccessToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAccessToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function clearAuthStorage() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  window.dispatchEvent(new Event('auth:logout'));
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !options.skipAuth) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthStorage();
    }

    const message = Array.isArray(data?.message)
      ? data.message.join(', ')
      : data?.message || 'Error en la solicitud';

    throw new ApiError(message, response.status);
  }

  return data as T;
}

export function getRequest<T>(path: string, options?: RequestOptions) {
  return apiRequest<T>(path, { ...options, method: 'GET' });
}

export function postRequest<T, B = unknown>(path: string, body?: B, options?: RequestOptions) {
  return apiRequest<T>(path, {
    ...options,
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function postFormRequest<T>(path: string, body: FormData, options?: RequestOptions) {
  return apiRequest<T>(path, {
    ...options,
    method: 'POST',
    body,
  });
}

export function patchRequest<T, B = unknown>(path: string, body?: B, options?: RequestOptions) {
  return apiRequest<T>(path, {
    ...options,
    method: 'PATCH',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function deleteRequest<T>(path: string, options?: RequestOptions) {
  return apiRequest<T>(path, { ...options, method: 'DELETE' });
}
