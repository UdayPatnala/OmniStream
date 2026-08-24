import { describe, it, expect, beforeEach } from 'vitest';
import { MockFramingEngine, createTicketStore } from '../helpers/contracts';
import { calculateFrameStyle } from '../../lib/cinemorph/frameEngine';

describe('Tier 3: Local File ML Framing -> Aspect Switch -> Torn Ticket (Cross-Feature)', () => {
  let framingEngine: MockFramingEngine;
  let ticketStore: ReturnType<typeof createTicketStore>;

  beforeEach(async () => {
    framingEngine = new MockFramingEngine();
    await framingEngine.init();
    ticketStore = createTicketStore();
  });

  it('T3-FLOW-03: tracks ML composition, switches aspect ratio, and saves progress ticket', () => {
    // 1. Framing engine set to leading lines
    framingEngine.setRule('leading_lines');
    const telemetry = framingEngine.processFrame();
    expect(telemetry.activeRule).toBe('leading_lines');

    // 2. Compute 1.90:1 frame style
    const frameStyle = calculateFrameStyle('1.90:1', 'face-priority');
    expect(frameStyle.containerAspectClass).toBe('aspect-[190/100]');

    // 3. Save progress ticket
    const ticketId = ticketStore.getState().saveTicketProgress({
      movieTitle: 'Local IMAX Feature',
      sourceUrl: 'blob:http://localhost/local-video-1',
      isLocal: true,
      aspectRatio: '1.90:1',
      framingRule: 'leading_lines',
      timestampSeconds: 1500,
      durationSeconds: 7200,
    });

    const resumed = ticketStore.getState().resumeFromTicket(ticketId);
    expect(resumed?.framingRule).toBe('leading_lines');
    expect(resumed?.aspectRatio).toBe('1.90:1');
  });
});
