import { Platform } from 'react-native';

const RAW = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://bookmycleaning.xyz';
export const BASE_URL = RAW.replace(/\/+$/, '');
const API = `${BASE_URL}/api`;

// The app's OWN backend (image management). On web it is same-origin;
// on native builds it comes from EXPO_PUBLIC_IMAGES_URL.
function computeImagesBase() {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }
  return (process.env.EXPO_PUBLIC_IMAGES_URL || RAW).replace(/\/+$/, '');
}
export const IMAGES_BASE = computeImagesBase();
const IMAGES_API = `${IMAGES_BASE}/api`;

export function resolveImageUrl(url) {
  if (!url) return url;
  return url.startsWith('http') ? url : `${IMAGES_BASE}${url}`;
}

export async function fetchAppImages() {
  const res = await fetch(`${IMAGES_API}/app-images`);
  if (!res.ok) throw new Error('Failed to load images');
  return res.json();
}

export async function uploadAppImage(asset, label, password) {
  const form = new FormData();
  const name = asset.fileName || asset.name || 'image.jpg';
  const type = asset.mimeType || asset.type || 'image/jpeg';
  if (Platform.OS === 'web') {
    const blob = await (await fetch(asset.uri)).blob();
    form.append('file', new File([blob], name, { type: blob.type || type }));
  } else {
    form.append('file', { uri: asset.uri, name, type });
  }
  form.append('label', label || '');
  const res = await fetch(`${IMAGES_API}/app-images/upload`, {
    method: 'POST',
    headers: { 'X-Admin-Password': password },
    body: form,
  });
  if (res.status === 401) throw new Error('Session expired \u2014 please sign in again.');
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Upload failed (${res.status}). ${text.slice(0, 120)}`);
  }
  return res.json();
}

export async function deleteAppImage(imageId, password) {
  const res = await fetch(`${IMAGES_API}/app-images/${imageId}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Password': password },
  });
  if (!res.ok) throw new Error('Delete failed');
  return res.json();
}

export async function reorderAppImages(ids, password) {
  const res = await fetch(`${IMAGES_API}/app-images/reorder`, {
    method: 'POST',
    headers: { 'X-Admin-Password': password, 'Content-Type': 'application/json' },
    body: JSON.stringify({ order: ids }),
  });
  if (!res.ok) throw new Error('Reorder failed');
  return res.json();
}

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
