/**
 * transitionEngine.ts - OMS-SBH Spatial Transition Engine
 * Coordinates mode switches, seat transitions, interruption convergence, and temporal progress sampling (Points 98–103)
 */

import { OMSProjectionState, OMSGeometryTransition, OMSRect, OMSPoint } from './geometryTypes';
import { OMS_GEOMETRY_CONFIG } from './geometryConfig';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpRect(from: OMSRect, to: OMSRect, t: number): OMSRect {
  return {
    x: Number(lerp(from.x, to.x, t).toFixed(6)),
    y: Number(lerp(from.y, to.y, t).toFixed(6)),
    width: Number(lerp(from.width, to.width, t).toFixed(6)),
    height: Number(lerp(from.height, to.height, t).toFixed(6)),
  };
}

function lerpPoint(from: OMSPoint, to: OMSPoint, t: number): OMSPoint {
  return {
    x: Number(lerp(from.x, to.x, t).toFixed(6)),
    y: Number(lerp(from.y, to.y, t).toFixed(6)),
  };
}

export class OMSGeometryTransitionEngine {
  private currentGeneration: number = 0;
  private activeTransition: OMSGeometryTransition | null = null;
  private currentState: OMSProjectionState | null = null;

  public getGeneration(): number {
    return this.currentGeneration;
  }

  public nextGeneration(): number {
    this.currentGeneration += 1;
    return this.currentGeneration;
  }

  /**
   * Registers a target state transition.
   * If an existing transition is in progress, smoothly converges from current interpolated state (Point 101).
   */
  public transitionTo(
    targetState: OMSProjectionState,
    durationMs: number = OMS_GEOMETRY_CONFIG.DEFAULT_TRANSITION_DURATION_MS,
    startTime: number = Date.now()
  ): OMSGeometryTransition {
    const generation = this.nextGeneration();

    // If an existing transition is running, sample where we currently are so there is zero visual jump
    const fromState = this.activeTransition
      ? this.sample(startTime)
      : this.currentState || targetState;

    const clampedDuration = Math.min(
      OMS_GEOMETRY_CONFIG.MAX_ALLOWED_TRANSITION_DURATION_MS,
      Math.max(50, durationMs)
    );

    const transition: OMSGeometryTransition = {
      from: fromState,
      to: targetState,
      progress: 0,
      durationMs: clampedDuration,
      generation,
      startTime,
    };

    this.activeTransition = transition;
    this.currentState = targetState;
    return transition;
  }

  /**
   * Samples the interpolated spatial state at the given timestamp
   * Employs Hermite smoothstep easing (3t^2 - 2t^3) for organic deceleration
   */
  public sample(nowMs: number = Date.now()): OMSProjectionState {
    if (!this.activeTransition) {
      if (!this.currentState) {
        throw new Error('[OMS Transition Engine] Cannot sample state: engine not initialized');
      }
      return this.currentState;
    }

    const { from, to, durationMs, startTime = nowMs } = this.activeTransition;
    const elapsed = nowMs - startTime;
    const rawProgress = Math.min(1.0, Math.max(0, elapsed / durationMs));
    this.activeTransition.progress = rawProgress;

    // Hermite smoothstep easing
    const easedT = rawProgress * rawProgress * (3 - 2 * rawProgress);

    if (rawProgress >= 1.0) {
      this.commit(to);
      return to;
    }

    const interpolatedScreenBounds = lerpRect(from.screen.bounds, to.screen.bounds, easedT);
    const interpolatedScreenCenter = lerpPoint(from.screen.center, to.screen.center, easedT);
    const interpolatedApertureBounds = lerpRect(from.aperture.bounds, to.aperture.bounds, easedT);
    const interpolatedCrop = lerpRect(from.crop, to.crop, easedT);

    const interpolatedScale = Number(lerp(from.projection.scale, to.projection.scale, easedT).toFixed(4));
    const interpolatedOffset = lerpPoint(from.projection.offset, to.projection.offset, easedT);

    const interpolatedState: OMSProjectionState = {
      ...to,
      screen: {
        ...to.screen,
        bounds: interpolatedScreenBounds,
        center: interpolatedScreenCenter,
      },
      aperture: {
        ...to.aperture,
        bounds: interpolatedApertureBounds,
        center: interpolatedScreenCenter,
      },
      projection: {
        ...to.projection,
        bounds: interpolatedApertureBounds,
        scale: interpolatedScale,
        offset: interpolatedOffset,
        crop: interpolatedCrop,
      },
      crop: interpolatedCrop,
      generation: this.activeTransition.generation,
      timestamp: nowMs,
    };

    return interpolatedState;
  }

  /**
   * Validates whether an incoming asynchronous result matches the active generation (Point 103)
   */
  public isGenerationValid(generation: number): boolean {
    return generation === this.currentGeneration;
  }

  /**
   * Returns whether an active animated transition is currently in progress
   */
  public isTransitioning(): boolean {
    return this.activeTransition !== null && this.activeTransition.progress < 1.0;
  }

  /**
   * Completes the active transition, committing the final target state
   */
  public commit(state: OMSProjectionState): void {
    this.currentState = state;
    this.activeTransition = null;
  }

  /**
   * Cancels any active transition immediately
   */
  public cancel(): void {
    this.activeTransition = null;
  }

  public getActiveTransition(): OMSGeometryTransition | null {
    return this.activeTransition;
  }

  public getCurrentState(): OMSProjectionState | null {
    return this.currentState;
  }
}
