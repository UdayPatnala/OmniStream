import { describe, it, expect, beforeEach } from 'vitest';
import { createTicketStore } from '../helpers/contracts';

describe('Tier 1: Torn Ticket Save & 1-Click Resume (F34, F35)', () => {
  let store: ReturnType<typeof createTicketStore>;

  beforeEach(() => {
    store = createTicketStore();
  });

  it('T1-RESM-01: saveTicketProgress generates a valid ticketId and stores progress metadata', () => {
    expect(store.getState().tickets).toHaveLength(0);

    const ticketId = store.getState().saveTicketProgress({
      movieTitle: 'Oppenheimer',
      sourceUrl: 'local-oppenheimer-imax',
      isLocal: true,
      aspectRatio: '1.43:1',
      framingRule: 'rule_of_thirds',
      timestampSeconds: 3420,
      durationSeconds: 10800,
    });

    expect(ticketId).toBeDefined();
    expect(ticketId).toMatch(/^ticket-/);
    expect(store.getState().tickets).toHaveLength(1);
    expect(store.getState().tickets[0].timestampSeconds).toBe(3420);
  });

  it('T1-RESM-02: resumeFromTicket restores the exact timestamp and settings of the target ticket', () => {
    const ticketId = store.getState().saveTicketProgress({
      movieTitle: 'Inception',
      sourceUrl: 'local-inception',
      isLocal: true,
      aspectRatio: '1.90:1',
      framingRule: 'leading_lines',
      timestampSeconds: 5200,
      durationSeconds: 8800,
    });

    const resumed = store.getState().resumeFromTicket(ticketId);
    expect(resumed).not.toBeNull();
    expect(resumed?.movieTitle).toBe('Inception');
    expect(resumed?.timestampSeconds).toBe(5200);
    expect(resumed?.aspectRatio).toBe('1.90:1');
  });

  it('T1-RESM-03: resuming with invalid/non-existent ticketId returns null safely', () => {
    const result = store.getState().resumeFromTicket('non-existent-ticket-id');
    expect(result).toBeNull();
  });

  it('T1-RESM-04: removeTicket deletes ticket by ID from state', () => {
    const t1 = store.getState().saveTicketProgress({
      movieTitle: 'Tenet',
      sourceUrl: 'local-tenet',
      isLocal: true,
      aspectRatio: '1.43:1',
      framingRule: 'auto',
      timestampSeconds: 100,
      durationSeconds: 9000,
    });
    const t2 = store.getState().saveTicketProgress({
      movieTitle: 'Dunkirk',
      sourceUrl: 'local-dunkirk',
      isLocal: true,
      aspectRatio: '1.43:1',
      framingRule: 'auto',
      timestampSeconds: 200,
      durationSeconds: 6000,
    });

    expect(store.getState().tickets).toHaveLength(2);
    store.getState().removeTicket(t1);
    expect(store.getState().tickets).toHaveLength(1);
    expect(store.getState().tickets[0].ticketId).toBe(t2);
  });

  it('T1-RESM-05: saving progress for the same movie updates existing ticket rather than duplicating', () => {
    store.getState().saveTicketProgress({
      movieTitle: 'Interstellar',
      sourceUrl: 'local-interstellar',
      isLocal: true,
      aspectRatio: '1.43:1',
      framingRule: 'auto',
      timestampSeconds: 1500,
      durationSeconds: 10000,
    });

    store.getState().saveTicketProgress({
      movieTitle: 'Interstellar',
      sourceUrl: 'local-interstellar',
      isLocal: true,
      aspectRatio: '1.43:1',
      framingRule: 'auto',
      timestampSeconds: 4500,
      durationSeconds: 10000,
    });

    expect(store.getState().tickets).toHaveLength(1);
    expect(store.getState().tickets[0].timestampSeconds).toBe(4500);
  });
});
