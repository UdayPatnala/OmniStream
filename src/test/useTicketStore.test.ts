import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTicketStore } from '../state/useTicketStore';
import { useCineMorphStore } from '../state/useCineMorphStore';

describe('useTicketStore — In-Memory Session Ticket', () => {
  beforeEach(() => {
    localStorage.clear();
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

  it('starts with no active ticket and empty tickets array', () => {
    expect(useTicketStore.getState().activeTicket).toBeNull();
    expect(useTicketStore.getState().tickets).toHaveLength(0);
    expect(useTicketStore.getState().isPrintingAnimationActive).toBe(false);
  });

  it('setActiveTicket stores ticket and populates tickets array', () => {
    const ticket = {
      ticketId: 'ticket_test_001',
      movieTitle: 'Dune Part Two',
      sourceUrl: 'blob:http://localhost/mock-dune',
      isLocal: true,
      aspectRatio: '1.43:1' as const,
      framingRule: 'rule_of_thirds' as const,
      timestampSeconds: 0,
      durationSeconds: 9960,
      printedAt: Date.now(),
      seatAssignment: 'ROW A • SEAT 3',
    };

    useTicketStore.getState().setActiveTicket(ticket);

    expect(useTicketStore.getState().activeTicket).toEqual(ticket);
    expect(useTicketStore.getState().tickets).toHaveLength(1);
    expect(useTicketStore.getState().tickets[0]).toEqual(ticket);
  });

  it('clearActiveTicket resets all ticket state', () => {
    useTicketStore.getState().setActiveTicket({
      ticketId: 'ticket_test_002',
      movieTitle: 'Oppenheimer',
      sourceUrl: 'blob:http://localhost/mock-oppenheimer',
      isLocal: true,
      aspectRatio: '1.90:1' as const,
      framingRule: 'auto' as const,
      timestampSeconds: 0,
      durationSeconds: 10800,
      printedAt: Date.now(),
    });

    expect(useTicketStore.getState().activeTicket).not.toBeNull();

    useTicketStore.getState().clearActiveTicket();

    expect(useTicketStore.getState().activeTicket).toBeNull();
    expect(useTicketStore.getState().tickets).toHaveLength(0);
    expect(useTicketStore.getState().isPrintingAnimationActive).toBe(false);
  });

  it('cancelPrintAnimation stops the animation flag without clearing the ticket', () => {
    useTicketStore.setState({
      isPrintingAnimationActive: true,
      animationCountdownSeconds: 5,
    });

    useTicketStore.getState().cancelPrintAnimation();

    expect(useTicketStore.getState().isPrintingAnimationActive).toBe(false);
    expect(useTicketStore.getState().animationCountdownSeconds).toBe(0);
  });

  it('trigger10sPrintAnimation creates a session ticket for local media', async () => {
    vi.useFakeTimers();

    const printPromise = useTicketStore.getState().trigger10sPrintAnimation({
      title: 'Blade Runner 2049',
      source: 'blob:http://localhost/mock-bladerunner',
      isLocal: true,
    });

    // Should immediately set printing active
    expect(useTicketStore.getState().isPrintingAnimationActive).toBe(true);

    await printPromise;

    const ticket = useTicketStore.getState().activeTicket;
    expect(ticket).not.toBeNull();
    expect(ticket?.movieTitle).toBe('Blade Runner 2049');
    expect(ticket?.isLocal).toBe(true);
    expect(ticket?.sourceUrl).toBe('blob:http://localhost/mock-bladerunner');
    expect(ticket?.ticketId).toMatch(/^ticket_session_/);

    // CineMorph store should have video source set
    expect(useCineMorphStore.getState().isPlaying).toBe(true);
    expect(useCineMorphStore.getState().videoSource?.name).toBe('Blade Runner 2049');

    vi.useRealTimers();
  });

  it('setActiveTicket(null) clears active ticket and empties tickets array', () => {
    useTicketStore.getState().setActiveTicket({
      ticketId: 'ticket_test_003',
      movieTitle: 'Test Movie',
      sourceUrl: 'blob:test',
      isLocal: true,
      aspectRatio: 'original' as const,
      framingRule: 'auto' as const,
      timestampSeconds: 100,
      durationSeconds: 600,
      printedAt: Date.now(),
    });

    useTicketStore.getState().setActiveTicket(null);

    expect(useTicketStore.getState().activeTicket).toBeNull();
    expect(useTicketStore.getState().tickets).toHaveLength(0);
  });
});
