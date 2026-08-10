// Thin fetch wrapper around the Wellspire API.
import { getToken, getDemoRole } from './session.js';

const BASE = import.meta.env.VITE_API_BASE || '/api';

async function request(path, { method = 'GET', body, params } = {}) {
  let url = `${BASE}${path}`;
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)
    ).toString();
    if (qs) url += `?${qs}`;
  }
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  else headers['X-Demo-Role'] = getDemoRole(); // ignored by server in live mode
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  get: (p, params) => request(p, { params }),
  post: (p, body, params) => request(p, { method: 'POST', body, params }),
  patch: (p, body) => request(p, { method: 'PATCH', body }),
  del: (p) => request(p, { method: 'DELETE' }),
};

export default api;
