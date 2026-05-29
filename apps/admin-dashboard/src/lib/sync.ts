import { getSyncQueue, clearSyncItem } from './db';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function syncPendingQueue() {
  const queue = await getSyncQueue();
  if (!queue.length) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('shms_token') : null;
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      await fetch(`${BASE_URL}${item.url}`, {
        method: item.method,
        headers,
        body: item.body ? JSON.stringify(item.body) : undefined,
      });

      await clearSyncItem(item.id!);
      synced++;
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}
