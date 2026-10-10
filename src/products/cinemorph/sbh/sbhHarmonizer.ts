/**
 * sbhHarmonizer.ts - OMS-SBH (OmniStream Spatial Behavior & Harmonization) Harmonization Layer
 * Authoritative system-to-system coordinator adhering strictly to the Canonical Terminology Contract.
 * 
 * Pipeline:
 * Media / Viewport -> Source Model -> Intelligence -> Composition Proposal ->
 * Geometry Engine -> Harmonization Layer -> Validation -> Motion Engine ->
 * Atomic OMS-SBH State -> CineMorph Renderer.
 */

import {
  OMSProjectionState,
  OMSPresentationMode,
  OMSFocalPoint,
  OMSGeometryTransition,
  OMSSBHMetrics,
  mapProjectionStateToSharedState,
} from './geometryTypes';
import { solveOMSGeometry, OMSGeometryInput } from './geometrySolver';
import { validateOMSGeometry } from './geometryValidator';
import { OMSTemporalSmoother } from './temporalSmoother';
import { OMSGeometryTransitionEngine } from './transitionEngine';
import { OMSDOMRendererAdapter, OMSDOMRenderOutput } from './domRendererAdapter';
import { omsFailureRecoveryManager, OMSEscalationLevel } from './failureRules';
import { omsGenerationManager } from './generationContract';
import { IOMSSpatialState, OMSEscalationLevel as SharedEscalationLevel } from '../../../shared/contracts/geometryContracts';

/**
 * Atomic Harmonized Output consumed by the CineMorph Renderer
 */
export interface OMSSBHState {
  projectionState: OMSProjectionState;
  renderStyles: OMSDOMRenderOutput;
  transition: OMSGeometryTransition | null;
  isValid: boolean;
  generation: number;
  sharedState: IOMSSpatialState;
}

/**
 * Master Harmonizer for OMS-SBH
 * Coordinates Spatial/Geometry Engine, Composition Engine, Motion Engine, and Intelligence Layer.
 */
export class OMSSBHHarmonizer {
  private motionEngine = new OMSGeometryTransitionEngine();
  private temporalSmoother = new OMSTemporalSmoother();
  private currentState: OMSSBHState | null = null;
  private metrics: OMSSBHMetrics = {
    solveDurationMs: 0,
    validationDurationMs: 0,
    motionDurationMs: 0,
    renderDurationMs: 0,
    totalDurationMs: 0,
    staleDiscardsCount: 0,
    lastSolveTimestamp: 0,
  };

  /**
   * Harmonizes all inputs into an authoritative atomic OMS-SBH state
   */
  public harmonize(input: {
    widthPx: number;
    heightPx: number;
    mode: OMSPresentationMode;
    seatsVisible: boolean;
    isFullscreen?: boolean;
    viewportWidthPx?: number;
    viewportHeightPx?: number;
    intelligenceProposal?: {
      focalPoint?: OMSFocalPoint;
      confidence: number;
      timestamp: number;
      generation?: number;
    };
  }): OMSSBHState {
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const generation = omsGenerationManager.nextGeneration('Spatial Context Harmonization');
    const timestamp = Date.now();

    // 1. Process Intelligence Proposal with confidence gates and generation check (Unified Generation Contract Section 10)
    let validatedFocalPoint: OMSFocalPoint | undefined = undefined;
    if (
      input.intelligenceProposal &&
      input.intelligenceProposal.focalPoint &&
      input.intelligenceProposal.confidence >= 0.50 &&
      omsGenerationManager.validateFreshness(
        {
          generation: input.intelligenceProposal.generation ?? generation,
          result: input.intelligenceProposal.focalPoint,
          timestamp: input.intelligenceProposal.timestamp,
        },
        'Intelligence Layer'
      )
    ) {
      validatedFocalPoint = input.intelligenceProposal.focalPoint;
    }

    // 2. Geometry Engine: Solve spatial relationships
    const tSolve0 = typeof performance !== 'undefined' ? performance.now() : 0;
    const geometryInput: OMSGeometryInput = {
      widthPx: input.widthPx,
      heightPx: input.heightPx,
      mode: input.mode,
      seatsVisible: input.seatsVisible,
      isFullscreen: input.isFullscreen,
      viewportWidthPx: input.viewportWidthPx,
      viewportHeightPx: input.viewportHeightPx,
      focalPoint: validatedFocalPoint,
      generation,
      timestamp,
    };

    const solvedGeometry = solveOMSGeometry(geometryInput);
    const tSolve1 = typeof performance !== 'undefined' ? performance.now() : 0;

    // 3. Harmonization Layer: Validate state coherence and containment
    const tVal0 = typeof performance !== 'undefined' ? performance.now() : 0;
    let finalProjectionState = solvedGeometry;
    let escalationLevel: SharedEscalationLevel = 'LEVEL_0';
    const validation = validateOMSGeometry(solvedGeometry);

    if (validation.valid) {
      omsFailureRecoveryManager.commitValidState(solvedGeometry);
    } else {
      const recovered = omsFailureRecoveryManager.escalateAndRecover(
        solvedGeometry,
        solvedGeometry.source.aspectRatio,
        generation,
        validation.errors[0]?.message || 'Harmonization validation failure'
      );
      finalProjectionState = recovered.state;
      escalationLevel =
        recovered.level === OMSEscalationLevel.LEVEL_1_CONSERVATIVE
          ? 'LEVEL_1'
          : recovered.level === OMSEscalationLevel.LEVEL_2_DETERMINISTIC
          ? 'LEVEL_2'
          : recovered.level === OMSEscalationLevel.LEVEL_3_LAST_KNOWN_VALID
          ? 'LEVEL_3'
          : 'LEVEL_4';
    }
    const tVal1 = typeof performance !== 'undefined' ? performance.now() : 0;

    // 4. Motion Engine: Apply temporal smoothing and register transition
    const tMot0 = typeof performance !== 'undefined' ? performance.now() : 0;
    const smoothedCrop = this.temporalSmoother.smooth(finalProjectionState.crop, timestamp);
    const harmonizedProjectionState: OMSProjectionState = {
      ...finalProjectionState,
      crop: smoothedCrop,
    };

    const transition = this.motionEngine.transitionTo(harmonizedProjectionState, 600, timestamp);
    const tMot1 = typeof performance !== 'undefined' ? performance.now() : 0;

    // 5. Render Adapter: Map atomic state to CineMorph Renderer outputs
    const tRend0 = typeof performance !== 'undefined' ? performance.now() : 0;
    const renderStyles = OMSDOMRendererAdapter.mapStateToStyles(
      harmonizedProjectionState,
      Boolean(input.isFullscreen)
    );
    const tRend1 = typeof performance !== 'undefined' ? performance.now() : 0;

    const sharedState = mapProjectionStateToSharedState(
      harmonizedProjectionState,
      Boolean(input.isFullscreen),
      escalationLevel
    );

    const atomicState: OMSSBHState = {
      projectionState: harmonizedProjectionState,
      renderStyles,
      transition,
      isValid: true, // Guaranteed valid through escalation hierarchy
      generation,
      sharedState,
    };

    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

    // Record Telemetry
    this.metrics = {
      solveDurationMs: Number((tSolve1 - tSolve0).toFixed(4)),
      validationDurationMs: Number((tVal1 - tVal0).toFixed(4)),
      motionDurationMs: Number((tMot1 - tMot0).toFixed(4)),
      renderDurationMs: Number((tRend1 - tRend0).toFixed(4)),
      totalDurationMs: Number((endTime - startTime).toFixed(4)),
      staleDiscardsCount: omsGenerationManager.getStaleDiagnostics().length,
      lastSolveTimestamp: timestamp,
    };

    this.currentState = atomicState;
    return atomicState;
  }

  public getCurrentState(): OMSSBHState | null {
    return this.currentState;
  }

  public getMetrics(): OMSSBHMetrics {
    return { ...this.metrics };
  }

  public getMotionEngine(): OMSGeometryTransitionEngine {
    return this.motionEngine;
  }

  public getTemporalSmoother(): OMSTemporalSmoother {
    return this.temporalSmoother;
  }
}

/** Singleton instance for CineMorph Theater */
export const omsSBHHarmonizer = new OMSSBHHarmonizer();
