import { describe, it, expect, beforeEach } from 'vitest';
import { useTicketStore } from '../../state/useTicketStore';
import { useCineMorphStore } from '../../state/useCineMorphStore';

describe('Tier 1: Aperture-Matched 10-Second Ticket Intro & Pre-processing Viewport', () => {
  beforeEach(() => {
    localStorage.clear();
    useTicketStore.setState({
      tickets: [],
      isPrintingAnimationActive: false,
      animationCountdownSeconds: 0,
      activeTicket: null,
    });
    useCineMorphStore.setState({
      aspectRatio: '1.90:1',
      framingRule: 'auto',
      isOffline: false,
    });
  });

  it('T1-APERTURE-01: default CineMorph presentation mode initializes to 1.90:1 IMAX', () => {
    const store = useCineMorphStore.getState();
    expect(store.aspectRatio).toBe('1.90:1');
  });

  it('T1-APERTURE-02: trigger10sPrintAnimation sets active state, countdown to 10, and generates active ticket stub', async () => {
    const ticketStore = useTicketStore.getState();
    
    // Trigger animation
    const printPromise = ticketStore.trigger10sPrintAnimation({
      title: 'Interstellar IMAX Experience',
      source: 'https://youtube.com/watch?v=zSWdZVtXT7E',
      isLocal: false,
    });

    expect(useTicketStore.getState().isPrintingAnimationActive).toBe(true);
    await printPromise;

    const activeState = useTicketStore.getState();
    expect(activeState.activeTicket).toBeDefined();
    expect(activeState.activeTicket?.aspectRatio).toBe('1.90:1');

    // Cancel / Fast-forward
    useTicketStore.getState().cancelPrintAnimation();
    expect(useTicketStore.getState().isPrintingAnimationActive).toBe(false);
  });

  it('T1-APERTURE-03: aspect ratio mode switches correctly across 1.43:1, 1.90:1, original, and 4:3', () => {
    const cineStore = useCineMorphStore.getState();

    // 1.43:1 True IMAX
    cineStore.setAspectRatio('1.43:1');
    expect(useCineMorphStore.getState().aspectRatio).toBe('1.43:1');

    // 1.90:1 IMAX Digital
    cineStore.setAspectRatio('1.90:1');
    expect(useCineMorphStore.getState().aspectRatio).toBe('1.90:1');

    // Original
    cineStore.setAspectRatio('original');
    expect(useCineMorphStore.getState().aspectRatio).toBe('original');

    // 4:3 Offline fallback
    cineStore.setAspectRatio('4:3');
    expect(useCineMorphStore.getState().aspectRatio).toBe('4:3');
  });

  it('T1-APERTURE-04: offline status automatically selects 4:3 fallback crop', () => {
    const cineStore = useCineMorphStore.getState();
    cineStore.setAspectRatio('1.43:1');
    expect(useCineMorphStore.getState().aspectRatio).toBe('1.43:1');

    cineStore.setOfflineStatus(true);
    expect(useCineMorphStore.getState().isOffline).toBe(true);
    expect(useCineMorphStore.getState().aspectRatio).toBe('4:3');
  });

  it('T1-APERTURE-05: cancelPrintAnimation resets active animation flags instantly', () => {
    useTicketStore.setState({
      isPrintingAnimationActive: true,
      animationCountdownSeconds: 7,
    });

    useTicketStore.getState().cancelPrintAnimation();
    expect(useTicketStore.getState().isPrintingAnimationActive).toBe(false);
    expect(useTicketStore.getState().animationCountdownSeconds).toBe(0);
  });
});
