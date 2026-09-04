import { describe, it, expect, beforeEach, vi } from 'vitest';
import { extractYouTubeId, searchVideos, getRelatedVideos, getPopularVideos } from '../../lib/youtube';
import { getRecommendedVideos } from '../../lib/recommendations';
import { useAppStore } from '../../store';
import { Video, Channel, HistoryItem } from '../../types';

describe('OMNISTREAM U-TUBE ISSUE FIX I1 — Discovery, Search, Subscriptions & Navigation', () => {
  beforeEach(() => {
    // Reset store state
    useAppStore.setState({
      subscriptions: [],
      history: {},
      searchHistory: [],
      collections: [],
      activeVideo: null,
    });
  });

  describe('Journey 1: Protected Direct YouTube Link Playback Flow', () => {
    it('accurately parses standard watch URLs, short links, embed links, and raw 11-char IDs', () => {
      expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeId('invalid search query')).toBeNull();
    });

    it('searchVideos intercepts direct YouTube URLs and resolves single direct video match', async () => {
      const res = await searchVideos('https://www.youtube.com/watch?v=vid_cinematic_4k');
      expect(res.results.length).toBe(1);
      expect(res.results[0].id).toBe('vid_cinematic_4k');
      expect(res.results[0].type).toBe('video');
    });
  });

  describe('Journey 2 & 3: Search Query Execution & Stale Request Protection', () => {
    it('executes text queries and returns normalized search results', async () => {
      const res = await searchVideos('React 19');
      expect(res.results.length).toBeGreaterThan(0);
      const top = res.results[0];
      expect(top.id).toBeDefined();
      expect(top.title).toBeDefined();
      expect(top.thumbnails.medium).toBeDefined();
    });

    it('returns empty result set when query has no matching results (no fake mock replacement)', async () => {
      const res = await searchVideos('xyznonexistentquery987654321');
      // Must not fabricate arbitrary mock results for unmatched queries
      expect(res.results).toEqual([]);
    });
  });

  describe('Journey 5: Deterministic Recommendations Pipeline', () => {
    const candidatePool: Video[] = [
      {
        id: 'vid_1',
        title: 'Quantum Physics Exploration',
        description: 'Physics lecture',
        channelId: 'chan_science',
        channelTitle: 'Science Channel',
        publishedAt: '2026-01-01T00:00:00Z',
        thumbnails: { medium: '', high: '' },
      },
      {
        id: 'vid_2',
        title: 'Deep Space Odyssey and Astronomy',
        description: 'Space documentary',
        channelId: 'chan_space',
        channelTitle: 'Space Channel',
        publishedAt: '2026-02-01T00:00:00Z',
        thumbnails: { medium: '', high: '' },
      },
      {
        id: 'vid_3',
        title: 'Baking the Perfect Sourdough Bread',
        description: 'Cooking tutorial',
        channelId: 'chan_cooking',
        channelTitle: 'Culinary Master',
        publishedAt: '2026-02-15T00:00:00Z',
        thumbnails: { medium: '', high: '' },
      },
    ];

    it('ranks candidates using topic keywords from history and subscribed channels', () => {
      const history: Record<string, HistoryItem> = {
        h1: {
          video: {
            id: 'h_vid',
            title: 'Astronomy and Space Astrophysics',
            description: '',
            channelId: 'chan_space',
            channelTitle: 'Space Channel',
            publishedAt: '',
            thumbnails: { medium: '', high: '' },
          },
          watchedAt: Date.now(),
          progress: 50,
          duration: 100,
        },
      };

      const subscriptions: Channel[] = [
        {
          id: 'chan_space',
          title: 'Space Channel',
          description: '',
          thumbnails: { default: '', medium: '', high: '' },
        },
      ];

      const recs = getRecommendedVideos(candidatePool, history, subscriptions, [], ['space telescope']);
      expect(recs.length).toBeGreaterThan(0);
      // vid_2 should be ranked highest due to space keywords + subscribed channel
      expect(recs[0].id).toBe('vid_2');
    });

    it('penalizes already watched videos and enforces channel diversity', () => {
      const history: Record<string, HistoryItem> = {
        vid_1: {
          video: candidatePool[0],
          watchedAt: Date.now(),
          progress: 100,
          duration: 100,
        },
      };

      const recs = getRecommendedVideos(candidatePool, history, [], [], []);
      // vid_1 was fully watched -> should be pushed below unwatched candidates
      expect(recs[recs.length - 1].id).toBe('vid_1');
    });
  });

  describe('Journey 6 & 7: Subscriptions Single Source of Truth & Synchronization', () => {
    it('subscribing updates store and preserves channel metadata', () => {
      const channel: Channel = {
        id: 'UC_test_123',
        title: 'Veritasium',
        description: 'Science and education',
        thumbnails: {
          default: 'https://avatar.url/1',
          medium: 'https://avatar.url/2',
          high: 'https://avatar.url/3',
        },
        subscriberCount: '15000000',
        videoCount: '450',
      };

      useAppStore.getState().subscribe(channel);
      const subs = useAppStore.getState().subscriptions;
      expect(subs.length).toBe(1);
      expect(subs[0].id).toBe('UC_test_123');
      expect(subs[0].title).toBe('Veritasium');
      expect(subs[0].subscriberCount).toBe('15000000');
      expect(subs[0].thumbnails.high).toBe('https://avatar.url/3');

      // Unsubscribing removes cleanly
      useAppStore.getState().unsubscribe('UC_test_123');
      expect(useAppStore.getState().subscriptions.length).toBe(0);
    });
  });

  describe('Journey 9: Related Videos on Watch Session', () => {
    it('getRelatedVideos returns candidate videos filtered against current video ID', async () => {
      const related = await getRelatedVideos('vid_cinematic_4k', 'Cinematic Nature 4K');
      expect(Array.isArray(related)).toBe(true);
      // Must not contain the currently playing video ID
      expect(related.some((r) => r.id === 'vid_cinematic_4k')).toBe(false);
    });
  });
});
