import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storageService, IDB_STORES } from '../services/storageService';

describe('StorageService Dual-Tier & Error Resilience', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores and retrieves data from LocalStorage cleanly', () => {
    const key = 'test_key';
    const data = { user: 'Alice', score: 42 };

    const success = storageService.setLocal(key, data);
    expect(success).toBe(true);

    const retrieved = storageService.getLocal(key, null);
    expect(retrieved).toEqual(data);
  });

  it('recovers gracefully from corrupted JSON in localStorage with auto-repair', () => {
    const corruptKey = 'test_corrupt_key';
    // Intentionally write broken JSON string
    localStorage.setItem(corruptKey, '{ brokenJson: [ unclosed }');

    const fallback = { status: 'default' };
    const result = storageService.getLocal(corruptKey, fallback);

    expect(result).toEqual(fallback);
    // Corrupted item should be cleared from original key
    expect(localStorage.getItem(corruptKey)).toBeNull();
  });

  it('handles removeLocal and clearAllLocal', () => {
    storageService.setLocal('key1', 'val1');
    storageService.setLocal('key2', 'val2');

    storageService.removeLocal('key1');
    expect(storageService.getLocal('key1', null)).toBeNull();
    expect(storageService.getLocal('key2', null)).toBe('val2');

    storageService.clearAllLocal();
    expect(storageService.getLocal('key2', null)).toBeNull();
  });

  it('stores and retrieves records with memory fallback when IDB is unavailable or in memory', async () => {
    const ticketRecord = { ticketId: 't_123', movieTitle: 'Interstellar' };
    const saved = await storageService.setIDB(IDB_STORES.TICKETS, ticketRecord);
    expect(saved).toBe(true);

    const fetched = await storageService.getIDB<typeof ticketRecord>(IDB_STORES.TICKETS, 't_123');
    expect(fetched?.movieTitle).toBe('Interstellar');

    const all = await storageService.getAllIDB<typeof ticketRecord>(IDB_STORES.TICKETS);
    expect(all.length).toBeGreaterThanOrEqual(1);

    await storageService.removeIDB(IDB_STORES.TICKETS, 't_123');
    const afterDelete = await storageService.getIDB(IDB_STORES.TICKETS, 't_123');
    expect(afterDelete).toBeNull();
  });
});
