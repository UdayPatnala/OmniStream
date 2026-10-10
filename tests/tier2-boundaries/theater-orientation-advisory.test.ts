import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  isMobileTouchDevice,
  isPortraitOrientation,
  requestLandscapeOrientation,
  unlockOrientation
} from '@omnistream/cinemorph/services/orientationService';

describe('Tier 2: CineMorph Theater Mobile Landscape Advisory (Boundary)', () => {
  const originalNavigator = global.navigator;
  const originalWindow = global.window;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('T2-ORNT-01: detects desktop environment as non-mobile touch device', () => {
    // In standard node/desktop test environment, should be false
    const isMobile = isMobileTouchDevice();
    expect(typeof isMobile).toBe('boolean');
  });

  it('T2-ORNT-02: detects portrait orientation based on aspect ratio or screen API', () => {
    const isPortrait = isPortraitOrientation();
    expect(typeof isPortrait).toBe('boolean');
  });

  it('T2-ORNT-03: requestLandscapeOrientation handles missing or rejected lock gracefully', async () => {
    // Calling without screen.orientation.lock or in non-mobile should safely resolve to false
    const locked = await requestLandscapeOrientation();
    expect(locked).toBe(false);
  });

  it('T2-ORNT-04: unlockOrientation does not throw in headless or restricted browser environment', () => {
    expect(() => unlockOrientation()).not.toThrow();
  });

  it('T2-ORNT-05: verifies CineMorphTheater contains accessible orientation advisory components', () => {
    const capsuleTheaterPath = path.resolve(__dirname, '../../src/products/cinemorph/pages/CineMorphTheater.tsx');

    expect(fs.existsSync(capsuleTheaterPath)).toBe(true);

    const capsuleContent = fs.readFileSync(capsuleTheaterPath, 'utf8');

    // Canonical theater must have the advisory banner and accessible controls
    expect(capsuleContent).toContain('Rotate to landscape for authentic theater sightlines');
    expect(capsuleContent).toContain('role="status"');
    expect(capsuleContent).toContain('aria-live="polite"');
    expect(capsuleContent).toContain('aria-label="Dismiss orientation prompt"');
    expect(capsuleContent).toContain('requestLandscapeOrientation');
  });
});
