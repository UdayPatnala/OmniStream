import { describe, it, expect, beforeEach } from 'vitest';
import { calculateTheaterProjectionLayout } from '@omnistream/cinemorph/pages/CineMorphTheater';
import { useAppStore } from '@/src/store';
import { useCineMorphStore } from '@omnistream/cinemorph/state/useCineMorphStore';

describe('Tier 1: CineMorph Production Auditorium, Systematic Seating & OMS-SBA (Screen-Behind-Aperture)', () => {
  beforeEach(() => {
    useAppStore.setState({
      theaterSeatingEnabled: true,
      frameAspectRatio: '1.90:1',
      cinemorphTheme: 'cinematic-dark',
    });
    useCineMorphStore.setState({
      aspectRatio: '1.90:1',
    });
  });

  describe('Auditorium Geometry & Screen Safety Rule', () => {
    it('Guarantees absolute screen clearance with seats ON across all 3 authentic apertures', () => {
      // 1.90:1 Windowed with seating
      const layout190 = calculateTheaterProjectionLayout({
        isFullscreen: false,
        isOriginalMode: false,
        frameAspectRatio: '1.90:1',
        frameStyleAspectRatio: '1.90 / 1',
        nativeAspectRatio: null,
        theaterSeatingEnabled: true,
      });
      expect(layout190.maxHeight).toBe('min(82vh, calc(100dvh - 5.5rem))');
      expect(layout190.screenClassName).toBe('mb-2 sm:mb-3');

      // 1.43:1 IMAX Windowed with seating
      const layout143 = calculateTheaterProjectionLayout({
        isFullscreen: false,
        isOriginalMode: false,
        frameAspectRatio: '1.43:1',
        frameStyleAspectRatio: '1.43 / 1',
        nativeAspectRatio: null,
        theaterSeatingEnabled: true,
      });
      expect(layout143.maxHeight).toBe('min(84vh, calc(100dvh - 5.5rem))');
      expect(layout143.screenClassName).toBe('mb-2 sm:mb-3');

      // Original Windowed with seating
      const layoutOrig = calculateTheaterProjectionLayout({
        isFullscreen: false,
        isOriginalMode: true,
        frameAspectRatio: 'original',
        frameStyleAspectRatio: '16 / 9',
        nativeAspectRatio: 1.85,
        theaterSeatingEnabled: true,
      });
      expect(layoutOrig.maxHeight).toBe('min(84vh, calc(100dvh - 5.5rem))');
      expect(layoutOrig.screenClassName).toBe('mb-2 sm:mb-3');
    });

    it('Reclaims maximum usable viewport when seating is OFF without distortion', () => {
      // 1.90:1 Windowed with seating OFF
      const layout190Off = calculateTheaterProjectionLayout({
        isFullscreen: false,
        isOriginalMode: false,
        frameAspectRatio: '1.90:1',
        frameStyleAspectRatio: '1.90 / 1',
        nativeAspectRatio: null,
        theaterSeatingEnabled: false,
      });
      expect(layout190Off.maxHeight).toBe('92vh');
      expect(layout190Off.maxWidth).toBe('min(98vw, calc(92vh * (1.90 / 1)))');
      expect(layout190Off.aspectRatioStyle).toBe('1.90 / 1');

      // 1.43:1 IMAX Windowed with seating OFF
      const layout143Off = calculateTheaterProjectionLayout({
        isFullscreen: false,
        isOriginalMode: false,
        frameAspectRatio: '1.43:1',
        frameStyleAspectRatio: '1.43 / 1',
        nativeAspectRatio: null,
        theaterSeatingEnabled: false,
      });
      expect(layout143Off.maxHeight).toBe('94vh');
      expect(layout143Off.maxWidth).toBe('min(98vw, calc(94vh * (1.43 / 1)))');
      expect(layout143Off.aspectRatioStyle).toBe('1.43 / 1');

      // Fullscreen with seating OFF uses 98vh / 99vw
      const layoutFsOff = calculateTheaterProjectionLayout({
        isFullscreen: true,
        isOriginalMode: false,
        frameAspectRatio: '1.90:1',
        frameStyleAspectRatio: '1.90 / 1',
        nativeAspectRatio: null,
        theaterSeatingEnabled: false,
      });
      expect(layoutFsOff.maxHeight).toBe('98vh');
      expect(layoutFsOff.maxWidth).toBe('min(99vw, calc(98vh * (1.90 / 1)))');
    });

    it('Fullscreen with seating ON reserves dedicated lower clearance', () => {
      const layoutFsOn = calculateTheaterProjectionLayout({
        isFullscreen: true,
        isOriginalMode: false,
        frameAspectRatio: '1.90:1',
        frameStyleAspectRatio: '1.90 / 1',
        nativeAspectRatio: null,
        theaterSeatingEnabled: true,
      });
      expect(layoutFsOn.maxHeight).toBe('min(88vh, calc(100dvh - 5rem))');
      expect(layoutFsOn.maxWidth).toBe('min(99vw, calc(min(88vh, calc(100dvh - 5rem)) * (1.90 / 1)))');
      expect(layoutFsOn.containerClassName).toBe('justify-center');
    });
  });

  describe('OMS-SBA Projection Depth Model Integration', () => {
    it('Preserves exact aspect ratio string across all authentic projection modes', () => {
      const modes = ['1.90:1', '1.43:1'] as const;
      modes.forEach((mode) => {
        const layout = calculateTheaterProjectionLayout({
          isFullscreen: false,
          isOriginalMode: false,
          frameAspectRatio: mode,
          frameStyleAspectRatio: mode === '1.90:1' ? '1.90 / 1' : '1.43 / 1',
          nativeAspectRatio: null,
          theaterSeatingEnabled: true,
        });
        expect(layout.aspectRatioStyle).toBe(mode === '1.90:1' ? '1.90 / 1' : '1.43 / 1');
      });
    });

    it('Preserves native aspect ratio in Original mode regardless of seating state', () => {
      [true, false].forEach((seating) => {
        const layout = calculateTheaterProjectionLayout({
          isFullscreen: false,
          isOriginalMode: true,
          frameAspectRatio: 'original',
          frameStyleAspectRatio: '16 / 9',
          nativeAspectRatio: 2.39,
          theaterSeatingEnabled: seating,
        });
        expect(layout.aspectRatioStyle).toBe('2.39');
      });
    });
  });
});
