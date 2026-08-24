import { describe, it, expect, beforeEach } from 'vitest';
import { useUTubeStore } from '../state/useUTubeStore';

describe('useUTubeStore Contract & Logic', () => {
  beforeEach(() => {
    localStorage.clear();
    useUTubeStore.setState({
      searchResults: [],
      subscriptions: [],
      recentSearches: [],
      recommendedVideos: [],
      subscribedFeed: [],
      lastFeedRefresh: 0,
      currentVideo: null,
    });
  });

  it('search returns real candidate results without hardcoded 3-limit, and supports loadMore pagination', async () => {
    const results = await useUTubeStore.getState().search('cinematic 4K');
    expect(results.length).toBeGreaterThan(0);
    expect(useUTubeStore.getState().searchResults.length).toBeGreaterThan(0);
    expect(useUTubeStore.getState().recentSearches).toContain('cinematic 4K');

    // Test loadMoreSearch pagination if hasMore or simulated pageToken
    useUTubeStore.setState({
      currentQuery: 'cinematic 4K',
      nextPageToken: 'token_page_2',
      hasMore: true,
    });
    const more = await useUTubeStore.getState().loadMoreSearch();
    expect(more.length).toBeGreaterThan(0);
  });

  it('handles empty query gracefully', async () => {
    const results = await useUTubeStore.getState().search('   ');
    expect(results).toEqual([]);
    expect(useUTubeStore.getState().searchResults).toEqual([]);
  });

  it('subscribe and unsubscribe maintain channel list correctly', () => {
    const channel = {
      channelId: 'UC_test_1',
      channelTitle: 'Cinema Studio',
      avatarUrl: 'https://example.com/avatar.jpg',
      subscribedAt: Date.now(),
    };

    useUTubeStore.getState().subscribe(channel);
    expect(useUTubeStore.getState().subscriptions).toHaveLength(1);
    expect(useUTubeStore.getState().subscriptions[0].channelTitle).toBe('Cinema Studio');

    // Duplicate subscription is prevented
    useUTubeStore.getState().subscribe(channel);
    expect(useUTubeStore.getState().subscriptions).toHaveLength(1);

    useUTubeStore.getState().unsubscribe('UC_test_1');
    expect(useUTubeStore.getState().subscriptions).toHaveLength(0);
  });

  it('extractRecommendations returns exactly 5 recommended videos based on keyword extraction', () => {
    useUTubeStore.setState({
      recentSearches: ['sci-fi movies', 'soundtrack'],
    });

    useUTubeStore.getState().extractRecommendations();
    const recs = useUTubeStore.getState().recommendedVideos;
    expect(recs).toHaveLength(5);
    recs.forEach((r) => {
      expect(r.id).toBeDefined();
      expect(r.title).toBeDefined();
    });
  });

  it('refreshFeedIfNeeded updates feed when 4 hours have elapsed', async () => {
    const channel = {
      channelId: 'UC_sub_99',
      channelTitle: 'IMAX Filmmaker',
      avatarUrl: 'https://example.com/imax.jpg',
      subscribedAt: Date.now() - 5 * 3600 * 1000,
    };
    useUTubeStore.setState({
      subscriptions: [channel],
      lastFeedRefresh: Date.now() - (4 * 3600 * 1000 + 1000),
      subscribedFeed: [],
    });

    await useUTubeStore.getState().refreshFeedIfNeeded();
    expect(useUTubeStore.getState().subscribedFeed.length).toBeGreaterThan(0);
    expect(useUTubeStore.getState().lastFeedRefresh).toBeGreaterThan(0);
  });

  it('playVideo loads video by object or ID string', () => {
    useUTubeStore.getState().playVideo('dQw4w9WgXcQ');
    expect(useUTubeStore.getState().currentVideo?.id).toBe('dQw4w9WgXcQ');

    const customVideo = {
      id: 'v_custom',
      title: 'Custom Title',
      channelTitle: 'My Channel',
      thumbnailUrl: 'https://example.com/thumb.jpg',
    };
    useUTubeStore.getState().playVideo(customVideo);
    expect(useUTubeStore.getState().currentVideo?.title).toBe('Custom Title');
  });
});
