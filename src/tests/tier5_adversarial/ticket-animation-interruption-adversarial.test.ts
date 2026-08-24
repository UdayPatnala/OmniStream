import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useTicketStore } from '../../state/useTicketStore';
import { useCineMorphStore } from '../../state/useCineMorphStore';

describe('Tier 5 Adversarial: 10s Ticket Printing Animation Interruption, Cancellation & Visibility (F31, F32, F33)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useTicketStore.setState({
      tickets: [],
      isPrintingAnimationActive: false,
      animationCountdownSeconds: 0,
      activeTicket: null,
    });
    useCineMorphStore.setState({
      aspectRatio: 'original',
      isOffline: false,
      videoSource: null,
      framingRule: 'auto',
      diagnosticOverlayVisible: false,
      panOffset: { x: 0, y: 0 },
      playbackTimestamp: 0,
      isPlaying: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('T5-ANIM-01: mid-animation cancellation immediately aborts countdown and active printing flag', async () => {
    const movieData = {
      title: 'Interstellar 4K',
      source: 'https://youtube.com/watch?v=zSWdZVtXT7E',
      isLocal: false,
    };

    const animPromise = useTicketStore.getState().trigger10sPrintAnimation(movieData);

    expect(useTicketStore.getState().isPrintingAnimationActive).toBe(true);
    expect(useTicketStore.getState().animationCountdownSeconds).toBe(10);

    // Advance 3 seconds
    vi.advanceTimersByTime(3000);
    expect(useTicketStore.getState().animationCountdownSeconds).toBe(7);

    // Cancel animation midway
    useTicketStore.getState().cancelPrintAnimation();

    expect(useTicketStore.getState().isPrintingAnimationActive).toBe(false);
    expect(useTicketStore.getState().animationCountdownSeconds).toBe(0);

    // Fast-forward remainder
    vi.advanceTimersByTime(10000);
    await animPromise;

    // Active ticket should be registered on complete or cancellation state remains safe
    expect(useTicketStore.getState().isPrintingAnimationActive).toBe(false);
  });

  it('T5-ANIM-02: tab blur and visibilityChange events during countdown do not corrupt timer decrements', async () => {
    const movieData = {
      title: 'Blade Runner 2049',
      source: 'local-br2049-stream',
      isLocal: true,
    };

    const animPromise = useTicketStore.getState().trigger10sPrintAnimation(movieData);
    expect(useTicketStore.getState().isPrintingAnimationActive).toBe(true);

    // Advance 2s
    vi.advanceTimersByTime(2000);
    expect(useTicketStore.getState().animationCountdownSeconds).toBe(8);

    // Simulate tab blur / backgrounding (document.hidden = true, visibilitychange event)
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true, configurable: true });
    Object.defineProperty(document, 'hidden', { value: true, writable: true, configurable: true });
    window.dispatchEvent(new Event('blur'));
    document.dispatchEvent(new Event('visibilitychange'));

    // Advance 5s in background
    vi.advanceTimersByTime(5000);
    expect(useTicketStore.getState().animationCountdownSeconds).toBe(3);

    // Tab restored
    Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true, configurable: true });
    Object.defineProperty(document, 'hidden', { value: false, writable: true, configurable: true });
    window.dispatchEvent(new Event('focus'));
    document.dispatchEvent(new Event('visibilitychange'));

    // Advance remaining 3s to finish
    vi.advanceTimersByTime(3000);
    await animPromise;

    expect(useTicketStore.getState().isPrintingAnimationActive).toBe(false);
    expect(useTicketStore.getState().animationCountdownSeconds).toBe(0);
    expect(useTicketStore.getState().activeTicket?.movieTitle).toBe('Blade Runner 2049');
  });

  it('T5-ANIM-03: rapid burst re-triggering (20 concurrent calls) resolves safely without unhandled rejections', async () => {
    const burstPromises = Array.from({ length: 20 }, (_, idx) =>
      useTicketStore.getState().trigger10sPrintAnimation({
        title: `Movie Variant ${idx}`,
        source: `source-${idx}`,
        isLocal: idx % 2 === 0,
      })
    );

    expect(useTicketStore.getState().isPrintingAnimationActive).toBe(true);
    expect(useTicketStore.getState().animationCountdownSeconds).toBe(10);

    // Advance all timers through 10 seconds
    vi.advanceTimersByTime(10000);
    await Promise.all(burstPromises);

    expect(useTicketStore.getState().isPrintingAnimationActive).toBe(false);
    expect(useTicketStore.getState().animationCountdownSeconds).toBe(0);
    expect(useTicketStore.getState().tickets.length).toBeGreaterThan(0);
  });

  it('T5-ANIM-04: heads-up pre-processing event is dispatched with correct movie payload', async () => {
    let receivedDetail: any = null;
    const headsUpListener = (e: any) => {
      receivedDetail = e.detail;
    };
    window.addEventListener('omnistream:heads-up:start', headsUpListener);

    try {
      const animPromise = useTicketStore.getState().trigger10sPrintAnimation({
        title: 'Oppenheimer IMAX',
        source: 'local-oppenheimer',
        isLocal: true,
      });

      expect(useTicketStore.getState().isPrintingAnimationActive).toBe(true);
      expect(receivedDetail).toBeDefined();
      expect(receivedDetail.movie.title).toBe('Oppenheimer IMAX');
      expect(receivedDetail.movie.isLocal).toBe(true);

      vi.advanceTimersByTime(10000);
      await animPromise;

      expect(useTicketStore.getState().isPrintingAnimationActive).toBe(false);
      expect(useTicketStore.getState().activeTicket?.movieTitle).toBe('Oppenheimer IMAX');
    } finally {
      window.removeEventListener('omnistream:heads-up:start', headsUpListener);
    }
  });

  it('T5-ANIM-05: boundary interruption at 9.9s executes cleanly and maintains store consistency', async () => {
    const animPromise = useTicketStore.getState().trigger10sPrintAnimation({
      title: 'Tenet 70mm',
      source: 'local-tenet',
      isLocal: true,
    });

    // Advance to 9.5 seconds
    vi.advanceTimersByTime(9500);
    expect(useTicketStore.getState().isPrintingAnimationActive).toBe(true);
    expect(useTicketStore.getState().animationCountdownSeconds).toBe(1);

    // Cancel right before completion
    useTicketStore.getState().cancelPrintAnimation();
    expect(useTicketStore.getState().isPrintingAnimationActive).toBe(false);
    expect(useTicketStore.getState().animationCountdownSeconds).toBe(0);

    vi.advanceTimersByTime(1000);
    await animPromise;

    expect(useTicketStore.getState().isPrintingAnimationActive).toBe(false);
  });

  it('T5-ANIM-06: CineMorph store player synchronization matches ticket on completion', async () => {
    useCineMorphStore.getState().setAspectRatio('1.43:1');
    useCineMorphStore.getState().setFramingRule('rule_of_thirds');

    const animPromise = useTicketStore.getState().trigger10sPrintAnimation({
      title: 'Dunkirk True IMAX',
      source: 'https://youtube.com/watch?v=F-eMt3xHhvk',
      isLocal: false,
    });

    vi.advanceTimersByTime(10000);
    await animPromise;

    const cineMorphState = useCineMorphStore.getState();
    expect(cineMorphState.isPlaying).toBe(true);
    expect(cineMorphState.videoSource?.url).toBe('https://youtube.com/watch?v=F-eMt3xHhvk');
    expect(cineMorphState.videoSource?.name).toBe('Dunkirk True IMAX');
    expect(useTicketStore.getState().activeTicket?.aspectRatio).toBe('1.43:1');
  });
});
