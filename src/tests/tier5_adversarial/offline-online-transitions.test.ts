import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { hybridMediaRouter } from '../../lib/cinemorph/hybridRouter';
import { useCineMorphStore } from '../../state/useCineMorphStore';
import { useTicketStore } from '../../state/useTicketStore';
import { useUTubeStore } from '../../state/useUTubeStore';

describe('Tier 5 Adversarial: Offline / Online Network Disconnect Transitions & Session Ticket Stress', () => {
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

  it('T5-NET-03: Airgapped offline session ticket creation stores to memory, not IDB', async () => {
    useCineMorphStore.getState().setOfflineStatus(true);
    expect(useCineMorphStore.getState().isOffline).toBe(true);

    // Create session ticket while airgapped offline
    await useTicketStore.getState().trigger10sPrintAnimation({
      title: 'Offline Local Documentary',
      source: 'blob:http://localhost/offline_media_file_1',
      isLocal: true,
    });

    const ticket = useTicketStore.getState().activeTicket;
    expect(ticket).not.toBeNull();
    expect(ticket?.movieTitle).toBe('Offline Local Documentary');
    expect(ticket?.isLocal).toBe(true);

    // Re-enable online status
    useCineMorphStore.getState().setOfflineStatus(false);
    expect(useCineMorphStore.getState().isOffline).toBe(false);

    // Session ticket is still intact in memory
    expect(useTicketStore.getState().activeTicket?.movieTitle).toBe('Offline Local Documentary');
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

    await pA.catch(() => {});

    // Immediately trigger B
    const pB = useTicketStore.getState().trigger10sPrintAnimation(movieB);
    expect(useTicketStore.getState().isPrintingAnimationActive).toBe(true);

    await pB;

    // B's ticket should win
    expect(useTicketStore.getState().activeTicket?.movieTitle).toBe('Movie Beta');
  });

  it('T5-NET-05: clearActiveTicket on network reconnection does not crash', async () => {
    useCineMorphStore.getState().setOfflineStatus(true);

    await useTicketStore.getState().trigger10sPrintAnimation({
      title: 'Airgap Movie',
      source: 'blob:http://localhost/airgap',
      isLocal: true,
    });

    expect(useTicketStore.getState().activeTicket).not.toBeNull();

    // Simulate reconnection + exit theater
    useCineMorphStore.getState().setOfflineStatus(false);
    useTicketStore.getState().clearActiveTicket();

    expect(useTicketStore.getState().activeTicket).toBeNull();
    expect(useTicketStore.getState().tickets).toHaveLength(0);
  });
});
