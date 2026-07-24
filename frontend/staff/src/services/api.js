const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const STAFF_AUTH_KEY = 'staffAuth';

export function getStaffAuth() {
  try {
    return JSON.parse(localStorage.getItem(STAFF_AUTH_KEY) || 'null');
  } catch {
    return null;
  }
}

export function saveStaffAuth(auth) {
  localStorage.setItem(STAFF_AUTH_KEY, JSON.stringify(auth));
}

export function clearStaffAuth() {
  localStorage.removeItem(STAFF_AUTH_KEY);
}

export async function api(path, options = {}) {
  const auth = getStaffAuth();
  const token = auth?.token || auth?.accessToken || auth?.jwt;

  const headers = {
    ...(options.headers || {})
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body:
      options.body instanceof FormData
        ? options.body
        : options.body
          ? JSON.stringify(options.body)
          : undefined
  });

  const text = await response.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      data ||
      `Lỗi hệ thống: ${response.status}`;

    throw new Error(message);
  }

  return data;
}