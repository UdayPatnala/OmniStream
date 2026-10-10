import { describe, it, expect, beforeEach } from 'vitest';
import { createUTubeStore, createTicketStore } from '../helpers/contracts';

describe('Tier 3: Search -> Subscribe -> Recommendations -> Save Ticket -> Resume (Cross-Feature)', () => {
  let utubeStore: ReturnType<typeof createUTubeStore>;
  let ticketStore: ReturnType<typeof createTicketStore>;

  beforeEach(() => {
    utubeStore = createUTubeStore();
    ticketStore = createTicketStore();
  });

  it('T3-FLOW-01: executes full chain from search to ticket progress resume', async () => {
    // 1. User searches for 4K nature documentary
    const results = await utubeStore.getState().search('nature documentary 4k');
    expect(results.length).toBeGreaterThan(0);
    const chosenVideo = results[0];

    // 2. User subscribes to the channel
    utubeStore.getState().subscribe({
      channelId: 'chan_nature',
      channelTitle: chosenVideo.channelTitle,
      avatarUrl: chosenVideo.thumbnailUrl,
      subscribedAt: Date.now(),
    });
    expect(utubeStore.getState().subscriptions).toHaveLength(1);

    // 3. Recommendation engine extracts 5 recommendations boosted by subscription
    utubeStore.getState().extractRecommendations();
    expect(utubeStore.getState().recommendedVideos.length).toBeLessThanOrEqual(5);

    // 4. User launches CineMorph and saves ticket midway at 45 minutes
    const ticketId = ticketStore.getState().saveTicketProgress({
      movieTitle: chosenVideo.title,
      sourceUrl: chosenVideo.id,
      isLocal: false,
      aspectRatio: '1.43:1',
      framingRule: 'rule_of_thirds',
      timestampSeconds: 2700,
      durationSeconds: 5400,
    });
    expect(ticketId).toBeDefined();

    // 5. User later clicks the torn ticket to resume playback
    const resumed = ticketStore.getState().resumeFromTicket(ticketId);
    expect(resumed).not.toBeNull();
    expect(resumed?.movieTitle).toBe(chosenVideo.title);
    expect(resumed?.timestampSeconds).toBe(2700);
    expect(resumed?.aspectRatio).toBe('1.43:1');
  });
});
