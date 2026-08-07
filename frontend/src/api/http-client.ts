import { clearAuth, getToken } from '../auth/token-storage';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api';

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

/** AuthProvider se registra aqui para reaccionar a un 401 (logout automatico). */
export function registerUnauthorizedHandler(handler: UnauthorizedHandler): void {
  onUnauthorized = handler;
}

export type QueryParams = Record<string, string | number | boolean | undefined>;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: QueryParams;
}

function buildPath(path: string, query?: QueryParams): string {
  const url = new URL(BASE_URL + path, window.location.origin);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.pathname + url.search;
}

interface ApiEnvelope<T> {
  data?: T;
  error?: { message: string; details?: unknown };
}

export interface PaginaMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPaginas: number;
}

export interface RespuestaPaginada<T> {
  data: T[];
  meta: PaginaMeta;
}

/** Descarga un archivo binario (export CSV/Excel/PDF) autenticado y dispara la descarga en el navegador. */
export async function apiDownload(path: string, query: QueryParams | undefined, nombreSugerido: string): Promise<void> {
  const token = getToken();
  const res = await fetch(buildPath(path, query), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearAuth();
      onUnauthorized?.();
    }
    const json: ApiEnvelope<unknown> | null = await res.json().catch(() => null);
    throw new ApiError(json?.error?.message ?? `Error ${res.status}`, res.status, json?.error?.details);
  }

  const disposition = res.headers.get('Content-Disposition') ?? '';
  const coincidencia = /filename="?([^"]+)"?/.exec(disposition);
  const nombreArchivo = coincidencia?.[1] ?? nombreSugerido;

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

/** Igual que apiRequest, pero conserva `meta` (paginacion) en vez de devolver solo `data`. */
export async function apiRequestPaginado<T>(path: string, options: RequestOptions = {}): Promise<RespuestaPaginada<T>> {
  const token = getToken();

  const res = await fetch(buildPath(path, options.query), {
    method: options.method ?? 'GET',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });

  const json: (ApiEnvelope<T[]> & { meta?: PaginaMeta }) | null = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401) {
      clearAuth();
      onUnauthorized?.();
    }
    throw new ApiError(json?.error?.message ?? `Error ${res.status}`, res.status, json?.error?.details);
  }

  return { data: json?.data ?? [], meta: json?.meta ?? { total: 0, page: 1, pageSize: 10, totalPaginas: 1 } };
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(buildPath(path, options.query), {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const json: ApiEnvelope<T> | null = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401) {
      clearAuth();
      onUnauthorized?.();
    }
    throw new ApiError(json?.error?.message ?? `Error ${res.status}`, res.status, json?.error?.details);
  }

  return json?.data as T;
}
