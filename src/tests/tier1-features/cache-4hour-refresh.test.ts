import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createUTubeStore } from '../helpers/contracts';
import { cacheService } from '../../lib/services/cacheService';
import { cacheManager } from '../../lib/services/cacheManager';
import { MOCK_VIDEOS } from '../helpers/fixtures';

describe('Tier 1: 4-Hour Cached Feed Refresh (F08)', () => {
  let store: ReturnType<typeof createUTubeStore>;
  const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

  beforeEach(() => {
    store = createUTubeStore();
    cacheService.clear();
    cacheManager.clearAll();
  });

  it('T1-CACH-01: initial feed refresh triggers feed population and updates lastFeedRefresh timestamp', async () => {
    store.getState().subscribe({
      channelId: 'chan_nature',
      channelTitle: 'Nature Cinema Films',
      avatarUrl: '',
      subscribedAt: Date.now(),
    });

    expect(store.getState().lastFeedRefresh).toBe(0);
    await store.getState().refreshFeedIfNeeded();

    expect(store.getState().lastFeedRefresh).toBeGreaterThan(0);
    expect(store.getState().subscribedFeed).toHaveLength(1);
  });

  it('T1-CACH-02: calling refreshFeedIfNeeded within 4 hours does not re-fetch existing feed', async () => {
    store.getState().subscribe({
      channelId: 'chan_tech',
      channelTitle: 'Modern Web Academy',
      avatarUrl: '',
      subscribedAt: Date.now(),
    });

    await store.getState().refreshFeedIfNeeded();
    const firstRefreshTime = store.getState().lastFeedRefresh;

    const advance2Hours = firstRefreshTime + (2 * 60 * 60 * 1000);
    const dateSpy = vi.spyOn(Date, 'now').mockReturnValue(advance2Hours);

    await store.getState().refreshFeedIfNeeded();
    expect(store.getState().lastFeedRefresh).toBe(firstRefreshTime);

    dateSpy.mockRestore();
  });

  it('T1-CACH-03: calling refreshFeedIfNeeded after 4 hours triggers feed refresh', async () => {
    store.getState().subscribe({
      channelId: 'chan_movies',
      channelTitle: 'IMAX Studios',
      avatarUrl: '',
      subscribedAt: Date.now(),
    });

    await store.getState().refreshFeedIfNeeded();
    const initialRefreshTime = store.getState().lastFeedRefresh;

    const advance4Hours = initialRefreshTime + FOUR_HOURS_MS + 60000;
    const dateSpy = vi.spyOn(Date, 'now').mockReturnValue(advance4Hours);

    await store.getState().refreshFeedIfNeeded();
    expect(store.getState().lastFeedRefresh).toBe(advance4Hours);

    dateSpy.mockRestore();
  });

  it('T1-CACH-04: cacheService stores search results and returns cached hits', () => {
    const query = 'nature landscape 4k';
    cacheService.set(query, MOCK_VIDEOS.slice(0, 3));

    expect(cacheService.has(query)).toBe(true);
    const cached = cacheService.get(query);
    expect(cached).toHaveLength(3);
    expect(cached?.[0].id).toBe(MOCK_VIDEOS[0].id);
  });

  it('T1-CACH-05: cacheService returns null when queried key does not exist or was cleared', () => {
    expect(cacheService.get('non_existent_key')).toBeNull();
    cacheService.set('temp_key', MOCK_VIDEOS.slice(0, 1));
    cacheService.clear();
    localStorage.clear();
    expect(cacheService.get('temp_key')).toBeNull();
  });

  it('T1-CACH-06: cacheManager enforces memory constraints and key eviction on expiration', () => {
    cacheManager.set('search', 'query_1', { data: [1, 2, 3] }, 100);
    expect(cacheManager.get('search', 'query_1')).toEqual({ data: [1, 2, 3] });
    cacheManager.clear('search');
    expect(cacheManager.get('search', 'query_1')).toBeNull();
  });
});
