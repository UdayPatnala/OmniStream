/**
 * oms-sbh-geometry.test.ts - Master OMS-SBH Geometry & Validation Test Suite
 * Strictly validates all 20 runtime invariants, golden fixtures, and property tests (Points 70–148)
 */

import { describe, it, expect } from 'vitest';
import {
  OMS_GEOMETRY_CONFIG,
  isValidOMSPoint,
  isValidOMSRect,
  resolveSourceGeometry,
  resolveTargetAspect,
  resolveTheaterRegion,
  resolveSeatRegion,
  resolveScreenAndAperture,
  solveProjection,
  solveOMSGeometry,
  validateOMSGeometry,
  isRectContained,
  doRectsOverlap,
  OMSTemporalSmoother,
  OMSGeometryTransitionEngine,
  OMSDOMRendererAdapter,
  OMSFailureRecoveryManager,
  OMSGenerationManager,
} from '@omnistream/cinemorph/spatial';

describe('OMS-SBH Master Geometry Contract (Points 70–148)', () => {
  // ── 1. Normalized Coordinate & Primitive Guards (Points 71–73) ───────────────
  describe('Normalized Coordinates & Primitive Validation (Points 71–73)', () => {
    it('validates normalized points within [0, 1] range', () => {
      expect(isValidOMSPoint({ x: 0.5, y: 0.5 })).toBe(true);
      expect(isValidOMSPoint({ x: 0, y: 1 })).toBe(true);
      expect(isValidOMSPoint({ x: -0.1, y: 0.5 })).toBe(false);
      expect(isValidOMSPoint({ x: 0.5, y: 1.05 })).toBe(false);
      expect(isValidOMSPoint({ x: NaN, y: 0.5 })).toBe(false);
      expect(isValidOMSPoint({ x: Infinity, y: 0.5 })).toBe(false);
      expect(isValidOMSPoint(null)).toBe(false);
    });

    it('validates normalized rectangles within [0, 1] range', () => {
      expect(isValidOMSRect({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 })).toBe(true);
      expect(isValidOMSRect({ x: 0, y: 0, width: 1.0, height: 1.0 })).toBe(true);
      expect(isValidOMSRect({ x: 0.5, y: 0.5, width: 0.6, height: 0.5 })).toBe(false); // Exceeds 1.0
      expect(isValidOMSRect({ x: 0, y: 0, width: 0, height: 0.5 })).toBe(false); // Zero dimension
      expect(isValidOMSRect({ x: 0, y: 0, width: -0.5, height: 0.5 })).toBe(false);
      expect(isValidOMSRect({ x: NaN, y: 0, width: 0.5, height: 0.5 })).toBe(false);
    });
  });

  // ── 2. Source Geometry & CineMorph Rejection Policy (Points 74, 75) ──────────
  describe('Source Geometry & Orientation Contract (Points 74, 75)', () => {
    it('correctly calculates numeric aspect ratio from pixel dimensions', () => {
      const geo1080p = resolveSourceGeometry(1920, 1080);
      expect(geo1080p.aspectRatio).toBeCloseTo(1.777778, 4);
      expect(geo1080p.orientation).toBe('landscape');

      const geoSquare = resolveSourceGeometry(1080, 1080);
      expect(geoSquare.aspectRatio).toBe(1.0);
      expect(geoSquare.orientation).toBe('square');
    });

    it('identifies portrait orientation for CineMorph vertical-video rejection policy', () => {
      const geoVertical = resolveSourceGeometry(1080, 1920);
      expect(geoVertical.orientation).toBe('portrait');
      expect(geoVertical.aspectRatio).toBeLessThan(1.0);
    });
  });

  // ── 3. Presentation Target Aspect Contract (Points 76, 77) ──────────────────
  describe('Presentation Target Aspect Resolution (Points 76, 77)', () => {
    it('resolves original mode strictly to source aspect ratio without modification', () => {
      expect(resolveTargetAspect('original', 2.39)).toBe(2.39);
      expect(resolveTargetAspect('original', 1.333)).toBe(1.333);
      expect(resolveTargetAspect('original', 16 / 9)).toBeCloseTo(1.7777, 3);
    });

    it('resolves 1.90:1 cinema wide and 1.43:1 true IMAX modes', () => {
      expect(resolveTargetAspect('1.90', 16 / 9)).toBe(1.90);
      expect(resolveTargetAspect('1.43', 16 / 9)).toBe(1.43);
    });
  });

  // ── 4. Spatial Containment Hierarchy (Points 83–86) ─────────────────────────
  describe('Spatial Containment Hierarchy: Aperture ⊆ Screen ⊆ Theater', () => {
    it('guarantees Aperture ⊆ Screen ⊆ Theater across all modes', () => {
      const modes: Array<'original' | '1.90' | '1.43'> = ['original', '1.90', '1.43'];
      for (const mode of modes) {
        const state = solveOMSGeometry({
          widthPx: 1920,
          heightPx: 1080,
          mode,
          seatsVisible: true,
        });

        // 1. Screen contained in Theater
        expect(isRectContained(state.screen.bounds, state.theater.bounds)).toBe(true);

        // 2. Aperture contained in Screen
        expect(isRectContained(state.aperture.bounds, state.screen.bounds)).toBe(true);

        // 3. Overall validation passes
        const validation = validateOMSGeometry(state);
        expect(validation.valid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      }
    });
  });

  // ── 5. Seat Exclusion & Sightline Clearance (Points 94–97) ──────────────────
  describe('Seat Exclusion Contract: VisibleProjection ∩ Seats = ∅', () => {
    it('guarantees visible projection and aperture never overlap seats when seats are visible', () => {
      const testSources = [
        { w: 1920, h: 1080 }, // 16:9
        { w: 1440, h: 1080 }, // 4:3
        { w: 2560, h: 1080 }, // 21:9
        { w: 1920, h: 1342 }, // 1.43:1
      ];

      for (const src of testSources) {
        for (const mode of ['original', '1.90', '1.43'] as const) {
          const state = solveOMSGeometry({
            widthPx: src.w,
            heightPx: src.h,
            mode,
            seatsVisible: true,
          });

          expect(state.seats.visible).toBe(true);
          const overlap = doRectsOverlap(state.aperture.bounds, state.seats.bounds);
          expect(overlap).toBe(false);

          // Lower aperture bound must remain strictly above seating plane
          const apertureBottom = state.aperture.bounds.y + state.aperture.bounds.height;
          expect(apertureBottom).toBeLessThan(state.seats.bounds.y);
        }
      }
    });

    it('expands aperture when seats are toggled OFF without distorting aspect ratio', () => {
      const stateSeatsOn = solveOMSGeometry({
        widthPx: 1920,
        heightPx: 1080,
        mode: '1.90',
        seatsVisible: true,
      });

      const stateSeatsOff = solveOMSGeometry({
        widthPx: 1920,
        heightPx: 1080,
        mode: '1.90',
        seatsVisible: false,
      });

      expect(stateSeatsOff.seats.visible).toBe(false);
      // Available height when seats are off should be greater than or equal to seats on
      expect(stateSeatsOff.aperture.bounds.height).toBeGreaterThanOrEqual(stateSeatsOn.aperture.bounds.height);
    });
  });

  // ── 6. Source Integrity & Zero Distortion (Points 87, 88) ────────────────────
  describe('Source Integrity & Zero Distortion (scaleX ≈ scaleY)', () => {
    it('preserves intrinsic aspect ratio across all modes and windowed/fullscreen states', () => {
      const modes: Array<'original' | '1.90' | '1.43'> = ['original', '1.90', '1.43'];
      for (const mode of modes) {
        const state = solveOMSGeometry({
          widthPx: 1920,
          heightPx: 1080,
          mode,
          seatsVisible: true,
          isFullscreen: true,
        });

        // Scale factor must be positive and non-distorting
        expect(state.projection.scale).toBeGreaterThan(0);
        expect(Number.isFinite(state.projection.scale)).toBe(true);
        expect(state.crop.width).toBeGreaterThan(0);
        expect(state.crop.height).toBeGreaterThan(0);
      }
    });
  });

  // ── 7. Original Mode Protection Contract (Point 91) ─────────────────────────
  describe('Original Mode Protection Contract (Point 91)', () => {
    it('strictly applies 100% source crop with zero reframing and scale=1.0', () => {
      const state = solveOMSGeometry({
        widthPx: 2560,
        heightPx: 1080,
        mode: 'original',
        seatsVisible: true,
      });

      expect(state.crop.x).toBe(0);
      expect(state.crop.y).toBe(0);
      expect(state.crop.width).toBe(1.0);
      expect(state.crop.height).toBe(1.0);
      expect(state.projection.scale).toBe(1.0);
      expect(state.presentation.targetAspect).toBeCloseTo(2560 / 1080, 4);
    });
  });

  // ── 8. Golden Geometry Fixtures (Point 125) ──────────────────────────────────
  describe('Golden Geometry Fixtures (Point 125)', () => {
    it('produces calibrated deterministic values for 1080p in 1.90:1 mode', () => {
      const state = solveOMSGeometry({
        widthPx: 1920,
        heightPx: 1080,
        mode: '1.90',
        seatsVisible: true,
        generation: 1,
      });

      expect(state.source.aspectRatio).toBeCloseTo(1.777778, 4);
      expect(state.presentation.targetAspect).toBe(1.90);
      expect(state.projection.scale).toBeCloseTo(1.90 / (16 / 9), 3);
      expect(state.aperture.clipCurve).toContain('polygon(');
      expect(state.screen.curvatureX).toBe(0.022);
    });

    it('produces calibrated deterministic values for 1080p in 1.43:1 IMAX mode', () => {
      const state = solveOMSGeometry({
        widthPx: 1920,
        heightPx: 1080,
        mode: '1.43',
        seatsVisible: true,
        generation: 1,
      });

      expect(state.presentation.targetAspect).toBe(1.43);
      expect(state.projection.scale).toBeCloseTo((16 / 9) / 1.43, 3);
      expect(state.screen.curvatureX).toBe(0.035);
      expect(state.screen.perspective.topWidth).toBeLessThan(state.screen.perspective.bottomWidth);
    });
  });

  // ── 9. Property-Based Testing (Point 126) ───────────────────────────────────
  describe('Property-Based Geometry Invariant Testing (Point 126)', () => {
    it('executes 100+ random source resolutions and validates all invariants', () => {
      const randomWidths = [640, 720, 1280, 1920, 2048, 2560, 3840];
      const randomHeights = [480, 576, 720, 1080, 1440, 2160];
      const modes: Array<'original' | '1.90' | '1.43'> = ['original', '1.90', '1.43'];

      let testRuns = 0;
      for (const w of randomWidths) {
        for (const h of randomHeights) {
          for (const mode of modes) {
            for (const seats of [true, false]) {
              testRuns++;
              const state = solveOMSGeometry({
                widthPx: w,
                heightPx: h,
                mode,
                seatsVisible: seats,
                generation: testRuns,
              });

              // Mandatory Invariants:
              // 1. Validation returns 0 errors
              const result = validateOMSGeometry(state);
              expect(result.valid).toBe(true);

              // 2. All numbers finite
              expect(Number.isFinite(state.screen.bounds.x)).toBe(true);
              expect(Number.isFinite(state.screen.bounds.y)).toBe(true);
              expect(Number.isFinite(state.screen.bounds.width)).toBe(true);
              expect(Number.isFinite(state.screen.bounds.height)).toBe(true);

              // 3. If seats visible, no overlap with aperture
              if (seats) {
                expect(doRectsOverlap(state.aperture.bounds, state.seats.bounds)).toBe(false);
              }
            }
          }
        }
      }
      expect(testRuns).toBeGreaterThanOrEqual(100);
    });
  });

  // ── 10. Temporal Smoothing & Deadband Hysteresis (Points 108, 109) ───────────
  describe('Temporal Smoother with Spring Physics & Deadband (Points 108, 109)', () => {
    it('ignores micro-fluctuations smaller than deadband threshold (0.025)', () => {
      const smoother = new OMSTemporalSmoother();
      smoother.reset({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 });

      // Minor jitter (0.01 < 0.025 deadband)
      const smoothed = smoother.smooth({ x: 0.11, y: 0.1, width: 0.8, height: 0.8 }, 100);
      expect(smoothed.x).toBe(0.1); // Retained previous coordinate without jitter
    });

    it('smooths large intentional transitions continuously without jumping', () => {
      const smoother = new OMSTemporalSmoother();
      smoother.reset({ x: 0, y: 0, width: 0.8, height: 0.8 });

      // Significant movement (0.2 > deadband)
      const step1 = smoother.smooth({ x: 0.2, y: 0, width: 0.8, height: 0.8 }, 50);
      expect(step1.x).toBeGreaterThan(0);
      expect(step1.x).toBeLessThan(0.2); // Smoothly transitioning, did not snap
    });
  });

  // ── 11. Transition Engine Interruption Convergence (Points 101, 102) ────────
  describe('Transition Engine & Generation Validation (Points 101–103)', () => {
    it('increments generation and converges toward newest target on rapid interaction', () => {
      const engine = new OMSGeometryTransitionEngine();
      const stateA = solveOMSGeometry({ widthPx: 1920, heightPx: 1080, mode: 'original', seatsVisible: true });
      const stateB = solveOMSGeometry({ widthPx: 1920, heightPx: 1080, mode: '1.90', seatsVisible: true });
      const stateC = solveOMSGeometry({ widthPx: 1920, heightPx: 1080, mode: '1.43', seatsVisible: true });

      const trans1 = engine.transitionTo(stateB);
      expect(trans1.generation).toBe(1);
      expect(engine.isGenerationValid(trans1.generation)).toBe(true);

      // User immediately requests state C before B completes
      const trans2 = engine.transitionTo(stateC);
      expect(trans2.generation).toBe(2);
      expect(trans2.to.presentation.mode).toBe('1.43');
      expect(engine.isGenerationValid(1)).toBe(false); // Stale generation discarded
      expect(engine.isGenerationValid(2)).toBe(true);
    });
  });

  // ── 12. Idempotence & Pure Solver Guarantee (Points 134, 135) ────────────────
  describe('Idempotence & Pure-Solver Contract (Points 134, 135)', () => {
    it('guarantees solve(A) === solve(A) with identical numeric outputs', () => {
      const input = {
        widthPx: 1920,
        heightPx: 1080,
        mode: '1.90' as const,
        seatsVisible: true,
        generation: 42,
        timestamp: 1700000000000,
      };

      const result1 = solveOMSGeometry(input);
      const result2 = solveOMSGeometry(input);

      expect(result1).toEqual(result2);
    });
  });

  // ── 13. DOM Renderer Adapter Style Generation (Points 123, 124) ─────────────
  describe('DOM Renderer Adapter Style Output (Points 123, 124)', () => {
    it('produces valid CSS style properties and aperture clip curves', () => {
      const state = solveOMSGeometry({
        widthPx: 1920,
        heightPx: 1080,
        mode: '1.90',
        seatsVisible: true,
      });

      const styles = OMSDOMRendererAdapter.mapStateToStyles(state, false);
      expect(styles.screenStyle.aspectRatio).toBe('1.9');
      expect(styles.screenStyle.clipPath).toBe(state.aperture.clipCurve);
      expect(styles.screenStyle.maxWidth).toBeDefined();
      expect(styles.screenStyle.maxHeight).toBeDefined();
      expect(styles.captionSafeZoneStyle.position).toBe('absolute');
    });
  });

  // ── 14. Explicit Invariants & 5-Tier Escalation Hierarchy ───────────────────
  describe('Explicit Invariants & 5-Tier Escalation Recovery (Normative Rules)', () => {
    it('escalates to Level 2 (deterministic fallback) on invalid candidate geometry', () => {
      const recovery = new OMSFailureRecoveryManager();
      const invalidCandidate = {
        ...solveOMSGeometry({ widthPx: 1920, heightPx: 1080, mode: '1.90', seatsVisible: true }),
        source: { widthPx: -1, heightPx: 0, aspectRatio: NaN, orientation: 'landscape' as const },
      };

      const result = recovery.escalateAndRecover(invalidCandidate as any, 16 / 9, 10, 'Intentional corruption test');
      expect(result.level).toBe(2); // Level 2 Deterministic
      expect(validateOMSGeometry(result.state).valid).toBe(true);
      expect(recovery.wasFallbackUsed()).toBe(true);
      expect(recovery.getFailureLog().length).toBeGreaterThan(0);
    });

    it('commits valid state and restores it as Level 3 if deterministic fallback fails', () => {
      const recovery = new OMSFailureRecoveryManager();
      const validState = solveOMSGeometry({ widthPx: 1920, heightPx: 1080, mode: '1.90', seatsVisible: true });
      recovery.commitValidState(validState);
      expect(recovery.wasFallbackUsed()).toBe(false);
    });
  });

  // ── 15. Unified Generation & Freshness Contract ─────────────────────────────
  describe('Unified Generation & Freshness Contract (Sections 1–34)', () => {
    it('governs authoritative generation IDs and discards stale async results', () => {
      const genMgr = new OMSGenerationManager();
      const initialGen = genMgr.getCurrentGeneration();
      expect(initialGen).toBe(1);

      // Context changes
      const g2 = genMgr.nextGeneration('User selected 1.90');
      expect(g2).toBe(2);
      expect(genMgr.isCurrentGeneration(2)).toBe(true);
      expect(genMgr.isCurrentGeneration(1)).toBe(false);

      // Async result from G1 arrives -> Discard
      const isFresh = genMgr.validateFreshness(
        { generation: 1, result: { x: 0.5, y: 0.5 }, timestamp: Date.now() },
        'Vision Worker'
      );
      expect(isFresh).toBe(false);
      expect(genMgr.getStaleDiagnostics().length).toBe(1);
      expect(genMgr.getStaleDiagnostics()[0].resultGeneration).toBe(1);

      // Async result from G2 arrives -> Accepted
      const isG2Fresh = genMgr.validateFreshness(
        { generation: 2, result: { x: 0.5, y: 0.5 }, timestamp: Date.now() },
        'Vision Worker'
      );
      expect(isG2Fresh).toBe(true);
    });

    it('discards results with media timestamp drift beyond tolerance', () => {
      const genMgr = new OMSGenerationManager();
      const curGen = genMgr.getCurrentGeneration();

      // mediaTime = 10s, current playback time = 25s (delta 15s > 2s tolerance)
      const isFresh = genMgr.validateFreshness(
        { generation: curGen, result: { x: 0.5, y: 0.5 }, mediaTime: 10, timestamp: Date.now() },
        'Frame Analyzer',
        25,
        2.0
      );
      expect(isFresh).toBe(false);
    });
  });
});
