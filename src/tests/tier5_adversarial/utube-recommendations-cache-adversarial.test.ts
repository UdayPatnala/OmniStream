import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getRecommendedVideos, calculateUserStats } from '../../lib/recommendations';
import { useUTubeStore } from '../../state/useUTubeStore';
import { Video, Channel, HistoryItem, Collection } from '../../types';
import { MOCK_VIDEOS } from '../helpers/fixtures';

describe('Tier 5 Adversarial: U-TUBE Recommendations & 4-Hour Cache Precision (F23, F24, F25)', () => {
  const sampleVideos: Video[] = [
    {
      id: 'vid-1',
      title: 'Interstellar Movie Full Soundtrack 4K',
      description: 'Hans Zimmer complete score',
      thumbnails: { default: 'thumb1.jpg', medium: 'thumb1_m.jpg', high: 'thumb1_h.jpg' },
      channelTitle: 'Cinema Scores',
      channelId: 'chan-scores',
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days old
      duration: 'PT2H00M00S',
      viewCount: '5000000',
    },
    {
      id: 'vid-2',
      title: 'Dune Part Two IMAX Sound Design Breakdown',
      description: 'Behind the sound mixing',
      thumbnails: { default: 'thumb2.jpg', medium: 'thumb2_m.jpg', high: 'thumb2_h.jpg' },
      channelTitle: 'Film Tech',
      channelId: 'chan-tech',
      publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days old
      duration: 'PT15M30S',
      viewCount: '200000',
    },
    {
      id: 'vid-3',
      title: 'Random Cooking Recipe Tutorial',
      description: 'Easy pasta at home',
      thumbnails: { default: 'thumb3.jpg', medium: 'thumb3_m.jpg', high: 'thumb3_h.jpg' },
      channelTitle: 'Chef Daily',
      channelId: 'chan-chef',
      publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      duration: 'PT10M00S',
      viewCount: '10000',
    },
  ];

  beforeEach(() => {
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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('T5-RECS-01: stop-word saturation queries do not cause NaN or crashes in recommendation scoring', () => {
    const stopWordQueries = [
      'with from that this have what your video',
      'that this with from',
      '!@#$%^&*()_+=~`[]{}|:;"<>,.?/',
      '     \t\n   ',
    ];

    const history: Record<string, HistoryItem> = {};
    const subscriptions: Channel[] = [];
    const collections: Collection[] = [];

    const recs = getRecommendedVideos(sampleVideos, history, subscriptions, collections, stopWordQueries);
    expect(recs).toBeDefined();
    expect(recs.length).toBe(sampleVideos.length);
    // Every returned video must be a valid Video object
    recs.forEach(v => {
      expect(v.id).toBeDefined();
      expect(v.title).toBeDefined();
    });
  });

  it('T5-RECS-02: multilingual, non-Latin & Emoji queries process safely through tokenizer', () => {
    const multilingualQueries = [
      'アニメ 映画 4K 音声',       // Japanese
      'космос кино трейлер',        // Cyrillic
      'موسيقى هادئة سينما',         // Arabic
      'सिनेमा 4K ट्रेलर',             // Hindi
      '🎬 🍿 🚀 🪐 🎧 🔥',          // Emojis
    ];

    const history: Record<string, HistoryItem> = {};
    const subscriptions: Channel[] = [];
    const collections: Collection[] = [];

    const recs = getRecommendedVideos(sampleVideos, history, subscriptions, collections, multilingualQueries);
    expect(recs).toBeDefined();
    expect(recs.length).toBe(sampleVideos.length);
  });

  it('T5-RECS-03: zero-input edge cases in getRecommendedVideos and calculateUserStats survive cleanly', () => {
    // Empty candidate list
    const emptyCandidates = getRecommendedVideos([], {}, [], [], []);
    expect(emptyCandidates).toEqual([]);

    // Zero-state stats calculation
    const stats = calculateUserStats({}, [], []);
    expect(stats.totalWatched).toBe(0);
    expect(stats.totalHours).toBe(0);
    expect(stats.completedCount).toBe(0);
    expect(stats.completionRate).toBe(0);
    expect(stats.subscriptionsCount).toBe(0);
    expect(stats.collectionsCount).toBe(0);
    expect(stats.topChannels).toEqual([]);
  });

  it('T5-RECS-04: exact 4-hour cache boundary expiration precision verification', async () => {
    const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
    const baseTime = 1700000000000;

    useUTubeStore.setState({
      subscriptions: [
        { channelId: 'chan-veritasium', channelTitle: 'Veritasium', avatarUrl: 'v.jpg', subscribedAt: baseTime }
      ],
      subscribedFeed: [
        { id: 'feed-init', title: 'Initial Feed', channelTitle: 'Veritasium', thumbnailUrl: 'v.jpg' }
      ],
      lastFeedRefresh: baseTime,
    });

    // Case A: 1ms before 4 hours (baseTime + FOUR_HOURS_MS - 1) -> NO refresh
    vi.spyOn(Date, 'now').mockReturnValue(baseTime + FOUR_HOURS_MS - 1);
    await useUTubeStore.getState().refreshFeedIfNeeded();

    expect(useUTubeStore.getState().lastFeedRefresh).toBe(baseTime);
    expect(useUTubeStore.getState().subscribedFeed[0].id).toBe('feed-init');

    // Case B: Exactly at 4 hours (baseTime + FOUR_HOURS_MS) -> REFRESH triggered
    vi.spyOn(Date, 'now').mockReturnValue(baseTime + FOUR_HOURS_MS);
    await useUTubeStore.getState().refreshFeedIfNeeded();

    expect(useUTubeStore.getState().lastFeedRefresh).toBe(baseTime + FOUR_HOURS_MS);
    expect(useUTubeStore.getState().subscribedFeed[0].id).toBe(`feed_chan-veritasium_${baseTime + FOUR_HOURS_MS}`);

    // Case C: 1ms past 4 hours -> REFRESH triggered if boundary exceeded from updated timestamp
    const nextRefreshTime = baseTime + FOUR_HOURS_MS + FOUR_HOURS_MS + 1;
    vi.spyOn(Date, 'now').mockReturnValue(nextRefreshTime);
    await useUTubeStore.getState().refreshFeedIfNeeded();

    expect(useUTubeStore.getState().lastFeedRefresh).toBe(nextRefreshTime);
  });

  it('T5-RECS-05: clock skew / backwards time travel (now < lastFeedRefresh) does not crash or corrupt feed', async () => {
    const baseTime = 1700000000000;
    useUTubeStore.setState({
      subscriptions: [
        { channelId: 'chan-tech', channelTitle: 'Film Tech', avatarUrl: 'ft.jpg', subscribedAt: baseTime }
      ],
      subscribedFeed: [
        { id: 'feed-existing', title: 'Existing Video', channelTitle: 'Film Tech', thumbnailUrl: 'ft.jpg' }
      ],
      lastFeedRefresh: baseTime,
    });

    // Time travelling 1 hour into the past (e.g. daylight savings or NTP correction)
    vi.spyOn(Date, 'now').mockReturnValue(baseTime - 3600000);
    await useUTubeStore.getState().refreshFeedIfNeeded();

    // Should not refresh since (now - lastFeedRefresh) is negative
    expect(useUTubeStore.getState().lastFeedRefresh).toBe(baseTime);
    expect(useUTubeStore.getState().subscribedFeed.length).toBe(1);
    expect(useUTubeStore.getState().subscribedFeed[0].id).toBe('feed-existing');
  });

  it('T5-RECS-06: fully watched videos receive score penalties while subscriptions and keywords receive boosts', () => {
    const history: Record<string, HistoryItem> = {
      'vid-1': {
        video: sampleVideos[0],
        watchedAt: Date.now(),
        progress: 7200,
        duration: 7200,
      }
    };

    const subscriptions: Channel[] = [
      {
        id: 'chan-tech',
        title: 'Film Tech',
        description: '',
        thumbnails: { default: '', medium: '', high: '' }
      }
    ];

    const searchHistory = ['dune', 'sound', 'design'];
    const recs = getRecommendedVideos(sampleVideos, history, subscriptions, [], searchHistory);

    // vid-2 (Dune Film Tech) matches subscribed channel (+50), keywords (+3*5=15), and is unwatched
    // vid-1 (Interstellar) has watched penalty (-100)
    expect(recs[0].id).toBe('vid-2');
    expect(recs[recs.length - 1].id).toBe('vid-1');
  });
});
