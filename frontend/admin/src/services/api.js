const ENV_API_URL = import.meta.env.VITE_API_URL;

export const API_URL =
  ENV_API_URL || `${window.location.protocol}//${window.location.hostname}:8080`;

export const ADMIN_STORAGE_KEY = 'lemondesteak_admin_auth';

export function getAdminAuth() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

export function saveAdminAuth(auth) {
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(auth));
}

export function clearAdminAuth() {
  localStorage.removeItem(ADMIN_STORAGE_KEY);
}

export async function api(path, options = {}) {
  const auth = getAdminAuth();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (auth?.token) {
    headers.Authorization = `Bearer ${auth.token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const text = await response.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = {
      message: text
    };
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.error || `HTTP ${response.status}`);
  }

  return data;
}