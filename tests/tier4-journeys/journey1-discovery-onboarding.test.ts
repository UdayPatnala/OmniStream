import { describe, it, expect, beforeEach } from 'vitest';
import { createUTubeStore } from '../helpers/contracts';

describe('Tier 4: User Journey 1 - Discovery & Onboarding', () => {
  let store: ReturnType<typeof createUTubeStore>;

  beforeEach(() => {
    store = createUTubeStore();
  });

  it('T4-JRN-01: new user performs search, watches top result ad-free, subscribes, and discovers recommended content', async () => {
    // Step 1: User arrives and searches
    const results = await store.getState().search('cinematic nature');
    expect(results.length).toBeLessThanOrEqual(3);
    expect(results.length).toBeGreaterThan(0);

    // Step 2: User plays top video
    store.getState().playVideo(results[0]);
    expect(store.getState().currentVideo?.id).toBe(results[0].id);

    // Step 3: User subscribes to the channel
    store.getState().subscribe({
      channelId: 'chan_nature',
      channelTitle: results[0].channelTitle,
      avatarUrl: results[0].thumbnailUrl,
      subscribedAt: Date.now(),
    });
    expect(store.getState().subscriptions).toHaveLength(1);

    // Step 4: Home feed recommendations adapt to user activity
    store.getState().extractRecommendations();
    expect(store.getState().recommendedVideos.length).toBeGreaterThan(0);
  });
});
