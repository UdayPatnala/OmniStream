/**
 * geometryTypes.ts - OMS-SBH Geometry Contract Specification
 * Mandatory Mathematical, Spatial, Rendering and Validation Types (Points 70–118)
 */

import { IOMSSpatialState, OMSAspectPreset as SharedAspectPreset, OMSEscalationLevel as SharedEscalationLevel } from '../../../shared/contracts/geometryContracts';

/** Normalized Point in [0, 1] range */
export interface OMSPoint {
  x: number;
  y: number;
}

/** Normalized Rectangle in [0, 1] range */
export interface OMSRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Source media geometry extracted from actual video stream / element */
export interface OMSSourceGeometry {
  widthPx: number;
  heightPx: number;
  aspectRatio: number;
  orientation: 'landscape' | 'portrait' | 'square';
}

/** Authoritative CineMorph presentation modes */
export type OMSPresentationMode = 'original' | '1.90' | '1.43';

/** Canonical aspect presets matching shared contract */
export type OMSAspectPreset = 'Original' | '1.90:1' | '1.43:1';

/** Helper to convert domain aspect strings to OMSPresentationMode */
export function toOMSPresentationMode(aspect: string): OMSPresentationMode {
  if (aspect === '1.43:1' || aspect === '1.43') return '1.43';
  if (aspect === '1.90:1' || aspect === '1.90') return '1.90';
  return 'original';
}

/** Helper to convert OMSPresentationMode to canonical OMSAspectPreset */
export function toOMSAspectPreset(mode: OMSPresentationMode): OMSAspectPreset {
  if (mode === '1.43') return '1.43:1';
  if (mode === '1.90') return '1.90:1';
  return 'Original';
}

/** Top-level usable theater auditorium environment */
export interface OMSTheaterRegion {
  bounds: OMSRect;
}

/** Screen boundary quad topology */
export interface OMSScreenBoundary {
  topLeft: OMSPoint;
  topRight: OMSPoint;
  bottomRight: OMSPoint;
  bottomLeft: OMSPoint;
}

/** Physical cinema screen structure */
export interface OMSScreenGeometry {
  bounds: OMSRect;
  center: OMSPoint;
  curvatureX: number;
  curvatureY: number;
  perspective: {
    topWidth: number;
    bottomWidth: number;
  };
}

/** Physical proscenium aperture opening (the "Hole" in OMS-SBH) */
export interface OMSApertureGeometry {
  bounds: OMSRect;
  center: OMSPoint;
  clipCurve: string;
}

/** Source-normalized crop rectangle [0, 1] */
export interface OMSCropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Projected image geometry residing on the projection plane behind the aperture */
export interface OMSProjectionGeometry {
  bounds: OMSRect;
  aspectRatio: number;
  scale: number;
  crop: OMSCropRect;
  offset: OMSPoint;
}

/** Seat row within the auditorium */
export interface OMSSeatRow {
  rowNumber: number;
  y: number;
  depth: number;
  seatCount: number;
}

/** Foreground auditorium seating region */
export interface OMSSeatRegion {
  bounds: OMSRect;
  rows: OMSSeatRow[];
  visible: boolean;
}

/** Intelligent focal point within source coordinates */
export interface OMSFocalPoint {
  x: number;
  y: number;
  confidence: number;
}

/** Captions safe region within visible projection */
export type OMSCaptionSafeRegion = OMSRect;

/** Screen depth model */
export interface OMSScreenDepth {
  z: number;
  curvature: number;
}

/** Complete immutable atomic projection state (Point 115) */
export interface OMSProjectionState {
  source: OMSSourceGeometry;
  presentation: {
    mode: OMSPresentationMode;
    targetAspect: number;
  };
  theater: OMSTheaterRegion;
  screen: OMSScreenGeometry;
  aperture: OMSApertureGeometry;
  projection: OMSProjectionGeometry;
  crop: OMSCropRect;
  focalPoint?: OMSFocalPoint;
  seats: OMSSeatRegion;
  generation: number;
  timestamp: number;
}

/** Geometry transition between two projection states (Point 98) */
export interface OMSGeometryTransition {
  from: OMSProjectionState;
  to: OMSProjectionState;
  progress: number;
  durationMs: number;
  generation: number;
  startTime?: number;
}

/** Temporal state for motion smoothing (Point 109) */
export interface OMSTemporalState {
  previousComposition: OMSCropRect;
  targetComposition: OMSCropRect;
  velocity: OMSPoint;
  confidence: number;
}

/** Performance Telemetry metrics */
export interface OMSSBHMetrics {
  solveDurationMs: number;
  validationDurationMs: number;
  motionDurationMs: number;
  renderDurationMs: number;
  totalDurationMs: number;
  staleDiscardsCount: number;
  lastSolveTimestamp: number;
}

/** Standard Geometry Error Codes (Point 118 & Invariants I1–I12) */
export const OMSGeometryErrorCode = {
  INVALID_POINT: 'OMS-GEO-001',
  INVALID_RECT: 'OMS-GEO-002',
  INVALID_ASPECT: 'OMS-GEO-003',
  DISTORTION_DETECTED: 'OMS-GEO-004',
  APERTURE_OUTSIDE_SCREEN: 'OMS-GEO-005',
  SCREEN_OUTSIDE_THEATER: 'OMS-GEO-006',
  PROJECTION_OUTSIDE_APERTURE: 'OMS-GEO-007',
  SEAT_PROJECTION_OVERLAP: 'OMS-GEO-008',
  STALE_GENERATION: 'OMS-GEO-009',
  INVALID_CROP: 'OMS-GEO-010',
  INVALID_FOCAL_POINT: 'OMS-GEO-011',
  TRANSITION_JUMP: 'OMS-GEO-012',
  NONFINITE_GEOMETRY: 'OMS-GEO-013',
  CURVATURE_BOUNDS_EXCEEDED: 'OMS-GEO-014',
  TRANSITION_INVALID_TARGET: 'OMS-GEO-015',
  VIEWPORT_INVALID: 'OMS-GEO-016',
} as const;

export type OMSGeometryErrorCode = typeof OMSGeometryErrorCode[keyof typeof OMSGeometryErrorCode];

/** Validation error/warning detail */
export interface OMSGeometryError {
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

/** Validation result contract (Point 117) */
export interface OMSGeometryValidationResult {
  valid: boolean;
  errors: OMSGeometryError[];
}

/** Point validation guard (Point 72) */
export function isValidOMSPoint(point: any): point is OMSPoint {
  if (!point || typeof point !== 'object') return false;
  const { x, y } = point;
  return (
    typeof x === 'number' &&
    typeof y === 'number' &&
    Number.isFinite(x) &&
    Number.isFinite(y) &&
    x >= 0 &&
    x <= 1 &&
    y >= 0 &&
    y <= 1
  );
}

/** Rect validation guard (Point 73) */
export function isValidOMSRect(rect: any, allowOffscreen: boolean = false): rect is OMSRect {
  if (!rect || typeof rect !== 'object') return false;
  const { x, y, width, height } = rect;
  if (
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    typeof width !== 'number' ||
    typeof height !== 'number' ||
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height)
  ) {
    return false;
  }

  if (width <= 0 || height <= 0) return false;

  if (!allowOffscreen) {
    if (x < 0 || x > 1 || y < 0 || y > 1) return false;
    if (width > 1 || height > 1) return false;
    if (x + width > 1.0001 || y + height > 1.0001) return false;
  }

  return true;
}

/** Maps an OMSProjectionState to the shared canonical IOMSSpatialState */
export function mapProjectionStateToSharedState(
  state: OMSProjectionState,
  isFullscreen: boolean = false,
  escalationLevel: SharedEscalationLevel = 'LEVEL_0'
): IOMSSpatialState {
  return {
    generation: state.generation,
    timestamp: state.timestamp,
    theaterWidth: state.source.widthPx,
    theaterHeight: state.source.heightPx,
    screenBounds: state.screen.bounds,
    apertureBounds: state.aperture.bounds,
    visibleProjection: state.projection.bounds,
    seatRegion: state.seats.bounds,
    targetAspect: state.presentation.targetAspect,
    requestedPreset: toOMSAspectPreset(state.presentation.mode),
    seatsVisible: state.seats.visible,
    isFullscreen,
    isValid: true,
    escalationLevel,
    panX: state.projection.offset.x,
    panY: state.projection.offset.y,
    zoom: state.projection.scale,
  };
}
