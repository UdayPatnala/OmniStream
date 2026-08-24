import { describe, it, expect, beforeEach } from 'vitest';
import { createCineMorphStore, createTicketStore } from '../helpers/contracts';
import { hybridMediaRouter } from '../../lib/cinemorph/hybridRouter';

describe('Tier 4: User Journey 3 - Airgapped & Offline Resilient Playback', () => {
  let cineStore: ReturnType<typeof createCineMorphStore>;
  let ticketStore: ReturnType<typeof createTicketStore>;

  beforeEach(() => {
    cineStore = createCineMorphStore();
    ticketStore = createTicketStore();
  });

  it('T4-JRN-03: handles mid-flight offline playback with 4:3 lock and offline ticket recovery', () => {
    // Step 1: User goes offline
    cineStore.getState().setOfflineStatus(true);
    expect(cineStore.getState().isOffline).toBe(true);
    expect(cineStore.getState().aspectRatio).toBe('4:3');

    // Step 2: System routes to offline-airgap
    const decision = hybridMediaRouter.determineRoute({
      isLocal: true,
      durationSeconds: 4000,
    });
    expect(decision.spatialAudioEnabled).toBe(true);

    // Step 3: User saves offline movie progress
    const ticketId = ticketStore.getState().saveTicketProgress({
      movieTitle: 'Airplane Mode Movie',
      sourceUrl: 'local-airplane-mp4',
      isLocal: true,
      aspectRatio: '4:3',
      framingRule: 'auto',
      timestampSeconds: 1800,
      durationSeconds: 5400,
    });

    const resumed = ticketStore.getState().resumeFromTicket(ticketId);
    expect(resumed?.timestampSeconds).toBe(1800);
    expect(resumed?.aspectRatio).toBe('4:3');
  });
});
