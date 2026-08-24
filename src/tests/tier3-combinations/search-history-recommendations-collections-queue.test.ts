import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../../store';
import { getRecommendedVideos } from '../../lib/recommendations';
import { MOCK_VIDEOS } from '../helpers/fixtures';

describe('Tier 3: Search History -> Recommendations -> Collection -> Queue (Cross-Feature)', () => {
  beforeEach(() => {
    useAppStore.setState({
      searchHistory: ['react', 'webgl', 'threejs'],
      collections: [],
      queue: [],
    });
  });

  it('T3-FLOW-05: generates recommendations, adds to collection, and enqueues for sequential playback', () => {
    const searches = useAppStore.getState().searchHistory;
    const recs = getRecommendedVideos(MOCK_VIDEOS, {}, [], [], searches);
    expect(recs.length).toBeGreaterThan(0);

    // Create collection and add top recommended video
    useAppStore.getState().createCollection('My Tech Playlist');
    const col = useAppStore.getState().collections[0];
    expect(col).toBeDefined();

    useAppStore.getState().addVideoToCollection(col.id, recs[0]);
    expect(useAppStore.getState().collections[0].videos).toHaveLength(1);

    // Enqueue video
    useAppStore.getState().addToQueue(recs[0]);
    expect(useAppStore.getState().queue).toHaveLength(1);

    // Play next in queue
    const next = useAppStore.getState().nextInQueue();
    expect(next?.id).toBe(recs[0].id);
    expect(useAppStore.getState().queue).toHaveLength(0);
  });
});
