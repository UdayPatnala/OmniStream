import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTicketStore } from '../state/useTicketStore';
import { useCineMorphStore } from '../state/useCineMorphStore';

describe('useTicketStore Admission Stubs & 1-Click Resume', () => {
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

  it('saves ticket progress and retrieves unique ticket ID', () => {
    const ticketId = useTicketStore.getState().saveTicketProgress({
      movieTitle: 'Dune Part Two',
      sourceUrl: 'https://example.com/dune.mp4',
      isLocal: true,
      aspectRatio: '1.43:1',
      framingRule: 'rule_of_thirds',
      timestampSeconds: 3420,
      durationSeconds: 9960,
    });

    expect(ticketId).toBeDefined();
    expect(useTicketStore.getState().tickets).toHaveLength(1);
    expect(useTicketStore.getState().tickets[0].movieTitle).toBe('Dune Part Two');
    expect(useTicketStore.getState().tickets[0].timestampSeconds).toBe(3420);
  });

  it('updates existing ticket progress if sourceUrl matches', () => {
    const ticketId1 = useTicketStore.getState().saveTicketProgress({
      movieTitle: 'Oppenheimer',
      sourceUrl: 'https://example.com/oppenheimer.mp4',
      isLocal: true,
      aspectRatio: '1.90:1',
      framingRule: 'auto',
      timestampSeconds: 120,
      durationSeconds: 10800,
    });

    const ticketId2 = useTicketStore.getState().saveTicketProgress({
      movieTitle: 'Oppenheimer',
      sourceUrl: 'https://example.com/oppenheimer.mp4',
      isLocal: true,
      aspectRatio: '1.90:1',
      framingRule: 'auto',
      timestampSeconds: 4500,
      durationSeconds: 10800,
    });

    expect(ticketId1).toBe(ticketId2);
    expect(useTicketStore.getState().tickets).toHaveLength(1);
    expect(useTicketStore.getState().tickets[0].timestampSeconds).toBe(4500);
  });

  it('resumes from ticket and syncs CineMorph state', () => {
    const ticketId = useTicketStore.getState().saveTicketProgress({
      movieTitle: 'Blade Runner 2049',
      sourceUrl: 'https://example.com/bladerunner.mp4',
      isLocal: true,
      aspectRatio: '1.43:1',
      framingRule: 'leading_lines',
      timestampSeconds: 1540,
      durationSeconds: 9800,
    });

    const resumed = useTicketStore.getState().resumeFromTicket(ticketId);
    expect(resumed).not.toBeNull();
    expect(resumed?.movieTitle).toBe('Blade Runner 2049');

    // CineMorph store should receive the exact configuration and timestamp
    const cineMorphState = useCineMorphStore.getState();
    expect(cineMorphState.aspectRatio).toBe('1.43:1');
    expect(cineMorphState.framingRule).toBe('leading_lines');
    expect(cineMorphState.playbackTimestamp).toBe(1540);
    expect(cineMorphState.videoSource?.name).toBe('Blade Runner 2049');
    expect(cineMorphState.isPlaying).toBe(true);
  });

  it('removes ticket properly', () => {
    const ticketId = useTicketStore.getState().saveTicketProgress({
      movieTitle: '2001: A Space Odyssey',
      sourceUrl: 'https://example.com/space.mp4',
      isLocal: true,
      aspectRatio: '1.43:1',
      framingRule: 'auto',
      timestampSeconds: 500,
      durationSeconds: 8400,
    });

    expect(useTicketStore.getState().tickets).toHaveLength(1);
    useTicketStore.getState().removeTicket(ticketId);
    expect(useTicketStore.getState().tickets).toHaveLength(0);
  });
});
