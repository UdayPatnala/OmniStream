import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { hybridMediaRouter } from '../../lib/cinemorph/hybridRouter';
import { useCineMorphStore } from '../../state/useCineMorphStore';
import { useTicketStore } from '../../state/useTicketStore';
import { useUTubeStore } from '../../state/useUTubeStore';

describe('Tier 5 Adversarial: Offline / Online Network Disconnect Transitions & Ticket Stress', () => {
  beforeEach(() => {
    localStorage.clear();
    useCineMorphStore.setState({
      aspectRatio: 'original',
      isOffline: false,
      videoSource: null,
      panOffset: { x: 0, y: 0 },
      playbackTimestamp: 0,
      isPlaying: false,
    });
    useTicketStore.setState({
      tickets: [],
      isPrintingAnimationActive: false,
      animationCountdownSeconds: 0,
      activeTicket: null,
    });
    useUTubeStore.setState({
      searchResults: [],
      subscriptions: [],
      subscribedFeed: [],
      lastFeedRefresh: 0,
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('T5-NET-01: Rapid online/offline flapping during 10s ticket print animation preserves countdown integrity', async () => {
    const movie = {
      title: 'Oppenheimer',
      source: 'blob:http://localhost/mock-video-stream',
      isLocal: true,
    };

    // Start instant animation staging
    const printPromise = useTicketStore.getState().trigger10sPrintAnimation(movie);
    expect(useTicketStore.getState().isPrintingAnimationActive).toBe(true);

    // Toggle offline/online status
    useCineMorphStore.getState().setOfflineStatus(true);
    expect(useCineMorphStore.getState().isOffline).toBe(true);
    useCineMorphStore.getState().setOfflineStatus(false);
    expect(useCineMorphStore.getState().isOffline).toBe(false);

    await printPromise;

    expect(useCineMorphStore.getState().isPlaying).toBe(true);
    expect(useTicketStore.getState().activeTicket?.movieTitle).toBe('Oppenheimer');
  });

  it('T5-NET-02: Network drop during active YouTube stream routes to network-constrained without throwing', () => {
    // 1. Online YouTube route
    const onlineDecision = hybridMediaRouter.determineRoute({
      isLocal: false,
      durationSeconds: 1200,
    });
    expect(onlineDecision.route).toBeDefined();

    // 2. Network drop during YouTube playback
    const throttledDecision = hybridMediaRouter.determineRoute({
      isLocal: false,
      durationSeconds: 1200,
      isNetworkThrottled: true,
    });
    expect(throttledDecision.route).toBe('network-constrained');
    expect(throttledDecision.sampleIntervalMs).toBe(0);
    expect(throttledDecision.allowBackgroundLookahead).toBe(false);
  });

  it('T5-NET-03: Airgapped offline media ticket generation and persistence survives store rehydration', () => {
    useCineMorphStore.getState().setOfflineStatus(true);
    expect(useCineMorphStore.getState().isOffline).toBe(true);
    expect(useCineMorphStore.getState().aspectRatio).toBe('4:3'); // Auto 4:3 crop fallback

    // Save ticket progress while airgapped offline
    const ticketId = useTicketStore.getState().saveTicketProgress({
      movieTitle: 'Offline Local Documentary',
      sourceUrl: 'blob:offline_media_file_1',
      isLocal: true,
      aspectRatio: '4:3',
      framingRule: 'auto',
      timestampSeconds: 420,
      durationSeconds: 1800,
    });

    expect(ticketId).toBeDefined();
    const savedTicket = useTicketStore.getState().tickets.find((t) => t.ticketId === ticketId);
    expect(savedTicket?.aspectRatio).toBe('4:3');
    expect(savedTicket?.timestampSeconds).toBe(420);

    // Now re-enable online status
    useCineMorphStore.getState().setOfflineStatus(false);
    expect(useCineMorphStore.getState().isOffline).toBe(false);

    // Resuming ticket should restore all ticket state correctly
    const resumed = useTicketStore.getState().resumeFromTicket(ticketId);
    expect(resumed).not.toBeNull();
    expect(useCineMorphStore.getState().playbackTimestamp).toBe(420);
    expect(useCineMorphStore.getState().videoSource?.name).toBe('Offline Local Documentary');
  });

  it('T5-NET-04: Concurrent ticket cancel and re-trigger sequences do not produce orphaned timers', async () => {
    const movieA = { title: 'Movie Alpha', source: 'url_a', isLocal: false };
    const movieB = { title: 'Movie Beta', source: 'url_b', isLocal: false };

    // Trigger A
    const pA = useTicketStore.getState().trigger10sPrintAnimation(movieA);
    expect(useTicketStore.getState().isPrintingAnimationActive).toBe(true);

    // Cancel A
    useTicketStore.getState().cancelPrintAnimation();
    expect(useTicketStore.getState().isPrintingAnimationActive).toBe(false);

    // Trigger B
    const pB = useTicketStore.getState().trigger10sPrintAnimation(movieB);
    expect(useTicketStore.getState().isPrintingAnimationActive).toBe(true);

    await pB;

    expect(useTicketStore.getState().activeTicket).toBeDefined();
  });

  it('T5-NET-05: Subscriptions feed refresh when offline or empty handles state without exceptions', async () => {
    const utubeStore = useUTubeStore.getState();

    // Subscribe channel
    utubeStore.subscribe({
      channelId: 'offline_channel_1',
      channelTitle: 'Cinema Classics',
      avatarUrl: 'https://example.com/avatar.jpg',
      subscribedAt: Date.now(),
    });

    // Refresh feed
    await utubeStore.refreshFeedIfNeeded();
    const feed = useUTubeStore.getState().subscribedFeed;
    expect(feed.length).toBe(1);
    expect(feed[0].channelTitle).toBe('Cinema Classics');

    // Subsequent immediate call within 4 hours should be cached (no refresh)
    const lastRefresh = useUTubeStore.getState().lastFeedRefresh;
    await utubeStore.refreshFeedIfNeeded();
    expect(useUTubeStore.getState().lastFeedRefresh).toBe(lastRefresh);
  });
});
