import { describe, it, expect, beforeEach } from 'vitest';
import { useCineMorphStore } from '../state/useCineMorphStore';

describe('useCineMorphStore Aspect Ratio & Offline Fallback', () => {
  beforeEach(() => {
    localStorage.clear();
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

  it('sets aspect ratio modes cleanly', () => {
    useCineMorphStore.getState().setAspectRatio('1.43:1');
    expect(useCineMorphStore.getState().aspectRatio).toBe('1.43:1');

    useCineMorphStore.getState().setAspectRatio('1.90:1');
    expect(useCineMorphStore.getState().aspectRatio).toBe('1.90:1');
  });

  it('automatically falls back to 4:3 cropped aspect ratio when offline status is triggered', () => {
    useCineMorphStore.getState().setAspectRatio('1.43:1');
    expect(useCineMorphStore.getState().aspectRatio).toBe('1.43:1');

    useCineMorphStore.getState().setOfflineStatus(true);
    expect(useCineMorphStore.getState().isOffline).toBe(true);
    expect(useCineMorphStore.getState().aspectRatio).toBe('4:3');
  });

  it('clamps pan offset strictly between [-1, 1]', () => {
    useCineMorphStore.getState().setPanOffset(1.5, -2.0);
    expect(useCineMorphStore.getState().panOffset.x).toBe(1);
    expect(useCineMorphStore.getState().panOffset.y).toBe(-1);

    useCineMorphStore.getState().setPanOffset(-0.25, 0.75);
    expect(useCineMorphStore.getState().panOffset.x).toBe(-0.25);
    expect(useCineMorphStore.getState().panOffset.y).toBe(0.75);
  });

  it('toggles diagnostic overlay visibility', () => {
    expect(useCineMorphStore.getState().diagnosticOverlayVisible).toBe(false);
    useCineMorphStore.getState().toggleDiagnosticOverlay();
    expect(useCineMorphStore.getState().diagnosticOverlayVisible).toBe(true);
    useCineMorphStore.getState().toggleDiagnosticOverlay();
    expect(useCineMorphStore.getState().diagnosticOverlayVisible).toBe(false);
  });
});
