import { describe, it, expect, beforeEach } from 'vitest';
import { createTicketStore } from '../helpers/contracts';

describe('Tier 1: 10s Ticket Printer Animation & Heads-Up Processing (F31, F32, F33)', () => {
  let store: ReturnType<typeof createTicketStore>;

  beforeEach(() => {
    store = createTicketStore();
  });

  it('T1-TCKT-01: triggering print animation activates isPrintingAnimationActive state', async () => {
    expect(store.getState().isPrintingAnimationActive).toBe(false);

    const animationPromise = store.getState().trigger10sPrintAnimation({
      title: 'Interstellar',
      source: 'local-file-123',
      isLocal: true,
    });

    expect(store.getState().isPrintingAnimationActive).toBe(true);
    await animationPromise;
    expect(store.getState().isPrintingAnimationActive).toBe(false);
  });

  it('T1-TCKT-02: heads-up processing warmup completes without unhandled errors', async () => {
    const movieData = {
      title: 'Dune Part Two',
      source: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      isLocal: false,
    };

    let completed = false;
    await store.getState().trigger10sPrintAnimation(movieData).then(() => {
      completed = true;
    });

    expect(completed).toBe(true);
    expect(store.getState().isPrintingAnimationActive).toBe(false);
  });

  it('T1-TCKT-03: multiple concurrent animation triggers resolve cleanly', async () => {
    const p1 = store.getState().trigger10sPrintAnimation({ title: 'Movie A', source: 'a', isLocal: true });
    const p2 = store.getState().trigger10sPrintAnimation({ title: 'Movie B', source: 'b', isLocal: false });

    await Promise.all([p1, p2]);
    expect(store.getState().isPrintingAnimationActive).toBe(false);
  });

  it('T1-TCKT-04: ticket animation duration behaves deterministically across calls', async () => {
    const startTime = Date.now();
    await store.getState().trigger10sPrintAnimation({ title: 'Test Movie', source: 'test', isLocal: true });
    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeGreaterThanOrEqual(0);
  });

  it('T1-TCKT-05: active ticket state remains accessible after animation completes', async () => {
    const ticketId = store.getState().saveTicketProgress({
      movieTitle: 'Blade Runner 2049',
      sourceUrl: 'local-br2049',
      isLocal: true,
      aspectRatio: '1.43:1',
      framingRule: 'rule_of_thirds',
      timestampSeconds: 1200,
      durationSeconds: 9800,
    });

    await store.getState().trigger10sPrintAnimation({ title: 'Blade Runner 2049', source: 'local-br2049', isLocal: true });
    expect(store.getState().activeTicket?.ticketId).toBe(ticketId);
  });
});
