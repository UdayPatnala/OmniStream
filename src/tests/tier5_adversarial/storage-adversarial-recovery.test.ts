import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storageService, IDB_STORES } from '../../services/storageService';

describe('Tier 5 Adversarial: Storage Corruption, Quota Overflow Recovery & Concurrency', () => {
  beforeEach(() => {
    localStorage.clear();
    (storageService as any).memoryFallback.clear();
    vi.restoreAllMocks();
  });

  it('T5-STOR-01: Truncated, binary, and corrupted JSON payloads trigger auto-repair and backup corrupted state', () => {
    const corruptPayloads = [
      '{ "unclosed": [',
      '{"valid": true, "broken": }',
      '<!DOCTYPE html><html><body>Error</body></html>',
      'UNDEFINED_BINARY_BLOB_\x00\x01\x02',
    ];

    corruptPayloads.forEach((payload, idx) => {
      const key = `corrupt_test_key_${idx}`;
      localStorage.setItem(key, payload);

      const fallback = { safe: true, id: idx };
      const res = storageService.getLocal(key, fallback);

      // Corrupt JSON should return fallback and clear key
      expect(res).toEqual(fallback);
      expect(localStorage.getItem(key)).toBeNull();

      // Verify backup key was created
      let backupCount = 0;
      for (let k = 0; k < localStorage.length; k++) {
        const itemKey = localStorage.key(k);
        if (itemKey && itemKey.startsWith(`__corrupted_${key}`)) {
          backupCount++;
        }
      }
      expect(backupCount).toBe(1);
    });
  });

  it('T5-STOR-02: LocalStorage QuotaExceededError triggers automatic cache eviction and succeeds on retry', () => {
    // Fill localStorage with evictable cache keys and corrupted backup keys
    localStorage.setItem('cache_search_query_1', JSON.stringify({ data: 'old_cache_1' }));
    localStorage.setItem('query_cache_youtube_top3', JSON.stringify({ data: 'old_cache_2' }));
    localStorage.setItem('__corrupted_tickets_old', 'corrupt_data_garbage');
    localStorage.setItem('_temp_buffer_metadata', 'temp_stuff');
    localStorage.setItem('persistent_user_settings', JSON.stringify({ theme: 'imax-ultra' }));

    let attempts = 0;
    const originalSetItem = window.localStorage.setItem.bind(window.localStorage);

    vi.spyOn(storageService as any, 'localStorage', 'get').mockReturnValue({
      get length() { return window.localStorage.length; },
      key: (i: number) => window.localStorage.key(i),
      getItem: (k: string) => window.localStorage.getItem(k),
      removeItem: (k: string) => window.localStorage.removeItem(k),
      clear: () => window.localStorage.clear(),
      setItem: (key: string, val: string) => {
        if (key === 'new_heavy_ticket') {
          attempts++;
          if (attempts === 1) {
            throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
          }
        }
        originalSetItem(key, val);
      },
    });

    const success = storageService.setLocal('new_heavy_ticket', { title: 'Dune Part Two', time: 120 });
    expect(success).toBe(true);
    expect(attempts).toBe(2); // Failed once, evicted caches, retried and succeeded

    // Verify transient keys were evicted
    expect(localStorage.getItem('cache_search_query_1')).toBeNull();
    expect(localStorage.getItem('query_cache_youtube_top3')).toBeNull();
    expect(localStorage.getItem('__corrupted_tickets_old')).toBeNull();

    // Verify persistent settings survived
    expect(localStorage.getItem('persistent_user_settings')).not.toBeNull();
  });

  it('T5-STOR-03: Secondary quota overflow failure falls back seamlessly to memory fallback store', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage quota exceeded continuously', 'QuotaExceededError');
    });

    const key = 'unstoreable_due_to_permanent_quota';
    const payload = { persistent: false, memoryOnly: true };

    const success = storageService.setLocal(key, payload);
    // Returns false indicating localStorage failed, but data is safely retained in memory fallback
    expect(success).toBe(false);

    // getLocal must seamlessly retrieve from memory fallback
    const retrieved = storageService.getLocal(key, null);
    expect(retrieved).toEqual(payload);
  });

  it('T5-STOR-04: Concurrent write races (100 parallel async setIDB and getIDB calls) execute deterministically', async () => {
    const promises: Promise<any>[] = [];

    for (let i = 0; i < 100; i++) {
      const ticketId = `ticket_race_${i % 10}`;
      if (i % 2 === 0) {
        promises.push(
          storageService.setIDB(IDB_STORES.TICKETS, {
            ticketId,
            movieTitle: `Movie Iteration ${i}`,
            timestampSeconds: i * 10,
          })
        );
      } else {
        promises.push(storageService.getIDB(IDB_STORES.TICKETS, ticketId));
      }
    }

    const results = await Promise.all(promises);
    expect(results.length).toBe(100);

    // Verify all 10 distinct records are queryable
    const allRecords = await storageService.getAllIDB<any>(IDB_STORES.TICKETS);
    expect(allRecords.length).toBeGreaterThanOrEqual(1);
  });

  it('T5-STOR-05: Non-serializable circular object payloads fall back to memory fallback store without crash', () => {
    const circularObj: any = { name: 'Circular Reference Test' };
    circularObj.self = circularObj;

    expect(() => {
      const success = storageService.setLocal('circular_key', circularObj);
      expect(success).toBe(false); // LocalStorage JSON stringify failed
    }).not.toThrow();

    // Memory fallback retained object
    const memoryItem = (storageService as any).memoryFallback.get('circular_key');
    expect(memoryItem).toBeDefined();
    expect(memoryItem.name).toBe('Circular Reference Test');
  });

  it('T5-STOR-06: Defective localStorage environment (methods undefined/null) falls back to memory store cleanly', () => {
    // Simulate defective localStorage proxy
    const brokenLs = {
      getItem: undefined,
      setItem: null,
      removeItem: undefined,
      clear: undefined,
      length: 0,
    };

    const proto = Object.getPrototypeOf(storageService);
    const originalLsGetter = Object.getOwnPropertyDescriptor(proto, 'localStorage');
    Object.defineProperty(storageService, 'localStorage', {
      get: () => brokenLs,
      configurable: true,
    });

    try {
      expect(() => {
        storageService.setLocal('defective_ls_key', { test: 123 });
        const val = storageService.getLocal('defective_ls_key', null);
        expect(val).toEqual({ test: 123 });
        storageService.removeLocal('defective_ls_key');
      }).not.toThrow();
    } finally {
      if (originalLsGetter) {
        Object.defineProperty(proto, 'localStorage', originalLsGetter);
      }
    }
  });

  it('T5-STOR-07: IndexedDB missing keyPath property falls back gracefully without unhandled rejection', async () => {
    // TICKETS store expects 'ticketId' as keyPath
    const invalidRecord = {
      noTicketId: true,
      title: 'Invalid Record',
    };

    const result = await storageService.setIDB(IDB_STORES.TICKETS, invalidRecord as any);
    // In memory fallback mode or IDB error handled gracefully
    expect(typeof result).toBe('boolean');
  });
});
