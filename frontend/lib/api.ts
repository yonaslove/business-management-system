const PRIMARY_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const FALLBACK_API_URL = 'http://127.0.0.1:8000/api';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('bms_token');
}

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('bms_token', token);
  }
}

export function removeAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('bms_token');
    localStorage.removeItem('bms_user');
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const tryFetch = async (baseUrl: string) => {
    const url = `${baseUrl}${endpoint}`;
    return await fetch(url, {
      ...options,
      headers,
    });
  };

  let res: Response;
  try {
    res = await tryFetch(PRIMARY_API_URL);
  } catch (err: any) {
    if (PRIMARY_API_URL.includes('localhost') || PRIMARY_API_URL.includes('127.0.0.1')) {
      try {
        res = await tryFetch(FALLBACK_API_URL);
      } catch (fallbackErr) {
        throw new Error(
          'Unable to connect to local backend server. Please verify the FastAPI server is running on http://127.0.0.1:8000.'
        );
      }
    } else {
      throw new Error(
        'Unable to connect to the backend API. Please verify the backend service is running and CORS is allowed.'
      );
    }
  }

  if (res.status === 401) {
    removeAuthToken();
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && window.location.pathname !== '/') {
      window.location.href = '/login?expired=1';
    }
    throw new Error('Your session has expired. Please log in again.');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.message || 'An error occurred with your request.');
  }

  return data as T;
}
