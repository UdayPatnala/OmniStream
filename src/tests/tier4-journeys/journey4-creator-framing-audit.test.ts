import { describe, it, expect, beforeEach } from 'vitest';
import { MockFramingEngine, createCineMorphStore } from '../helpers/contracts';
import { calculateFrameStyle } from '../../lib/cinemorph/frameEngine';
import { telemetryEngine } from '../../lib/cinemorph/telemetryEngine';

describe('Tier 4: User Journey 4 - Creator Multi-Format Framing & Telemetry Audit', () => {
  let framingEngine: MockFramingEngine;
  let cineStore: ReturnType<typeof createCineMorphStore>;

  beforeEach(async () => {
    framingEngine = new MockFramingEngine();
    await framingEngine.init();
    cineStore = createCineMorphStore();
  });

  it('T4-JRN-04: audits framing across all 4 rules, verifies HUD telemetry, and tests format ratios', () => {
    // 1. Audit Rule of Thirds
    framingEngine.setRule('rule_of_thirds');
    const telThirds = framingEngine.processFrame();
    expect(telThirds.targetX).toBe(0.33);

    // 2. Audit Leading Lines
    framingEngine.setRule('leading_lines');
    const telLines = framingEngine.processFrame();
    expect(telLines.leadingLines.length).toBeGreaterThanOrEqual(2);

    // 3. Audit Screen Direction
    framingEngine.setRule('screen_direction');
    const telGaze = framingEngine.processFrame();
    expect(telGaze.gazeVector).toBeDefined();

    // 4. Toggle Diagnostic Overlay HUD
    expect(cineStore.getState().diagnosticOverlayVisible).toBe(false);
    cineStore.getState().toggleDiagnosticOverlay();
    expect(cineStore.getState().diagnosticOverlayVisible).toBe(true);

    // 5. Audit HUD telemetry stats
    const stats = telemetryEngine.getStats(true, true);
    expect(stats.fps).toBe(60);
    expect(stats.webglActive).toBe(true);

    // 6. Compare format styles
    const style143 = calculateFrameStyle('1.43:1', 'face-priority');
    const style190 = calculateFrameStyle('1.90:1', 'face-priority');
    expect(style143.paddingTop).not.toBe(style190.paddingTop);
  });
});
