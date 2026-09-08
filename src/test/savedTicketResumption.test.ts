import { describe, it, expect, beforeEach } from 'vitest';
import { useTicketStore } from '../state/useTicketStore';
import { useCineMorphStore } from '../state/useCineMorphStore';

/**
 * CineMorph Session Ticket — Smoke Tests
 *
 * Persistence (IndexedDB blob storage, resume from saved tickets) was intentionally
 * removed from CineMorph. These tests verify the session-only ticket lifecycle:
 * one active ticket per session, cleared on exit, no cross-session restoration.
 */
describe('CineMorph Session Ticket — Ingest & Session Lifecycle', () => {
  beforeEach(async () => {
    useTicketStore.setState({
      tickets: [],
      activeTicket: null,
      isPrintingAnimationActive: false,
      animationCountdownSeconds: 0,
    });
    useCineMorphStore.setState({
      aspectRatio: 'original',
      framingRule: 'auto',
      playbackTimestamp: 0,
      isPlaying: false,
      videoSource: null,
    });
  });

  it('T-SESSION-01: local file ingest creates a valid session ticket in-memory', async () => {
    await useTicketStore.getState().trigger10sPrintAnimation({
      title: 'Interstellar',
      source: 'blob:http://localhost/interstellar',
      isLocal: true,
    });

    const ticket = useTicketStore.getState().activeTicket;
    expect(ticket).not.toBeNull();
    expect(ticket?.movieTitle).toBe('Interstellar');
    expect(ticket?.isLocal).toBe(true);
    expect(ticket?.sourceUrl).toBe('blob:http://localhost/interstellar');
    expect(ticket?.ticketId).toMatch(/^ticket_session_/);

    // Tickets array reflects active ticket
    expect(useTicketStore.getState().tickets).toHaveLength(1);
    expect(useTicketStore.getState().tickets[0].ticketId).toBe(ticket?.ticketId);
  });

  it('T-SESSION-02: CineMorph store is synchronized on ticket creation', async () => {
    await useTicketStore.getState().trigger10sPrintAnimation({
      title: 'Dune Part Two',
      source: 'blob:http://localhost/dune2',
      isLocal: true,
    });

    const cineMorphState = useCineMorphStore.getState();
    expect(cineMorphState.isPlaying).toBe(true);
    expect(cineMorphState.videoSource?.name).toBe('Dune Part Two');
    expect(cineMorphState.videoSource?.url).toBe('blob:http://localhost/dune2');
  });

  it('T-SESSION-03: clearActiveTicket ends the session without persisting state', async () => {
    await useTicketStore.getState().trigger10sPrintAnimation({
      title: 'Oppenheimer',
      source: 'blob:http://localhost/oppenheimer',
      isLocal: true,
    });

    expect(useTicketStore.getState().activeTicket).not.toBeNull();

    useTicketStore.getState().clearActiveTicket();

    expect(useTicketStore.getState().activeTicket).toBeNull();
    expect(useTicketStore.getState().tickets).toHaveLength(0);
    expect(useTicketStore.getState().isPrintingAnimationActive).toBe(false);
  });

  it('T-SESSION-04: cancelling animation mid-print stops animation flag', async () => {
    // Start animation but cancel before it resolves
    const printPromise = useTicketStore.getState().trigger10sPrintAnimation({
      title: 'Tenet',
      source: 'blob:http://localhost/tenet',
      isLocal: true,
    });

    expect(useTicketStore.getState().isPrintingAnimationActive).toBe(true);

    useTicketStore.getState().cancelPrintAnimation();

    expect(useTicketStore.getState().isPrintingAnimationActive).toBe(false);

    // Let the promise settle (it may still finish since it's async)
    await printPromise.catch(() => {});
  });

  it('T-SESSION-05: ticket has valid seat assignment generated automatically', async () => {
    await useTicketStore.getState().trigger10sPrintAnimation({
      title: '2001: A Space Odyssey',
      source: 'blob:http://localhost/2001',
      isLocal: true,
    });

    const ticket = useTicketStore.getState().activeTicket;
    expect(ticket?.seatAssignment).toBeDefined();
    expect(ticket?.seatAssignment).toMatch(/^ROW [A-H] • SEAT \d+$/);
  });
});
