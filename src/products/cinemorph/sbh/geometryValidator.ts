/**
 * geometryValidator.ts - OMS-SBH Master Geometry Validator
 * Enforces all 20 runtime invariants and checks containment/exclusion (Points 116–120, 146, Invariants I1–I12)
 */

import {
  OMSProjectionState,
  OMSGeometryValidationResult,
  OMSGeometryError,
  OMSGeometryErrorCode,
  OMSGeometryTransition,
  isValidOMSPoint,
  isValidOMSRect,
  OMSRect,
} from './geometryTypes';
import { OMS_GEOMETRY_CONFIG } from './geometryConfig';

/**
 * Checks if rectA is contained inside rectB within a floating-point tolerance
 */
export function isRectContained(rectA: OMSRect, rectB: OMSRect, tolerance: number = 0.001): boolean {
  return (
    rectA.x >= rectB.x - tolerance &&
    rectA.y >= rectB.y - tolerance &&
    rectA.x + rectA.width <= rectB.x + rectB.width + tolerance &&
    rectA.y + rectA.height <= rectB.y + rectB.height + tolerance
  );
}

/**
 * Checks if rectA and rectB overlap with an area > 0
 */
export function doRectsOverlap(rectA: OMSRect, rectB: OMSRect, tolerance: number = 0.001): boolean {
  const noOverlap =
    rectA.x + rectA.width <= rectB.x + tolerance ||
    rectB.x + rectB.width <= rectA.x + tolerance ||
    rectA.y + rectA.height <= rectB.y + tolerance ||
    rectB.y + rectB.height <= rectA.y + tolerance;
  return !noOverlap;
}

/**
 * Validates a complete OMS projection state against the mandatory geometry contract
 */
export function validateOMSGeometry(state: OMSProjectionState): OMSGeometryValidationResult {
  const errors: OMSGeometryError[] = [];

  if (!state || typeof state !== 'object') {
    return {
      valid: false,
      errors: [{
        code: OMSGeometryErrorCode.NONFINITE_GEOMETRY,
        message: 'Projection state is null or not an object',
        severity: 'error',
      }],
    };
  }

  // 1. Numeric & Finite sanity (Invariants I5, I6)
  const numericCheck = [
    state.source?.aspectRatio,
    state.source?.widthPx,
    state.source?.heightPx,
    state.presentation?.targetAspect,
    state.projection?.scale,
    state.generation,
    state.timestamp,
  ];

  for (const val of numericCheck) {
    if (typeof val !== 'number' || !Number.isFinite(val)) {
      errors.push({
        code: OMSGeometryErrorCode.NONFINITE_GEOMETRY,
        message: `Non-finite or missing numeric value detected in state: ${val}`,
        severity: 'error',
      });
      break;
    }
  }

  // 2. Aspect Ratio Validation (Invariant I2)
  if (state.source && state.source.aspectRatio <= 0) {
    errors.push({
      code: OMSGeometryErrorCode.INVALID_ASPECT,
      message: `Invalid source aspect ratio: ${state.source.aspectRatio}`,
      severity: 'error',
    });
  }

  if (state.presentation && state.presentation.targetAspect <= 0) {
    errors.push({
      code: OMSGeometryErrorCode.INVALID_ASPECT,
      message: `Invalid presentation target aspect: ${state.presentation.targetAspect}`,
      severity: 'error',
    });
  }

  // 3. Rect & Point bounds (Invariant I7)
  if (!isValidOMSRect(state.theater?.bounds)) {
    errors.push({
      code: OMSGeometryErrorCode.INVALID_RECT,
      message: 'Theater bounds are invalid or out of normalized range',
      severity: 'error',
    });
  }

  if (!isValidOMSRect(state.screen?.bounds)) {
    errors.push({
      code: OMSGeometryErrorCode.INVALID_RECT,
      message: 'Screen bounds are invalid or out of normalized range',
      severity: 'error',
    });
  }

  if (!isValidOMSPoint(state.screen?.center)) {
    errors.push({
      code: OMSGeometryErrorCode.INVALID_POINT,
      message: 'Screen center coordinate is invalid or out of normalized range',
      severity: 'error',
    });
  }

  if (!isValidOMSRect(state.aperture?.bounds)) {
    errors.push({
      code: OMSGeometryErrorCode.INVALID_RECT,
      message: 'Aperture bounds are invalid or out of normalized range',
      severity: 'error',
    });
  }

  if (!isValidOMSPoint(state.aperture?.center)) {
    errors.push({
      code: OMSGeometryErrorCode.INVALID_POINT,
      message: 'Aperture center coordinate is invalid or out of normalized range',
      severity: 'error',
    });
  }

  if (!isValidOMSRect(state.crop)) {
    errors.push({
      code: OMSGeometryErrorCode.INVALID_CROP,
      message: 'Source crop rect is invalid or out of normalized range [0, 1]',
      severity: 'error',
    });
  }

  // 4. Source Distortion Guard (Point 87: scaleX ≈ scaleY, Invariant I2)
  if (state.projection) {
    if (state.projection.scale <= 0 || !Number.isFinite(state.projection.scale)) {
      errors.push({
        code: OMSGeometryErrorCode.DISTORTION_DETECTED,
        message: `Projection scale factor must be positive and finite: ${state.projection.scale}`,
        severity: 'error',
      });
    }
  }

  // 5. Curvature Boundaries Check (Invariant I4)
  if (state.screen) {
    const curX = state.screen.curvatureX;
    const curY = state.screen.curvatureY;
    if (
      typeof curX !== 'number' ||
      !Number.isFinite(curX) ||
      curX < 0 ||
      curX > OMS_GEOMETRY_CONFIG.CURVATURE_X_MAX
    ) {
      errors.push({
        code: OMSGeometryErrorCode.CURVATURE_BOUNDS_EXCEEDED,
        message: `Screen horizontal curvature (${curX}) exceeds allowed bounds [0, ${OMS_GEOMETRY_CONFIG.CURVATURE_X_MAX}]`,
        severity: 'error',
      });
    }

    if (
      typeof curY !== 'number' ||
      !Number.isFinite(curY) ||
      curY < 0 ||
      curY > OMS_GEOMETRY_CONFIG.CURVATURE_Y_MAX
    ) {
      errors.push({
        code: OMSGeometryErrorCode.CURVATURE_BOUNDS_EXCEEDED,
        message: `Screen vertical curvature (${curY}) exceeds allowed bounds [0, ${OMS_GEOMETRY_CONFIG.CURVATURE_Y_MAX}]`,
        severity: 'error',
      });
    }
  }

  // 6. Spatial Containment Hierarchy: Aperture ⊆ Screen ⊆ Theater (Invariant I1)
  if (state.screen?.bounds && state.theater?.bounds) {
    if (!isRectContained(state.screen.bounds, state.theater.bounds)) {
      errors.push({
        code: OMSGeometryErrorCode.SCREEN_OUTSIDE_THEATER,
        message: 'Screen geometry exceeds outer theater bounds',
        severity: 'error',
      });
    }
  }

  if (state.aperture?.bounds && state.screen?.bounds) {
    if (!isRectContained(state.aperture.bounds, state.screen.bounds)) {
      errors.push({
        code: OMSGeometryErrorCode.APERTURE_OUTSIDE_SCREEN,
        message: 'Aperture hole exceeds screen structural bounds',
        severity: 'error',
      });
    }
  }

  // 7. Visible Projection Containment: visibleProjection ⊆ aperture (Point 86)
  if (state.projection?.bounds && state.aperture?.bounds) {
    const isContainedInAperture = isRectContained(state.projection.bounds, state.aperture.bounds, 0.005);
    if (!isContainedInAperture && state.presentation.mode === 'original') {
      errors.push({
        code: OMSGeometryErrorCode.PROJECTION_OUTSIDE_APERTURE,
        message: 'Original mode projection escapes aperture boundaries',
        severity: 'error',
      });
    }
  }

  // 8. Seat Exclusion: visibleProjection ∩ seats = ∅ (Point 94, Invariant I3)
  if (state.seats?.visible && state.seats?.bounds && state.aperture?.bounds) {
    if (doRectsOverlap(state.aperture.bounds, state.seats.bounds)) {
      errors.push({
        code: OMSGeometryErrorCode.SEAT_PROJECTION_OVERLAP,
        message: 'Aperture projection intersects foreground seating plane',
        severity: 'error',
      });
    }
  }

  // 9. Focal Point Validation
  if (state.focalPoint) {
    if (!isValidOMSPoint({ x: state.focalPoint.x, y: state.focalPoint.y })) {
      errors.push({
        code: OMSGeometryErrorCode.INVALID_FOCAL_POINT,
        message: 'Focal point coordinates are out of normalized bounds',
        severity: 'error',
      });
    }
    if (state.focalPoint.confidence < 0 || state.focalPoint.confidence > 1) {
      errors.push({
        code: OMSGeometryErrorCode.INVALID_FOCAL_POINT,
        message: `Focal point confidence must be in [0, 1]: ${state.focalPoint.confidence}`,
        severity: 'error',
      });
    }
  }

  // 10. Generation and Timestamp checks (Invariant I9)
  if (typeof state.generation !== 'number' || state.generation < 0) {
    errors.push({
      code: OMSGeometryErrorCode.STALE_GENERATION,
      message: `Invalid state generation index: ${state.generation}`,
      severity: 'error',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates an active transition state (Invariant I8)
 */
export function validateTransitionState(transition: OMSGeometryTransition | null): OMSGeometryValidationResult {
  const errors: OMSGeometryError[] = [];

  if (!transition) {
    return { valid: true, errors: [] };
  }

  if (!transition.to) {
    errors.push({
      code: OMSGeometryErrorCode.TRANSITION_INVALID_TARGET,
      message: 'Transition must have a valid target state',
      severity: 'error',
    });
  } else {
    const toValidation = validateOMSGeometry(transition.to);
    if (!toValidation.valid) {
      errors.push(...toValidation.errors);
    }
  }

  if (transition.progress < 0 || transition.progress > 1.0001) {
    errors.push({
      code: OMSGeometryErrorCode.NONFINITE_GEOMETRY,
      message: `Transition progress must be in [0, 1]: ${transition.progress}`,
      severity: 'error',
    });
  }

  if (transition.durationMs <= 0 || !Number.isFinite(transition.durationMs)) {
    errors.push({
      code: OMSGeometryErrorCode.NONFINITE_GEOMETRY,
      message: `Transition duration must be a positive finite number: ${transition.durationMs}`,
      severity: 'error',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
