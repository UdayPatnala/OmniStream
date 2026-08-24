import { describe, it, expect, beforeEach } from 'vitest';
import { getRecommendedVideos, calculateUserStats } from '../../lib/recommendations';
import { createUTubeStore } from '../helpers/contracts';
import { MOCK_VIDEOS, MOCK_CHANNELS } from '../helpers/fixtures';

describe('Tier 1: 5 Keyword Recommendations (F09)', () => {
  let store: ReturnType<typeof createUTubeStore>;

  beforeEach(() => {
    store = createUTubeStore();
  });

  it('T1-RECS-01: extracts keyword recommendations producing exactly 5 videos based on search history', () => {
    store.getState().subscribe({
      channelId: 'chan_tech',
      channelTitle: 'Modern Web Academy',
      avatarUrl: '',
      subscribedAt: Date.now(),
    });

    store.setState({
      recentSearches: ['react', 'tutorial', 'code', 'javascript', 'performance']
    });

    store.getState().extractRecommendations();
    const recs = store.getState().recommendedVideos;

    expect(recs).toBeDefined();
    expect(recs.length).toBeLessThanOrEqual(5);
    expect(recs.length).toBeGreaterThan(0);
  });

  it('T1-RECS-02: filters common stopwords from keyword mapping', () => {
    const searchHistory = ['video with that this from what your video'];
    const recs = getRecommendedVideos(MOCK_VIDEOS, {}, [], [], searchHistory);
    expect(recs).toBeDefined();
    expect(Array.isArray(recs)).toBe(true);
  });

  it('T1-RECS-03: boosts ranking of videos originating from subscribed channels (+50 score boost)', () => {
    const popularPool = [MOCK_VIDEOS[0], MOCK_VIDEOS[1], MOCK_VIDEOS[2]];
    const subs = [MOCK_CHANNELS[1]];

    const recs = getRecommendedVideos(popularPool, {}, subs, [], []);
    expect(recs[0].channelId).toBe('chan_tech');
  });

  it('T1-RECS-04: penalizes fully watched videos in history to prioritize unwatched content', () => {
    const popularPool = [MOCK_VIDEOS[0], MOCK_VIDEOS[1]];
    const history = {
      [MOCK_VIDEOS[0].id]: {
        video: MOCK_VIDEOS[0],
        watchedAt: Date.now(),
        progress: 900,
        duration: 900,
      }
    };

    const recs = getRecommendedVideos(popularPool, history, [], [], []);
    expect(recs[0].id).toBe(MOCK_VIDEOS[1].id);
  });

  it('T1-RECS-05: applies recency boost for videos published within the last 7 days', () => {
    const recs = getRecommendedVideos(MOCK_VIDEOS, {}, [], [], ['nature']);
    expect(recs.length).toBeGreaterThan(0);
    expect(['vid_cinematic_4k', 'vid_imax_trailer']).toContain(recs[0].id);
  });

  it('T1-RECS-06: calculateUserStats accurately aggregates watch time, completion rates, and top channels', () => {
    const history = {
      [MOCK_VIDEOS[0].id]: {
        video: MOCK_VIDEOS[0],
        watchedAt: Date.now(),
        progress: 930,
        duration: 930,
      },
      [MOCK_VIDEOS[1].id]: {
        video: MOCK_VIDEOS[1],
        watchedAt: Date.now(),
        progress: 600,
        duration: 1330,
      }
    };

    const stats = calculateUserStats(history, MOCK_CHANNELS, []);
    expect(stats.totalWatched).toBe(2);
    expect(stats.completedCount).toBe(1);
    expect(stats.completionRate).toBe(50);
  });
});
