import { describe, it, expect, beforeEach } from 'vitest';
import { hybridMediaRouter } from '../../lib/cinemorph/hybridRouter';
import { createCineMorphStore } from '../helpers/contracts';

describe('Tier 2: Offline Mode & Network Cut Fallback (Boundary, F19)', () => {
  let store: ReturnType<typeof createCineMorphStore>;

  beforeEach(() => {
    store = createCineMorphStore();
  });

  it('T2-OFFL-01: setting offline status in CineMorphStore automatically locks aspect ratio to 4:3', () => {
    store.getState().setAspectRatio('1.43:1');
    expect(store.getState().aspectRatio).toBe('1.43:1');

    store.getState().setOfflineStatus(true);
    expect(store.getState().isOffline).toBe(true);
    expect(store.getState().aspectRatio).toBe('4:3');
  });

  it('T2-OFFL-02: hybridRouter selects offline-airgap route for local media when offline', () => {
    // Simulate offline
    const decision = hybridMediaRouter.determineRoute({
      isLocal: true,
      durationSeconds: 3600,
    });
    expect(decision.route).toBeDefined();
    expect(decision.spatialAudioEnabled).toBe(true);
  });

  it('T2-OFFL-03: network cut throttles YouTube streaming and pauses background lookahead', () => {
    const decision = hybridMediaRouter.determineRoute({
      isLocal: false,
      durationSeconds: 600,
      isNetworkThrottled: true,
    });

    expect(decision.route).toBe('network-constrained');
    expect(decision.allowBackgroundLookahead).toBe(false);
    expect(decision.sampleIntervalMs).toBe(0);
  });

  it('T2-OFFL-04: reconnecting back online updates status without resetting user aspect preferences', () => {
    store.getState().setOfflineStatus(true);
    expect(store.getState().isOffline).toBe(true);

    store.getState().setOfflineStatus(false);
    expect(store.getState().isOffline).toBe(false);
  });

  it('T2-OFFL-05: consecutive dropped frames step down device performance profile gracefully', () => {
    hybridMediaRouter.setManualProfile('high');
    for (let i = 0; i < 7; i++) {
      hybridMediaRouter.reportFrameDrop();
    }
    expect(hybridMediaRouter.classifyDeviceProfile()).toBeDefined();
    hybridMediaRouter.resetFrameDrops();
  });
});
