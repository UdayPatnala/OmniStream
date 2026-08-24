import { describe, it, expect, beforeEach } from 'vitest';
import { createTicketStore, createCineMorphStore } from '../helpers/contracts';

describe('Tier 4: User Journey 2 - Immersive CineMorph Movie Night', () => {
  let ticketStore: ReturnType<typeof createTicketStore>;
  let cineStore: ReturnType<typeof createCineMorphStore>;

  beforeEach(() => {
    ticketStore = createTicketStore();
    cineStore = createCineMorphStore();
  });

  it('T4-JRN-02: loads local MP4, triggers 10s ticket animation, sets 1.43:1 IMAX GT, saves progress, resumes with 1 click', async () => {
    // Step 1: Load local media
    cineStore.getState().setVideoSource({
      type: 'local',
      url: 'blob:http://localhost/movie-night-feature',
      name: 'Interstellar_IMAX',
    });
    expect(cineStore.getState().videoSource?.name).toBe('Interstellar_IMAX');

    // Step 2: Start movie with 10s ticket printing animation
    const anim = ticketStore.getState().trigger10sPrintAnimation({
      title: 'Interstellar_IMAX',
      source: 'blob:http://localhost/movie-night-feature',
      isLocal: true,
    });
    expect(ticketStore.getState().isPrintingAnimationActive).toBe(true);
    await anim;
    expect(ticketStore.getState().isPrintingAnimationActive).toBe(false);

    // Step 3: Switch to 1.43:1 IMAX GT
    cineStore.getState().setAspectRatio('1.43:1');
    expect(cineStore.getState().aspectRatio).toBe('1.43:1');

    // Step 4: Save progress ticket midway (at 1h 15m)
    const ticketId = ticketStore.getState().saveTicketProgress({
      movieTitle: 'Interstellar_IMAX',
      sourceUrl: 'blob:http://localhost/movie-night-feature',
      isLocal: true,
      aspectRatio: '1.43:1',
      framingRule: 'rule_of_thirds',
      timestampSeconds: 4500,
      durationSeconds: 10000,
    });

    // Step 5: Resume next day with 1 click
    const resumed = ticketStore.getState().resumeFromTicket(ticketId);
    expect(resumed?.timestampSeconds).toBe(4500);
    expect(resumed?.aspectRatio).toBe('1.43:1');
  });
});
