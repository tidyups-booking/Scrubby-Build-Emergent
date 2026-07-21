const RAW = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://bookmycleaning.xyz';
export const BASE_URL = RAW.replace(/\/+$/, '');
const API = `${BASE_URL}/api`;

export async function submitQuote(payload) {
  const res = await fetch(`${API}/quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Could not submit request (${res.status}). ${text.slice(0, 120)}`);
  }
  return res.json();
}

export async function adminLogin(password) {
  const res = await fetch(`${API}/admin/login`, {
    method: 'POST',
    headers: { 'X-Admin-Password': password },
  });
  if (res.status === 401) throw new Error('Incorrect password');
  if (!res.ok) throw new Error('Login failed — please try again');
  return true;
}

export async function fetchQuotes(password) {
  const res = await fetch(`${API}/quotes`, {
    headers: { 'X-Admin-Password': password },
  });
  if (res.status === 401) {
    const err = new Error('unauthorized');
    err.code = 401;
    throw err;
  }
  if (!res.ok) throw new Error('Failed to load leads');
  return res.json();
}

export function formatDate(iso) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso || '';
    const date = d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
    const time = d.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' });
    return `${date} · ${time}`;
  } catch (e) {
    return iso || '';
  }
}
