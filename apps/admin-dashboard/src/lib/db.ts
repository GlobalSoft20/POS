import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface SHMSDb extends DBSchema {
  products: { key: string; value: any; indexes: { 'by-category': string } };
  categories: { key: string; value: any };
  tables: { key: string; value: any };
  orders: { key: string; value: any; indexes: { 'by-status': string } };
  settings: { key: string; value: any };
  sync_queue: { key: number; value: { id?: number; method: string; url: string; body: any; createdAt: number }; autoIncrement: true };
}

let db: IDBPDatabase<SHMSDb>;

export async function getDB() {
  if (db) return db;
  db = await openDB<SHMSDb>('shms-offline', 1, {
    upgrade(db) {
      const products = db.createObjectStore('products', { keyPath: 'id' });
      products.createIndex('by-category', 'categoryId');
      db.createObjectStore('categories', { keyPath: 'id' });
      db.createObjectStore('tables', { keyPath: 'id' });
      const orders = db.createObjectStore('orders', { keyPath: 'id' });
      orders.createIndex('by-status', 'status');
      db.createObjectStore('settings', { keyPath: 'id' });
      db.createObjectStore('sync_queue', { autoIncrement: true, keyPath: 'id' });
    },
  });
  return db;
}

export async function saveToLocal<T extends 'products' | 'categories' | 'tables' | 'orders' | 'settings'>(
  store: T, items: any[]
) {
  const db = await getDB();
  const tx = db.transaction(store, 'readwrite');
  await Promise.all(items.map((item) => tx.store.put(item)));
  await tx.done;
}

export async function getFromLocal<T extends 'products' | 'categories' | 'tables' | 'orders' | 'settings'>(
  store: T
): Promise<any[]> {
  const db = await getDB();
  return db.getAll(store);
}

export async function addToSyncQueue(method: string, url: string, body: any) {
  const db = await getDB();
  await db.add('sync_queue', { method, url, body, createdAt: Date.now() });
}

export async function getSyncQueue() {
  const db = await getDB();
  return db.getAll('sync_queue');
}

export async function clearSyncItem(id: number) {
  const db = await getDB();
  await db.delete('sync_queue', id);
}
