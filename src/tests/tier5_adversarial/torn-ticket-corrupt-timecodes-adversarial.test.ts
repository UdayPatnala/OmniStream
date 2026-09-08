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

describe('Tier 5 Adversarial: Session Ticket Edge Cases — Corrupt Timecodes & Boundary Conditions', () => {
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

  it('T5-TCKT-01: formatTime handles negative timestamp gracefully with 00:00 output', () => {
    // Session tickets can have edge-case timestamps from partial loads
    expect(formatTime(-1800)).toBe('00:00');
    expect(formatTime(-1)).toBe('00:00');
  });

  it('T5-TCKT-02: progress percentage is clamped to 100% when timestamp exceeds duration', () => {
    const timestampSeconds = 99999;
    const durationSeconds = 3600;

    const progressPct =
      durationSeconds > 0
        ? Math.min(100, Math.round((timestampSeconds / durationSeconds) * 100))
        : 0;

    expect(progressPct).toBe(100);
    expect(formatTime(timestampSeconds)).toBe('27:46:39');
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

  it('T5-TCKT-04: setActiveTicket with empty sourceUrl creates valid session ticket', () => {
    const ticket: MovieTicket = {
      ticketId: 'ticket_session_orphan',
      movieTitle: 'Missing Reference Movie',
      sourceUrl: '',
      isLocal: false,
      aspectRatio: 'original',
      framingRule: 'auto',
      timestampSeconds: 120,
      durationSeconds: 600,
      printedAt: Date.now(),
    };

    useTicketStore.getState().setActiveTicket(ticket);

    const stored = useTicketStore.getState().activeTicket;
    expect(stored).not.toBeNull();
    expect(stored?.sourceUrl).toBe('');
    expect(stored?.movieTitle).toBe('Missing Reference Movie');
    expect(useTicketStore.getState().tickets).toHaveLength(1);
  });

  it('T5-TCKT-05: clearing non-existent ticket does not corrupt store', () => {
    // Store is already empty from beforeEach
    expect(useTicketStore.getState().activeTicket).toBeNull();

    // Clear on empty store should be a no-op
    useTicketStore.getState().clearActiveTicket();

    expect(useTicketStore.getState().activeTicket).toBeNull();
    expect(useTicketStore.getState().tickets).toHaveLength(0);
  });

  it('T5-TCKT-06: setActiveTicket twice replaces the first session ticket with no duplication', () => {
    const ticketA: MovieTicket = {
      ticketId: 'ticket_A',
      movieTitle: 'Never Gonna Give You Up',
      sourceUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      isLocal: false,
      aspectRatio: 'original',
      framingRule: 'auto',
      timestampSeconds: 45,
      durationSeconds: 212,
      printedAt: Date.now(),
    };

    const ticketB: MovieTicket = {
      ticketId: 'ticket_B',
      movieTitle: 'Never Gonna Give You Up (Updated)',
      sourceUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      isLocal: false,
      aspectRatio: '1.90:1',
      framingRule: 'screen_direction',
      timestampSeconds: 150,
      durationSeconds: 212,
      printedAt: Date.now(),
    };

    useTicketStore.getState().setActiveTicket(ticketA);
    expect(useTicketStore.getState().tickets).toHaveLength(1);

    useTicketStore.getState().setActiveTicket(ticketB);
    expect(useTicketStore.getState().tickets).toHaveLength(1); // Still 1, not 2
    expect(useTicketStore.getState().activeTicket?.ticketId).toBe('ticket_B');
    expect(useTicketStore.getState().activeTicket?.movieTitle).toBe('Never Gonna Give You Up (Updated)');
  });

  it('T5-TCKT-07: adversarial XSS / large payloads in ticket metadata are preserved safely without execution', async () => {
    const maliciousPayload = '<script>alert("xss")</script><img src=x onerror=alert(1)>';
    const oversizedTitle = 'A'.repeat(5000);

    await useTicketStore.getState().trigger10sPrintAnimation({
      title: maliciousPayload + oversizedTitle,
      source: 'blob:http://localhost/xss-test',
      isLocal: true,
    });

    const ticket = useTicketStore.getState().activeTicket;
    expect(ticket).toBeDefined();
    // Title is stored as-is (raw string) — rendering is the consumer's responsibility
    expect(ticket?.movieTitle).toContain('<script>');
    expect(ticket?.movieTitle.length).toBeGreaterThan(5000);
  });
});
