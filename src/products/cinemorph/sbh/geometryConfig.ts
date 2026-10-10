/**
 * geometryConfig.ts - OMS-SBH Named Geometry Configuration & Unit Contracts
 * Strictly defines explicit constants, tolerances, and physical units (Points 136–140)
 */

export const OMS_GEOMETRY_CONFIG = {
  /** Aspect ratio calculation deviation tolerance (Unit: unitless ratio) */
  TOLERANCE_ASPECT_RATIO: 0.001,

  /** Distortion invariant tolerance: abs(scaleX / scaleY - 1) <= 0.0001 (Unit: unitless ratio) */
  TOLERANCE_SCALE_DISTORTION: 0.0001,

  /** Maximum allowed center shift between normal aspect transitions (Unit: normalized delta) */
  TOLERANCE_CENTER_SHIFT: 0.005,

  /** Maximum single-frame coordinate step during transitions (Unit: normalized delta) */
  MAX_ALLOWED_STEP_POSITION: 0.08,
  MAX_ALLOWED_STEP_SCALE: 0.08,

  /** Crop severity loss thresholds (Unit: fraction of source area [0, 1]) */
  CROP_LOSS_SAFE_MAX: 0.05,
  CROP_LOSS_ACCEPTABLE_MAX: 0.15,
  CROP_LOSS_WARNING_MAX: 0.25,

  /** Focal point confidence levels (Unit: [0, 1]) */
  CONFIDENCE_HIGH: 0.80,
  CONFIDENCE_MEDIUM: 0.50,

  /** Intelligent composition safe region margins (Unit: normalized coordinates) */
  SAFE_ZONE_MIN_X: 0.10,
  SAFE_ZONE_MAX_X: 0.90,
  SAFE_ZONE_MIN_Y: 0.10,
  SAFE_ZONE_MAX_Y: 0.90,

  /** Temporal smoothing spring-damper parameters */
  SPRING_DAMPING_RATIO: 1.0, // Critically damped (zeta = 1.0)
  SPRING_ANGULAR_FREQUENCY: 12.0, // rad/s
  TEMPORAL_DEADBAND: 0.025, // Hysteresis threshold to ignore minor camera jitter
  SPRING_SETTLING_THRESHOLD: 0.001, // Settling threshold to stop unnecessary micro-steps
  FRAME_RATE_INDEPENDENT_DECAY: 12.0, // rad/s decay factor for frame-rate independent lerp

  /** Transition timing contracts */
  DEFAULT_TRANSITION_DURATION_MS: 600,
  MAX_ALLOWED_TRANSITION_DURATION_MS: 3000,

  /** Curvature boundaries for screen aperture geometry */
  CURVATURE_X_MAX: 0.20,
  CURVATURE_Y_MAX: 0.20,

  /** Standard CineMorph aspect ratios */
  ASPECT_IMAX_TALL: 1.43,
  ASPECT_CINEMA_WIDE: 1.90,
  ASPECT_DEFAULT_LANDSCAPE: 16 / 9,

  /** Seating sightline clearance clearance buffer (Unit: normalized Y) */
  SEAT_SIGHTLINE_CLEARANCE_BUFFER: 0.015,

  /** Minimum sane viewport dimension in pixels */
  MIN_VIEWPORT_DIMENSION: 100,
} as const;
