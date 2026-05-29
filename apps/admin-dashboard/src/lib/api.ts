import axios from 'axios';
import { saveToLocal, getFromLocal, addToSyncQueue } from './db';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const http = axios.create({ baseURL: BASE_URL });

http.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('shms_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('shms_token');
      window.location.href = '/auth';
    }
    return Promise.reject(err.response?.data || err);
  },
);

export function isOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

// Smart fetch: tries API first, falls back to local cache
async function smartGet(url: string, store?: 'products' | 'categories' | 'tables' | 'orders' | 'settings') {
  if (isOnline()) {
    try {
      const data = await http.get(url);
      // Cache the result locally
      if (store && Array.isArray(data)) {
        await saveToLocal(store, data as any[]);
      }
      return data;
    } catch {
      // Fall through to offline
    }
  }
  // Offline fallback
  if (store) {
    return getFromLocal(store);
  }
  throw new Error('Offline and no cache available');
}

// Smart mutation: tries API, queues if offline
async function smartMutate(method: 'post' | 'put' | 'delete', url: string, body?: any) {
  if (isOnline()) {
    return http[method](url, body);
  }
  // Queue for later sync
  await addToSyncQueue(method.toUpperCase(), url, body);
  // Return optimistic local response
  return { ...body, id: `offline_${Date.now()}`, _offline: true };
}

const api = {
  get: (url: string, store?: 'products' | 'categories' | 'tables' | 'orders' | 'settings') =>
    smartGet(url, store),
  post: (url: string, body?: any) => smartMutate('post', url, body),
  put: (url: string, body?: any) => smartMutate('put', url, body),
  delete: (url: string) => smartMutate('delete', url),
};

export default api;
