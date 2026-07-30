import type { ApiErrorBody, UploadJobStatus, UploadResponse } from '@/types/api';
import { getToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

export class ApiClientError extends Error {
  code: string;
  status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
  }
}

async function parseError(response: Response): Promise<ApiClientError> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return new ApiClientError(
      response.status,
      body.error?.code ?? 'UNKNOWN_ERROR',
      body.error?.message ?? response.statusText
    );
  } catch {
    return new ApiClientError(response.status, 'UNKNOWN_ERROR', response.statusText);
  }
}

function authHeaders(): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...authHeaders(),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function apiBlob(
  path: string,
  signal?: AbortSignal,
  options?: { preview?: boolean }
): Promise<Blob> {
  const headers: Record<string, string> = {
    ...(authHeaders() as Record<string, string>),
  };

  if (options?.preview) {
    headers['X-Document-Preview'] = '1';
  }

  const response = await fetch(`${API_URL}${path}`, {
    headers,
    signal,
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const buffer = await response.arrayBuffer();
  const contentType = response.headers.get('Content-Type') ?? '';

  if (options?.preview && contentType.includes('octet-stream')) {
    const pdfType = 'application/pdf';
    return new Blob([buffer], { type: pdfType });
  }

  if (options?.preview && contentType.startsWith('image/')) {
    return new Blob([buffer], { type: contentType });
  }

  return new Blob([buffer], { type: contentType || 'application/octet-stream' });
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    });
  } catch {
    throw new ApiClientError(
      503,
      'NETWORK_ERROR',
      'Could not reach the server. Ensure the backend is running and try again.'
    );
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  return response.json() as Promise<T>;
}

const UPLOAD_POLL_INTERVAL_MS = 2000;
const UPLOAD_MAX_POLL_MS = 15 * 60 * 1000;

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function apiUploadDocument(
  formData: FormData,
  onProgress?: (step: string) => void
): Promise<UploadResponse> {
  const accepted = await apiUpload<{ jobId: string; step?: string }>('/documents/upload', formData);
  onProgress?.(accepted.step ?? 'Upload received');

  const deadline = Date.now() + UPLOAD_MAX_POLL_MS;

  while (Date.now() < deadline) {
    await sleep(UPLOAD_POLL_INTERVAL_MS);

    const job = await apiRequest<UploadJobStatus>(`/documents/upload/jobs/${accepted.jobId}`);
    onProgress?.(job.step);

    if (job.status === 'completed' && job.result) {
      return job.result;
    }

    if (job.status === 'failed' && job.error) {
      throw new ApiClientError(
        job.error.code === 'DUPLICATE_DOCUMENT' ? 409 : 400,
        job.error.code,
        job.error.message
      );
    }
  }

  throw new ApiClientError(
    408,
    'UPLOAD_TIMEOUT',
    'Document processing timed out after 15 minutes. Try again.'
  );
}

export { API_URL };
