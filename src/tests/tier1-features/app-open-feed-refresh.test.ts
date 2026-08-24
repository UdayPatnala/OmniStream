import { describe, it, expect, beforeEach } from 'vitest';
import { useUTubeStore } from '../../state/useUTubeStore';

describe('Tier 1: App Open Feed Refresh & Cache Rate Limiting', () => {
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

  it('T1-FEED-01: app open triggers refresh when subscriptions exist and cache is empty', async () => {
    const channel = {
      channelId: 'UC_natgeo',
      channelTitle: 'National Geographic',
      avatarUrl: 'https://example.com/natgeo.jpg',
      subscribedAt: Date.now(),
    };

    useUTubeStore.getState().subscribe(channel);
    expect(useUTubeStore.getState().subscribedFeed).toHaveLength(0);

    await useUTubeStore.getState().refreshFeedIfNeeded();
    expect(useUTubeStore.getState().subscribedFeed.length).toBeGreaterThan(0);
    expect(useUTubeStore.getState().lastFeedRefresh).toBeGreaterThan(0);
  });

  it('T1-FEED-02: feed refresh is rate-limited and avoids redundant fetch if within 4-hour window', async () => {
    const channel = {
      channelId: 'UC_veritasium',
      channelTitle: 'Veritasium',
      avatarUrl: 'https://example.com/v.jpg',
      subscribedAt: Date.now(),
    };

    const initialTime = Date.now() - 1000 * 60 * 60; // 1 hour ago (within 4h)
    useUTubeStore.setState({
      subscriptions: [channel],
      subscribedFeed: [
        {
          id: 'feed_init_1',
          title: 'Existing Cached Feed Video',
          channelTitle: 'Veritasium',
          thumbnailUrl: 'https://example.com/thumb.jpg',
        },
      ],
      lastFeedRefresh: initialTime,
    });

    await useUTubeStore.getState().refreshFeedIfNeeded();
    // Should NOT have refreshed because < 4 hours
    expect(useUTubeStore.getState().lastFeedRefresh).toBe(initialTime);
    expect(useUTubeStore.getState().subscribedFeed[0].id).toBe('feed_init_1');
  });

  it('T1-FEED-03: feed refresh triggers when > 4 hours have elapsed since last refresh', async () => {
    const channel = {
      channelId: 'UC_veritasium',
      channelTitle: 'Veritasium',
      avatarUrl: 'https://example.com/v.jpg',
      subscribedAt: Date.now(),
    };

    const oldTime = Date.now() - 1000 * 60 * 60 * 5; // 5 hours ago (> 4h)
    useUTubeStore.setState({
      subscriptions: [channel],
      subscribedFeed: [
        {
          id: 'feed_old_1',
          title: 'Old Feed Video',
          channelTitle: 'Veritasium',
          thumbnailUrl: 'https://example.com/thumb.jpg',
        },
      ],
      lastFeedRefresh: oldTime,
    });

    await useUTubeStore.getState().refreshFeedIfNeeded();
    expect(useUTubeStore.getState().lastFeedRefresh).toBeGreaterThan(oldTime);
    expect(useUTubeStore.getState().subscribedFeed.length).toBeGreaterThan(0);
  });
});
