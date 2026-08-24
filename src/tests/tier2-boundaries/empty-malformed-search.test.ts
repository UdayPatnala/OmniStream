import { describe, it, expect, beforeEach } from 'vitest';
import { searchAndRankVideos } from '../../lib/services/searchService';
import { searchVideos, fetchSearchSuggestions } from '../../lib/youtube';
import { createUTubeStore } from '../helpers/contracts';

describe('Tier 2: Empty & Malformed Search Queries (Boundary)', () => {
  let store: ReturnType<typeof createUTubeStore>;

  beforeEach(() => {
    store = createUTubeStore();
  });

  it('T2-ESRCH-01: empty string ("") search returns empty array and does not crash', async () => {
    const results = await store.getState().search('');
    expect(results).toEqual([]);
    expect(store.getState().searchResults).toEqual([]);
  });

  it('T2-ESRCH-02: whitespace-only strings ("    ") return empty array', async () => {
    const results = await searchAndRankVideos('   \t\n  ');
    expect(results).toEqual([]);
  });

  it('T2-ESRCH-03: special characters and punctuation handle cleanly', async () => {
    const results = await searchAndRankVideos('???$$$###@@@%%%^^^&*()');
    expect(Array.isArray(results)).toBe(true);
  });

  it('T2-ESRCH-04: extremely long query (>1000 characters) processes safely', async () => {
    const longQuery = 'cinematic '.repeat(120);
    const results = await searchVideos(longQuery);
    expect(results).toBeDefined();
    expect(Array.isArray(results.results)).toBe(true);
  });

  it('T2-ESRCH-05: query with unicode emojis and non-latin characters returns safely', async () => {
    const results = await searchAndRankVideos('🔥🍿 映画 4K');
    expect(Array.isArray(results)).toBe(true);
  });

  it('T2-ESRCH-06: fetchSearchSuggestions handles 1-char or empty query by returning empty array', async () => {
    const resEmpty = await fetchSearchSuggestions('');
    const resOne = await fetchSearchSuggestions('a');
    expect(resEmpty).toEqual([]);
    expect(resOne).toEqual([]);
  });
});
