/**
 * orientationService.ts — OmniStream Cross-Platform Orientation Management
 *
 * Provides safe Screen Orientation API requests for mobile devices entering
 * landscape-first experiences like CineMorph.
 */

export function isMobileTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isNarrowScreen = window.innerWidth <= 1024;
  return (mobileRegex.test(ua) || isTouch) && isNarrowScreen;
}

export function isPortraitOrientation(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.screen?.orientation?.type) {
    return window.screen.orientation.type.startsWith('portrait');
  }
  return window.innerHeight > window.innerWidth;
}

export async function requestLandscapeOrientation(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!isMobileTouchDevice()) return false;

  try {
    const orientation = window.screen?.orientation as any;
    if (orientation && typeof orientation.lock === 'function') {
      try {
        await orientation.lock('landscape');
        return true;
      } catch (_) {
        // Do NOT force fullscreen as an automatic side effect.
        // Return false to let the non-blocking rotation guide handle it gracefully.
        return false;
      }
    }
  } catch (_) {}

  return false;
}

export function unlockOrientation(): void {
  if (typeof window === 'undefined') return;
  try {
    const orientation = window.screen?.orientation as any;
    if (orientation && typeof orientation.unlock === 'function') {
      orientation.unlock();
    }
  } catch (_) {}
}
