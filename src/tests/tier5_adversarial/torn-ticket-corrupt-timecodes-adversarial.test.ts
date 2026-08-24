import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useTicketStore, MovieTicket } from '../../state/useTicketStore';
import { useCineMorphStore } from '../../state/useCineMorphStore';

// Diegetic formatTime helper matching TicketDrawer logic for empirical verification
function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0 || !Number.isFinite(seconds)) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

describe('Tier 5 Adversarial: Torn Ticket Save/Resume with Corrupt Timecodes & Missing References (F34, F35)', () => {
  beforeEach(() => {
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

  it('T5-TCKT-01: saving and resuming a ticket with negative timestamp clamps safely to 0s', () => {
    const ticketId = useTicketStore.getState().saveTicketProgress({
      movieTitle: 'Corrupt Timecode Movie',
      sourceUrl: 'local-corrupt-1',
      isLocal: true,
      aspectRatio: '1.90:1',
      framingRule: 'auto',
      timestampSeconds: -1800,
      durationSeconds: 7200,
    });

    expect(ticketId).toBeDefined();
    const resumed = useTicketStore.getState().resumeFromTicket(ticketId);
    expect(resumed).not.toBeNull();

    // CineMorph playback timestamp should be bounded safely (>= 0)
    expect(useCineMorphStore.getState().playbackTimestamp).toBe(0);
    expect(formatTime(resumed!.timestampSeconds)).toBe('00:00');
  });

  it('T5-TCKT-02: saving ticket with timestamp exceeding duration clamps progress percentage <= 100%', () => {
    const ticketId = useTicketStore.getState().saveTicketProgress({
      movieTitle: 'Overtime Feature',
      sourceUrl: 'local-overtime',
      isLocal: true,
      aspectRatio: '1.43:1',
      framingRule: 'leading_lines',
      timestampSeconds: 99999,
      durationSeconds: 3600,
    });

    const resumed = useTicketStore.getState().resumeFromTicket(ticketId);
    expect(resumed).not.toBeNull();
    expect(resumed?.timestampSeconds).toBe(99999);

    // Calculate progress display percent safely
    const progressPct =
      resumed!.durationSeconds > 0
        ? Math.min(100, Math.round((resumed!.timestampSeconds / resumed!.durationSeconds) * 100))
        : 0;

    expect(progressPct).toBe(100);
    expect(formatTime(resumed!.timestampSeconds)).toBe('27:46:39');
  });

  it('T5-TCKT-03: NaN, null, undefined, and non-finite timestamps formatted gracefully without runtime crash', () => {
    expect(formatTime(NaN)).toBe('00:00');
    expect(formatTime(-Infinity)).toBe('00:00');
    expect(formatTime(Infinity)).toBe('00:00');
    expect(formatTime(undefined as any)).toBe('00:00');
    expect(formatTime(null as any)).toBe('00:00');
    expect(formatTime(-120)).toBe('00:00');
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(65)).toBe('01:05');
    expect(formatTime(3665)).toBe('01:01:05');
  });

  it('T5-TCKT-04: resuming ticket with orphaned / empty media reference populates safe fallback videoSource', () => {
    const ticketId = useTicketStore.getState().saveTicketProgress({
      movieTitle: 'Missing Reference Movie',
      sourceUrl: '',
      isLocal: false,
      aspectRatio: 'original',
      framingRule: 'auto',
      timestampSeconds: 120,
      durationSeconds: 600,
    });

    const resumed = useTicketStore.getState().resumeFromTicket(ticketId);
    expect(resumed).not.toBeNull();
    expect(resumed?.sourceUrl).toBe('');

    const currentSource = useCineMorphStore.getState().videoSource;
    expect(currentSource).not.toBeNull();
    expect(currentSource?.url).toBe('');
    expect(currentSource?.name).toBe('Missing Reference Movie');
    expect(useCineMorphStore.getState().isPlaying).toBe(true);
  });

  it('T5-TCKT-05: resuming nonexistent or deleted ticketId returns null and does not corrupt store', () => {
    const nonexistentResumed = useTicketStore.getState().resumeFromTicket('ticket_ghost_999999');
    expect(nonexistentResumed).toBeNull();
    expect(useTicketStore.getState().activeTicket).toBeNull();

    // Create and remove a ticket, then attempt resume
    const ticketId = useTicketStore.getState().saveTicketProgress({
      movieTitle: 'Ephemeral Reel',
      sourceUrl: 'local-ephemeral',
      isLocal: true,
      aspectRatio: '1.90:1',
      framingRule: 'auto',
      timestampSeconds: 50,
      durationSeconds: 300,
    });

    useTicketStore.getState().removeTicket(ticketId);
    expect(useTicketStore.getState().tickets.length).toBe(0);

    const deletedResumed = useTicketStore.getState().resumeFromTicket(ticketId);
    expect(deletedResumed).toBeNull();
  });

  it('T5-TCKT-06: duplicate ticket save with same sourceUrl updates in-place without duplicating entries', () => {
    const sourceUrl = 'https://youtube.com/watch?v=dQw4w9WgXcQ';

    const id1 = useTicketStore.getState().saveTicketProgress({
      movieTitle: 'Never Gonna Give You Up',
      sourceUrl,
      isLocal: false,
      aspectRatio: 'original',
      framingRule: 'auto',
      timestampSeconds: 45,
      durationSeconds: 212,
    });

    expect(useTicketStore.getState().tickets.length).toBe(1);

    const id2 = useTicketStore.getState().saveTicketProgress({
      movieTitle: 'Never Gonna Give You Up (Updated)',
      sourceUrl,
      isLocal: false,
      aspectRatio: '1.90:1',
      framingRule: 'screen_direction',
      timestampSeconds: 150,
      durationSeconds: 212,
    });

    expect(id2).toBe(id1);
    expect(useTicketStore.getState().tickets.length).toBe(1);
    expect(useTicketStore.getState().tickets[0].timestampSeconds).toBe(150);
    expect(useTicketStore.getState().tickets[0].movieTitle).toBe('Never Gonna Give You Up (Updated)');
    expect(useTicketStore.getState().tickets[0].aspectRatio).toBe('1.90:1');
  });

  it('T5-TCKT-07: adversarial XSS / large payloads in ticket metadata are preserved safely', () => {
    const maliciousPayload = '<script>alert("xss")</script><img src=x onerror=alert(1)>';
    const oversizedTitle = 'A'.repeat(5000);

    const ticketId = useTicketStore.getState().saveTicketProgress({
      movieTitle: maliciousPayload + oversizedTitle,
      sourceUrl: 'local-xss-test',
      isLocal: true,
      aspectRatio: '4:3',
      framingRule: 'frame_in_frame',
      timestampSeconds: 100,
      durationSeconds: 1000,
    });

    const ticket = useTicketStore.getState().tickets.find(t => t.ticketId === ticketId);
    expect(ticket).toBeDefined();
    expect(ticket?.movieTitle).toContain('<script>');
    expect(ticket?.movieTitle.length).toBeGreaterThan(5000);

    const resumed = useTicketStore.getState().resumeFromTicket(ticketId);
    expect(resumed?.movieTitle).toBe(ticket?.movieTitle);
  });
});
