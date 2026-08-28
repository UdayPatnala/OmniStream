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

    // Cancel animation
    useTicketStore.getState().cancelPrintAnimation();

    expect(useTicketStore.getState().isPrintingAnimationActive).toBe(false);
    expect(useTicketStore.getState().animationCountdownSeconds).toBe(0);

    await animPromise;
  });

  it('T5-ANIM-02: tab blur and visibilityChange events do not corrupt ticket store state', async () => {
    const movieData = {
      title: 'Blade Runner 2049',
      source: 'local-br2049-stream',
      isLocal: true,
    };

    const animPromise = useTicketStore.getState().trigger10sPrintAnimation(movieData);
    expect(useTicketStore.getState().isPrintingAnimationActive).toBe(true);

    // Simulate tab blur / backgrounding (document.hidden = true, visibilitychange event)
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true, configurable: true });
    Object.defineProperty(document, 'hidden', { value: true, writable: true, configurable: true });
    window.dispatchEvent(new Event('blur'));
    document.dispatchEvent(new Event('visibilitychange'));

    // Tab restored
    Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true, configurable: true });
    Object.defineProperty(document, 'hidden', { value: false, writable: true, configurable: true });
    window.dispatchEvent(new Event('focus'));
    document.dispatchEvent(new Event('visibilitychange'));

    await animPromise;

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
    await Promise.all(burstPromises);
    expect(useTicketStore.getState().activeTicket).toBeDefined();
  });

  it('T5-ANIM-04: trigger10sPrintAnimation activates cineMorph playback and sets active ticket', async () => {
    const animPromise = useTicketStore.getState().trigger10sPrintAnimation({
      title: 'Oppenheimer IMAX',
      source: 'local-oppenheimer',
      isLocal: true,
    });

    expect(useTicketStore.getState().isPrintingAnimationActive).toBe(true);
    await animPromise;
    expect(useTicketStore.getState().activeTicket?.movieTitle).toBe('Oppenheimer IMAX');
    expect(useCineMorphStore.getState().isPlaying).toBe(true);
  });

  it('T5-ANIM-05: cancellation resets active printing flag cleanly', async () => {
    const animPromise = useTicketStore.getState().trigger10sPrintAnimation({
      title: 'Tenet 70mm',
      source: 'local-tenet',
      isLocal: true,
    });

    expect(useTicketStore.getState().isPrintingAnimationActive).toBe(true);
    useTicketStore.getState().cancelPrintAnimation();
    expect(useTicketStore.getState().isPrintingAnimationActive).toBe(false);

    await animPromise;
  });

  it('T5-ANIM-06: CineMorph store player synchronization matches ticket on trigger', async () => {
    useCineMorphStore.getState().setAspectRatio('1.43:1');
    useCineMorphStore.getState().setFramingRule('rule_of_thirds');

    const animPromise = useTicketStore.getState().trigger10sPrintAnimation({
      title: 'Dunkirk True IMAX',
      source: 'https://youtube.com/watch?v=F-eMt3xHhvk',
      isLocal: false,
    });

    await animPromise;

    const cineMorphState = useCineMorphStore.getState();
    expect(cineMorphState.isPlaying).toBe(true);
    expect(cineMorphState.videoSource?.url).toBe('https://youtube.com/watch?v=F-eMt3xHhvk');
    expect(useTicketStore.getState().activeTicket?.aspectRatio).toBe('1.43:1');
  });
});
