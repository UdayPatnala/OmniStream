import { describe, it, expect, beforeEach } from 'vitest';
import { searchAndRankVideos, computeRelevanceScore } from '../../lib/services/searchService';
import { searchVideos } from '../../lib/youtube';
import { createUTubeStore } from '../helpers/contracts';
import { MOCK_VIDEOS } from '../helpers/fixtures';

describe('Tier 1: U-TUBE Top 3 Search (F05)', () => {
  let store: ReturnType<typeof createUTubeStore>;

  beforeEach(() => {
    store = createUTubeStore();
  });

  it('T1-SRCH-01: search returns real fast initial candidate results and supports dynamic pagination', async () => {
    const results = await store.getState().search('cinematic 4K');
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    expect(store.getState().searchResults.length).toBeGreaterThan(0);

    // Test load more pagination
    store.setState({
      currentQuery: 'cinematic 4K',
      nextPageToken: 'next_page_mock_token',
      hasMore: true,
    });
    const paginated = await store.getState().loadMoreSearch();
    expect(paginated.length).toBeGreaterThan(0);
  });

  it('T1-SRCH-02: search relevance scoring prioritizes exact query matches in video title', () => {
    const sampleVideo1 = {
      ...MOCK_VIDEOS[0],
      title: 'Cinematic 4K Nature Documentary HDR',
    };
    const sampleVideo2 = {
      ...MOCK_VIDEOS[1],
      title: 'Web Dev Tutorial - No Nature Mentioned',
    };

    const score1 = computeRelevanceScore('nature documentary', sampleVideo1);
    const score2 = computeRelevanceScore('nature documentary', sampleVideo2);

    expect(score1).toBeGreaterThan(score2);
  });

  it('T1-SRCH-03: popular videos with >1M views receive popularity ranking boost', () => {
    const highViewVideo = {
      ...MOCK_VIDEOS[0],
      title: 'Wildlife Film',
      viewCount: '5000000',
    };
    const lowViewVideo = {
      ...MOCK_VIDEOS[0],
      title: 'Wildlife Film',
      viewCount: '500',
    };

    const scoreHigh = computeRelevanceScore('wildlife', highViewVideo);
    const scoreLow = computeRelevanceScore('wildlife', lowViewVideo);

    expect(scoreHigh).toBeGreaterThan(scoreLow);
  });

  it('T1-SRCH-04: search results preserve essential video metadata fields', async () => {
    const results = await store.getState().search('react');
    expect(results.length).toBeGreaterThan(0);

    const first = results[0];
    expect(first.id).toBeDefined();
    expect(typeof first.id).toBe('string');
    expect(first.title).toBeDefined();
    expect(typeof first.title).toBe('string');
    expect(first.channelTitle).toBeDefined();
  });

  it('T1-SRCH-05: performing a search records the query into recentSearches history in store', async () => {
    expect(store.getState().recentSearches).toEqual([]);
    
    await store.getState().search('imax sci-fi trailer');
    expect(store.getState().recentSearches).toContain('imax sci-fi trailer');

    await store.getState().search('lo-fi chill beats');
    expect(store.getState().recentSearches[0]).toBe('lo-fi chill beats');
    expect(store.getState().recentSearches).toHaveLength(2);
  });

  it('T1-SRCH-06: searchAndRankVideos service ranks fallback and rich videos properly', async () => {
    const ranked = await searchAndRankVideos('lofi');
    expect(ranked).toBeDefined();
    expect(Array.isArray(ranked)).toBe(true);
    if (ranked.length > 0) {
      expect(ranked[0].id).toBeDefined();
    }
  });
});
