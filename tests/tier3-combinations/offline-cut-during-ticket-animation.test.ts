import { describe, it, expect, beforeEach } from 'vitest';
import { createTicketStore, createCineMorphStore } from '../helpers/contracts';

describe('Tier 3: Offline Cut During 10s Ticket Animation -> 4:3 Ratio Lock (Cross-Feature)', () => {
  let ticketStore: ReturnType<typeof createTicketStore>;
  let cineStore: ReturnType<typeof createCineMorphStore>;

  beforeEach(() => {
    ticketStore = createTicketStore();
    cineStore = createCineMorphStore();
  });

  it('T3-FLOW-02: network drops during ticket animation, automatically locking to 4:3 offline mode', async () => {
    cineStore.getState().setAspectRatio('1.43:1');
    expect(cineStore.getState().aspectRatio).toBe('1.43:1');

    // 1. Trigger ticket printing animation
    const animPromise = ticketStore.getState().trigger10sPrintAnimation({
      title: 'Offline Sci-Fi',
      source: 'local-file-xyz',
      isLocal: true,
    });
    expect(ticketStore.getState().isPrintingAnimationActive).toBe(true);

    // 2. Mid-animation network cut occurs
    cineStore.getState().setOfflineStatus(true);
    expect(cineStore.getState().isOffline).toBe(true);
    expect(cineStore.getState().aspectRatio).toBe('4:3');

    // 3. Animation finishes
    await animPromise;
    expect(ticketStore.getState().isPrintingAnimationActive).toBe(false);

    // 4. Playback continues safely under 4:3 lock
    expect(cineStore.getState().aspectRatio).toBe('4:3');
  });
});
