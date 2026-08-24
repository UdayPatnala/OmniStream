/**
 * OmniStream Dual-Tier Storage Service
 * 
 * Provides robust LocalStorage & IndexedDB persistence with:
 * 1. Resilient JSON parsing with automatic corrupt data backup and fallback recovery.
 * 2. QuotaExceededError eviction mitigation.
 * 3. In-Memory fallback store for incognito or restricted browser environments.
 * 4. Async IndexedDB object stores for heavy ticket thumbnails, offline cache, and media metadata.
 */

const DB_NAME = 'omnistream-db';
const DB_VERSION = 1;

export const IDB_STORES = {
  TICKETS: 'tickets',
  OFFLINE_VIDEOS: 'offline_videos',
  MEDIA_BLOBS: 'media_blobs',
  METADATA: 'metadata',
} as const;

export type IDBStoreName = typeof IDB_STORES[keyof typeof IDB_STORES];

class StorageService {
  private memoryFallback: Map<string, any> = new Map();
  private dbPromise: Promise<IDBDatabase | null> | null = null;

  private get localStorage(): Storage | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {
        return window.localStorage;
      }
      if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage && typeof (globalThis as any).localStorage.getItem === 'function') {
        return (globalThis as any).localStorage;
      }
    } catch {
      return null;
    }
    return null;
  }

  // ==========================================
  // Synchronous LocalStorage Tier with Auto-Repair
  // ==========================================

  public getLocal<T>(key: string, fallbackValue: T): T {
    const ls = this.localStorage;
    if (!ls || typeof ls.getItem !== 'function') {
      return this.memoryFallback.has(key) ? (this.memoryFallback.get(key) as T) : fallbackValue;
    }

    try {
      const raw = ls.getItem(key);
      if (raw === null || raw === undefined) {
        return this.memoryFallback.has(key) ? (this.memoryFallback.get(key) as T) : fallbackValue;
      }

      return JSON.parse(raw) as T;
    } catch (parseError) {
      console.warn(`[StorageService] Corrupt JSON detected for key "${key}". Initiating auto-repair...`, parseError);
      this.autoRepairCorruptLocalKey(key);
      return this.memoryFallback.has(key) ? (this.memoryFallback.get(key) as T) : fallbackValue;
    }
  }

  public setLocal<T>(key: string, value: T): boolean {
    const ls = this.localStorage;
    if (!ls || typeof ls.setItem !== 'function') {
      this.memoryFallback.set(key, value);
      return true;
    }

    try {
      const serialized = JSON.stringify(value);
      ls.setItem(key, serialized);
      return true;
    } catch (err: any) {
      const isQuota =
        err?.name === 'QuotaExceededError' ||
        err?.code === 22 ||
        err?.number === -2147024882 ||
        String(err?.message || '').toLowerCase().includes('quota') ||
        String(err || '').toLowerCase().includes('quota');

      if (isQuota) {
        console.warn('[StorageService] LocalStorage quota exceeded. Evicting temporary caches and retrying...');
        this.evictTemporaryCaches();
        try {
          ls.setItem(key, JSON.stringify(value));
          return true;
        } catch (retryErr) {
          console.error('[StorageService] Write failed after cache eviction, falling back to memory store:', retryErr);
          this.memoryFallback.set(key, value);
          return false;
        }
      }

      console.error(`[StorageService] Error setting key "${key}":`, err);
      this.memoryFallback.set(key, value);
      return false;
    }
  }

  public removeLocal(key: string): void {
    const ls = this.localStorage;
    if (ls && typeof ls.removeItem === 'function') {
      try {
        ls.removeItem(key);
      } catch (err) {
        console.error(`[StorageService] Error removing key "${key}":`, err);
      }
    }
    this.memoryFallback.delete(key);
  }

  public clearAllLocal(): void {
    const ls = this.localStorage;
    if (ls && typeof ls.clear === 'function') {
      try {
        ls.clear();
      } catch (err) {
        console.error('[StorageService] Error clearing localStorage:', err);
      }
    }
    this.memoryFallback.clear();
  }

  private autoRepairCorruptLocalKey(key: string): void {
    const ls = this.localStorage;
    if (!ls || typeof ls.getItem !== 'function' || typeof ls.setItem !== 'function' || typeof ls.removeItem !== 'function') return;
    try {
      const rawCorrupt = ls.getItem(key);
      if (rawCorrupt) {
        const backupKey = `__corrupted_${key}_${Date.now()}`;
        ls.setItem(backupKey, rawCorrupt);
        console.warn(`[StorageService] Corrupted data backed up to "${backupKey}" and reset.`);
      }
      ls.removeItem(key);
    } catch (repairErr) {
      console.error('[StorageService] Failed to auto-repair corrupt key:', repairErr);
    }
  }

  private evictTemporaryCaches(): void {
    const ls = this.localStorage;
    if (!ls || typeof ls.key !== 'function' || typeof ls.removeItem !== 'function') return;
    try {
      const keysToRemove: string[] = [];
      const len = typeof ls.length === 'number' ? ls.length : 0;
      for (let i = 0; i < len; i++) {
        const key = ls.key(i);
        if (key) {
          // Remove query caches and old corrupted backups
          if (
            key.startsWith('__corrupted_') ||
            key.startsWith('cache_') ||
            key.startsWith('query_cache_') ||
            key.includes('_temp_')
          ) {
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach((k) => {
        try {
          ls.removeItem(k);
        } catch {}
      });
    } catch (e) {
      console.error('[StorageService] Cache eviction error:', e);
    }
  }

  // ==========================================
  // Asynchronous IndexedDB Tier
  // ==========================================

  public async getIDBDatabase(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return null;
    }
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise<IDBDatabase | null>((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;
          // Create object stores if not existing
          if (!db.objectStoreNames.contains(IDB_STORES.TICKETS)) {
            db.createObjectStore(IDB_STORES.TICKETS, { keyPath: 'ticketId' });
          }
          if (!db.objectStoreNames.contains(IDB_STORES.OFFLINE_VIDEOS)) {
            db.createObjectStore(IDB_STORES.OFFLINE_VIDEOS, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(IDB_STORES.MEDIA_BLOBS)) {
            db.createObjectStore(IDB_STORES.MEDIA_BLOBS, { keyPath: 'key' });
          }
          if (!db.objectStoreNames.contains(IDB_STORES.METADATA)) {
            db.createObjectStore(IDB_STORES.METADATA, { keyPath: 'key' });
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          console.warn('[StorageService] IndexedDB open error, using memory fallback:', request.error);
          resolve(null);
        };
      } catch (err) {
        console.warn('[StorageService] IndexedDB unavailable, using memory fallback:', err);
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  public async getIDB<T>(storeName: IDBStoreName, key: IDBValidKey): Promise<T | null> {
    const db = await this.getIDBDatabase();
    if (!db) {
      const memKey = `idb_${storeName}_${String(key)}`;
      return this.memoryFallback.has(memKey) ? (this.memoryFallback.get(memKey) as T) : null;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(key);

        req.onsuccess = () => {
          resolve(req.result !== undefined ? req.result : null);
        };

        req.onerror = () => {
          console.warn(`[StorageService] Error reading key "${String(key)}" from store "${storeName}":`, req.error);
          resolve(null);
        };
      } catch (err) {
        console.warn(`[StorageService] Transaction error on store "${storeName}":`, err);
        resolve(null);
      }
    });
  }

  public async setIDB<T extends Record<string, any>>(storeName: IDBStoreName, value: T): Promise<boolean> {
    const db = await this.getIDBDatabase();
    if (!db) {
      // Determine key path
      const keyProp = storeName === IDB_STORES.TICKETS ? 'ticketId' : storeName === IDB_STORES.OFFLINE_VIDEOS ? 'id' : 'key';
      const keyVal = value[keyProp] || String(Date.now());
      const memKey = `idb_${storeName}_${keyVal}`;
      this.memoryFallback.set(memKey, value);
      return true;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(value);

        req.onsuccess = () => resolve(true);
        req.onerror = () => {
          console.warn(`[StorageService] Error putting record into store "${storeName}":`, req.error);
          resolve(false);
        };
      } catch (err) {
        console.warn(`[StorageService] Transaction error on store "${storeName}":`, err);
        resolve(false);
      }
    });
  }

  public async removeIDB(storeName: IDBStoreName, key: IDBValidKey): Promise<boolean> {
    const db = await this.getIDBDatabase();
    if (!db) {
      const memKey = `idb_${storeName}_${String(key)}`;
      this.memoryFallback.delete(memKey);
      return true;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(key);

        req.onsuccess = () => resolve(true);
        req.onerror = () => {
          console.warn(`[StorageService] Error deleting key "${String(key)}" from store "${storeName}":`, req.error);
          resolve(false);
        };
      } catch (err) {
        console.warn(`[StorageService] Transaction error on store "${storeName}":`, err);
        resolve(false);
      }
    });
  }

  public async getAllIDB<T>(storeName: IDBStoreName): Promise<T[]> {
    const db = await this.getIDBDatabase();
    if (!db) {
      const prefix = `idb_${storeName}_`;
      const results: T[] = [];
      this.memoryFallback.forEach((val, k) => {
        if (k.startsWith(prefix)) {
          results.push(val as T);
        }
      });
      return results;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();

        req.onsuccess = () => {
          resolve(req.result || []);
        };

        req.onerror = () => {
          console.warn(`[StorageService] Error getting all from store "${storeName}":`, req.error);
          resolve([]);
        };
      } catch (err) {
        console.warn(`[StorageService] Transaction error on store "${storeName}":`, err);
        resolve([]);
      }
    });
  }
}

export const storageService = new StorageService();
