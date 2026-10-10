import { describe, it, expect } from 'vitest';
import {
  CineMorphSpatialEngine,
  cineMorphSpatialEngine,
  solveCineMorphGeometry,
  validateCineMorphGeometry,
  CineMorphSpringMotion,
  CineMorphTransitionEngine,
  CineMorphDOMRenderer,
  cineMorphRecoveryManager,
  CineMorphEscalationLevel,
  omsSBHHarmonizer,
  OMS_GEOMETRY_CONFIG,
} from '@omnistream/cinemorph/spatial';
import { OMSSBHHarmonizer } from '@omnistream/cinemorph/sbh';

describe('CineMorph Spatial Model & Canonical Engine', () => {
  it('T-SPATIAL-01: computeSpatialState computes valid, bounded geometry across all 3 apertures', () => {
    const modes: Array<'original' | '1.90' | '1.43'> = ['original', '1.90', '1.43'];

    for (const mode of modes) {
      const state = cineMorphSpatialEngine.computeSpatialState({
        widthPx: 1920,
        heightPx: 1080,
        viewportWidthPx: 1920,
        viewportHeightPx: 1080,
        mode,
        seatsVisible: true,
        isFullscreen: false,
      });

      expect(state).toBeDefined();
      expect(state.projectionState).toBeDefined();
      expect(state.renderStyles).toBeDefined();
      expect(state.projectionState.presentation.mode).toBe(mode);
      expect(state.isValid).toBe(true);

      // Normalized coordinates must be within [0, 1]
      const { projection, screen, aperture } = state.projectionState;
      expect(projection.bounds.width).toBeGreaterThan(0);
      expect(projection.bounds.height).toBeGreaterThan(0);
      expect(projection.bounds.width).toBeLessThanOrEqual(1.0);
      expect(projection.bounds.height).toBeLessThanOrEqual(1.0);

      expect(screen.bounds.width).toBeGreaterThan(0);
      expect(screen.bounds.height).toBeGreaterThan(0);
      expect(aperture.bounds.width).toBeGreaterThan(0);
      expect(aperture.bounds.height).toBeGreaterThan(0);
    }
  });

  it('T-SPATIAL-02: enforces strict sightline non-overlap invariant when seats are enabled', () => {
    const stateWithSeats = cineMorphSpatialEngine.computeSpatialState({
      widthPx: 1920,
      heightPx: 1080,
      viewportWidthPx: 1920,
      viewportHeightPx: 1080,
      mode: '1.43',
      seatsVisible: true,
      isFullscreen: false,
    });

    const stateWithoutSeats = cineMorphSpatialEngine.computeSpatialState({
      widthPx: 1920,
      heightPx: 1080,
      viewportWidthPx: 1920,
      viewportHeightPx: 1080,
      mode: '1.43',
      seatsVisible: false,
      isFullscreen: false,
    });

    const projSeats = stateWithSeats.projectionState.projection.bounds;
    const projNoSeats = stateWithoutSeats.projectionState.projection.bounds;

    // Sightline non-overlap: bottom of visible projection with seats
    const projBottomWithSeats = projSeats.y + projSeats.height;
    expect(projBottomWithSeats).toBeLessThanOrEqual(1.0);

    // Screen expands downward when seats are cleared
    const projBottomNoSeats = projNoSeats.y + projNoSeats.height;
    expect(projBottomNoSeats).toBeGreaterThan(projBottomWithSeats);
  });

  it('T-SPATIAL-03: validates strict proscenium containment: VisibleProjection ⊆ Aperture ⊆ Screen', () => {
    const state = cineMorphSpatialEngine.computeSpatialState({
      widthPx: 1920,
      heightPx: 800, // wider content
      viewportWidthPx: 1920,
      viewportHeightPx: 1080,
      mode: '1.90',
      seatsVisible: true,
      isFullscreen: true,
    });

    const { projection, aperture, screen } = state.projectionState;

    // VisibleProjection must fit within Aperture
    expect(projection.bounds.width).toBeLessThanOrEqual(aperture.bounds.width + 0.001);
    expect(projection.bounds.height).toBeLessThanOrEqual(aperture.bounds.height + 0.001);

    // Aperture must fit within Screen
    expect(aperture.bounds.width).toBeLessThanOrEqual(screen.bounds.width + 0.001);
    expect(aperture.bounds.height).toBeLessThanOrEqual(screen.bounds.height + 0.001);
  });

  it('T-SPATIAL-04: critically damped spring motion and transition engine integrate seamlessly', () => {
    const smoother = new CineMorphSpringMotion();
    smoother.reset({ x: 0.1, y: 0.1, width: 0.8, height: 0.5 });

    // Step toward target with dt = 16.67ms (60fps)
    const target = { x: 0.15, y: 0.12, width: 0.7, height: 0.45 };
    const stepped = smoother.smooth(target, 16.67);
    expect(stepped.width).toBeLessThan(0.8);
    expect(stepped.width).toBeGreaterThan(0.7);

    // Transition engine wraps smoother with generations
    const transitionEngine = new CineMorphTransitionEngine();
    expect(transitionEngine.getGeneration()).toBe(0);
    const nextGen = transitionEngine.nextGeneration();
    expect(nextGen).toBe(1);
    expect(transitionEngine.getGeneration()).toBe(1);
  });

  it('T-SPATIAL-05: cineMorphRecoveryManager executes normative 5-tier escalation hierarchy', () => {
    const invalidCandidate = {
      ...solveCineMorphGeometry({ widthPx: 1920, heightPx: 1080, mode: '1.90', seatsVisible: true }),
      source: { widthPx: -1, heightPx: 0, aspectRatio: NaN, orientation: 'landscape' as const },
    };

    const recoveryResult = cineMorphRecoveryManager.escalateAndRecover(
      invalidCandidate as any,
      16 / 9,
      10,
      'Intentional candidate corruption'
    );

    expect(recoveryResult.level).toBe(CineMorphEscalationLevel.LEVEL_2_DETERMINISTIC);
    expect(validateCineMorphGeometry(recoveryResult.state).valid).toBe(true);
    expect(cineMorphRecoveryManager.wasFallbackUsed()).toBe(true);
    expect(cineMorphRecoveryManager.getFailureLog().length).toBeGreaterThan(0);
  });

  it('T-SPATIAL-06: CineMorphDOMRenderer maps projection state to production-ready CSS styles', () => {
    const rawGeometry = solveCineMorphGeometry({
      widthPx: 1920,
      heightPx: 1080,
      viewportWidthPx: 1920,
      viewportHeightPx: 1080,
      mode: 'original',
      seatsVisible: true,
      isFullscreen: false,
    });

    const domOutput = CineMorphDOMRenderer.mapStateToStyles(rawGeometry, false);

    expect(domOutput.screenStyle).toBeDefined();
    expect(domOutput.screenStyle.maxWidth).toBeDefined();
    expect(domOutput.screenStyle.maxHeight).toBeDefined();
    expect(domOutput.screenStyle.aspectRatio).toBe('1.777778');

    expect(domOutput.projectionPlaneStyle).toBeDefined();
    expect(domOutput.captionSafeZoneStyle.position).toBe('absolute');
  });

  it('T-SPATIAL-07: cineMorphSpatialEngine preserves singleton identity and backward compatibility', () => {
    expect(cineMorphSpatialEngine).toBeInstanceOf(CineMorphSpatialEngine);
    expect(cineMorphSpatialEngine).toBeInstanceOf(OMSSBHHarmonizer);

    // Backward-compatible alias exports point to the exact same singleton
    expect(omsSBHHarmonizer).toBe(cineMorphSpatialEngine);
    expect(OMS_GEOMETRY_CONFIG.ASPECT_IMAX_TALL).toBe(1.43);
    expect(OMS_GEOMETRY_CONFIG.ASPECT_CINEMA_WIDE).toBe(1.90);
  });
});
