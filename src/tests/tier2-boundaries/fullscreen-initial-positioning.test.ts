import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getIsFullscreenActive,
  calculateTheaterProjectionLayout,
} from '../../pages/CineMorphTheater';

describe('Tier 2: CineMorph Fullscreen Initial vs Re-entry Positioning (Forensic)', () => {
  beforeEach(() => {
    Object.defineProperty(document, 'fullscreenElement', {
      writable: true,
      configurable: true,
      value: null,
    });
    delete (document as any).webkitFullscreenElement;
    delete (document as any).mozFullScreenElement;
    delete (document as any).msFullscreenElement;
  });

  afterEach(() => {
    Object.defineProperty(document, 'fullscreenElement', {
      writable: true,
      configurable: true,
      value: null,
    });
  });

  it('Original-mode projection has identical fullscreen positioning on initial fullscreen entry and subsequent fullscreen re-entry', () => {
    // Scenario 1: Initial fullscreen entry (e.g. from TicketPrinter before mount)
    const mockElement = {} as Element;
    Object.defineProperty(document, 'fullscreenElement', {
      writable: true,
      configurable: true,
      value: mockElement,
    });

    // 1. Verify getIsFullscreenActive immediately detects active fullscreen state
    const isFullscreenInitial = getIsFullscreenActive();
    expect(isFullscreenInitial).toBe(true);

    const initialLayout = calculateTheaterProjectionLayout({
      isFullscreen: isFullscreenInitial,
      isOriginalMode: true,
      frameAspectRatio: 'original',
      frameStyleAspectRatio: '16 / 9',
      nativeAspectRatio: 2.39,
    });

    // Initial fullscreen layout expectations:
    // Container must be centered (not pinned to top with justify-start pt-2)
    expect(initialLayout.containerClassName).toBe('justify-center');
    expect(initialLayout.screenClassName).toBe('mb-0');
    expect(initialLayout.maxWidth).toBe('min(99vw, calc(98vh * (2.39)))');
    expect(initialLayout.maxHeight).toBe('98vh');
    expect(initialLayout.aspectRatioStyle).toBe('2.39');

    // Scenario 2: User toggles exit fullscreen
    Object.defineProperty(document, 'fullscreenElement', {
      writable: true,
      configurable: true,
      value: null,
    });
    const isFullscreenExit = getIsFullscreenActive();
    expect(isFullscreenExit).toBe(false);

    const exitLayout = calculateTheaterProjectionLayout({
      isFullscreen: isFullscreenExit,
      isOriginalMode: true,
      frameAspectRatio: 'original',
      frameStyleAspectRatio: '16 / 9',
      nativeAspectRatio: 2.39,
    });

    // Exited layout is aligned to top with margin
    expect(exitLayout.containerClassName).toBe('justify-start pt-2 sm:pt-3');
    expect(exitLayout.screenClassName).toBe('mb-3 sm:mb-5');

    // Scenario 3: User re-enters fullscreen
    Object.defineProperty(document, 'fullscreenElement', {
      writable: true,
      configurable: true,
      value: mockElement,
    });
    const isFullscreenReEntry = getIsFullscreenActive();
    expect(isFullscreenReEntry).toBe(true);

    const reEntryLayout = calculateTheaterProjectionLayout({
      isFullscreen: isFullscreenReEntry,
      isOriginalMode: true,
      frameAspectRatio: 'original',
      frameStyleAspectRatio: '16 / 9',
      nativeAspectRatio: 2.39,
    });

    // 2. Authoritative invariant: initial entry and subsequent re-entry must be 100% IDENTICAL
    expect(reEntryLayout.containerClassName).toBe(initialLayout.containerClassName);
    expect(reEntryLayout.screenClassName).toBe(initialLayout.screenClassName);
    expect(reEntryLayout.maxWidth).toBe(initialLayout.maxWidth);
    expect(reEntryLayout.maxHeight).toBe(initialLayout.maxHeight);
    expect(reEntryLayout.aspectRatioStyle).toBe(initialLayout.aspectRatioStyle);
  });

  it('Detects vendor prefixed fullscreen elements (webkit, moz, ms) across browsers', () => {
    (document as any).webkitFullscreenElement = {} as any;
    expect(getIsFullscreenActive()).toBe(true);
    delete (document as any).webkitFullscreenElement;

    (document as any).mozFullScreenElement = {} as any;
    expect(getIsFullscreenActive()).toBe(true);
    delete (document as any).mozFullScreenElement;

    (document as any).msFullscreenElement = {} as any;
    expect(getIsFullscreenActive()).toBe(true);
    delete (document as any).msFullscreenElement;

    expect(getIsFullscreenActive()).toBe(false);
  });

  it('IMAX 1.43:1 and 1.90:1 geometry formulas are preserved identically', () => {
    // True IMAX (1.43:1)
    const trueImaxFS = calculateTheaterProjectionLayout({
      isFullscreen: true,
      isOriginalMode: false,
      frameAspectRatio: '1.43:1',
      frameStyleAspectRatio: '1.43 / 1',
      nativeAspectRatio: null,
    });
    expect(trueImaxFS.containerClassName).toBe('justify-center');
    expect(trueImaxFS.maxWidth).toBe('min(99vw, calc(98vh * (1.43 / 1)))');
    expect(trueImaxFS.maxHeight).toBe('98vh');

    const trueImaxWindowed = calculateTheaterProjectionLayout({
      isFullscreen: false,
      isOriginalMode: false,
      frameAspectRatio: '1.43:1',
      frameStyleAspectRatio: '1.43 / 1',
      nativeAspectRatio: null,
    });
    expect(trueImaxWindowed.containerClassName).toBe('justify-start pt-2 sm:pt-3');
    expect(trueImaxWindowed.maxWidth).toBe('min(98vw, calc(94vh * (1.43 / 1)))');
    expect(trueImaxWindowed.maxHeight).toBe('94vh');

    // IMAX (1.90:1)
    const imaxFS = calculateTheaterProjectionLayout({
      isFullscreen: true,
      isOriginalMode: false,
      frameAspectRatio: '1.90:1',
      frameStyleAspectRatio: '1.90 / 1',
      nativeAspectRatio: null,
    });
    expect(imaxFS.containerClassName).toBe('justify-center');
    expect(imaxFS.maxWidth).toBe('min(99vw, calc(98vh * (1.90 / 1)))');
    expect(imaxFS.maxHeight).toBe('98vh');

    const imaxWindowed = calculateTheaterProjectionLayout({
      isFullscreen: false,
      isOriginalMode: false,
      frameAspectRatio: '1.90:1',
      frameStyleAspectRatio: '1.90 / 1',
      nativeAspectRatio: null,
    });
    expect(imaxWindowed.containerClassName).toBe('justify-start pt-2 sm:pt-3');
    expect(imaxWindowed.maxWidth).toBe('min(98vw, calc(92vh * (1.90 / 1)))');
    expect(imaxWindowed.maxHeight).toBe('92vh');
  });
});
