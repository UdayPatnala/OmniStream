/**
 * OmniStream / CineMorph — Authoritative Shared Geometry & Spatial Contracts
 *
 * Strictly runtime-independent interfaces, types, and mathematical invariants.
 * Zero DOM, zero React, zero Canvas, and zero browser dependencies.
 */

export interface OMSNormalizedRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export type OMSAspectPreset = 'Original' | '1.90:1' | '1.43:1';

export type OMSPresentationMode = 'cinema' | 'original' | 'immersive';

export type OMSEscalationLevel =
  | 'LEVEL_0' // Normal intelligent composition
  | 'LEVEL_1' // Conservative safe crop within aperture
  | 'LEVEL_2' // Pure deterministic center-fit fallback
  | 'LEVEL_3' // Revert to last known valid state
  | 'LEVEL_4'; // Safe baseline theater state (16:9 center crop)

export type OMSFailureCode =
  | 'NON_FINITE_COORDINATES'
  | 'NON_POSITIVE_DIMENSIONS'
  | 'SCREEN_EXCEEDS_THEATER'
  | 'APERTURE_EXCEEDS_SCREEN'
  | 'PROJECTION_EXCEEDS_APERTURE'
  | 'SEAT_INTERSECTION_VIOLATION'
  | 'ASPECT_RATIO_DISTORTION'
  | 'CURVATURE_BOUNDS_EXCEEDED'
  | 'UNSUPPORTED_ASPECT_RATIO'
  | 'STALE_GENERATION_CONTEXT'
  | 'TRANSITION_DEADLOCK'
  | 'RESIZE_SOLVER_DIVERGENCE';

export interface OMSFailure {
  readonly code: OMSFailureCode;
  readonly level: OMSEscalationLevel;
  readonly message: string;
  readonly timestamp: number;
  readonly generation: number;
  readonly context?: Record<string, unknown>;
}

export interface IOMSSpatialState {
  readonly generation: number;
  readonly timestamp: number;
  readonly theaterWidth: number;
  readonly theaterHeight: number;
  readonly screenBounds: OMSNormalizedRect;
  readonly apertureBounds: OMSNormalizedRect;
  readonly visibleProjection: OMSNormalizedRect;
  readonly seatRegion: OMSNormalizedRect;
  readonly targetAspect: number;
  readonly requestedPreset: OMSAspectPreset;
  readonly seatsVisible: boolean;
  readonly isFullscreen: boolean;
  readonly isValid: boolean;
  readonly escalationLevel: OMSEscalationLevel;
  readonly panX: number;
  readonly panY: number;
  readonly zoom: number;
}

export interface IOMSGenerationResult<T> {
  readonly generation: number;
  readonly timestamp: number;
  readonly payload: T;
  readonly isStale: boolean;
}
