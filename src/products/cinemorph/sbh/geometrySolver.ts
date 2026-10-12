/**
 * geometrySolver.ts - OMS-SBH Pure Mathematical Geometry Solver
 * Pure O(1) solver decoupled from DOM and React (Points 74–97, 119–122, 134–135)
 */

import {
  OMSPoint,
  OMSRect,
  OMSSourceGeometry,
  OMSPresentationMode,
  OMSTheaterRegion,
  OMSScreenGeometry,
  OMSApertureGeometry,
  OMSCropRect,
  OMSProjectionGeometry,
  OMSSeatRegion,
  OMSFocalPoint,
  OMSProjectionState,
} from './geometryTypes';
import { OMS_GEOMETRY_CONFIG } from './geometryConfig';
import { validateOMSGeometry } from './geometryValidator';

export interface OMSGeometryInput {
  widthPx: number;
  heightPx: number;
  mode: OMSPresentationMode;
  seatsVisible: boolean;
  isFullscreen?: boolean;
  focalPoint?: OMSFocalPoint;
  viewportWidthPx?: number;
  viewportHeightPx?: number;
  generation?: number;
  timestamp?: number;
}

/**
 * Resolves source geometry and orientation mathematically (Points 74, 75)
 */
export function resolveSourceGeometry(widthPx: number, heightPx: number): OMSSourceGeometry {
  const safeW = Math.max(1, Number.isFinite(widthPx) ? widthPx : 1920);
  const safeH = Math.max(1, Number.isFinite(heightPx) ? heightPx : 1080);
  const aspectRatio = Number((safeW / safeH).toFixed(6));

  const orientation =
    safeW > safeH ? 'landscape' : safeW < safeH ? 'portrait' : 'square';

  return {
    widthPx: safeW,
    heightPx: safeH,
    aspectRatio,
    orientation,
  };
}

/**
 * Resolves target presentation aspect ratio (Point 77)
 */
export function resolveTargetAspect(
  mode: OMSPresentationMode,
  sourceAspect: number
): number {
  switch (mode) {
    case 'original':
      return sourceAspect > 0 ? sourceAspect : OMS_GEOMETRY_CONFIG.ASPECT_DEFAULT_LANDSCAPE;
    case '1.90':
      return OMS_GEOMETRY_CONFIG.ASPECT_CINEMA_WIDE;
    case '1.43':
      return OMS_GEOMETRY_CONFIG.ASPECT_IMAX_TALL;
    default:
      return sourceAspect;
  }
}

/**
 * Resolves outer theater region (Point 78)
 */
export function resolveTheaterRegion(): OMSTheaterRegion {
  return {
    bounds: {
      x: 0,
      y: 0,
      width: 1.0,
      height: 1.0,
    },
  };
}

/**
 * Resolves auditorium seating region (Points 94-96)
 */
export function resolveSeatRegion(
  theater: OMSTheaterRegion,
  seatsVisible: boolean
): OMSSeatRegion {
  if (!seatsVisible) {
    return {
      bounds: {
        x: 0,
        y: 1.0,
        width: 1.0,
        height: 0,
      },
      rows: [],
      visible: false,
    };
  }

  // Seating occupies the lower 12% of the normalized auditorium
  const seatHeight = 0.12;
  const seatY = 1.0 - seatHeight;

  return {
    bounds: {
      x: 0,
      y: seatY,
      width: 1.0,
      height: seatHeight,
    },
    rows: [
      { rowNumber: 1, y: seatY + 0.02, depth: 0.04, seatCount: 14 },
      { rowNumber: 2, y: seatY + 0.07, depth: 0.04, seatCount: 16 },
    ],
    visible: true,
  };
}

/**
 * Resolves proscenium screen and aperture hole geometry (Points 79–83)
 */
export function resolveScreenAndAperture(
  theater: OMSTheaterRegion,
  seatRegion: OMSSeatRegion,
  targetAspect: number,
  mode: OMSPresentationMode,
  isFullscreen: boolean = false,
  viewportAspect: number = 16 / 9
): { screen: OMSScreenGeometry; aperture: OMSApertureGeometry } {
  // Available vertical headroom above seats
  const maxAvailableY = seatRegion.visible
    ? seatRegion.bounds.y - OMS_GEOMETRY_CONFIG.SEAT_SIGHTLINE_CLEARANCE_BUFFER
    : 0.98;

  const topMargin = isFullscreen ? 0.015 : 0.03;
  const maxAllowedHeight = Math.max(0.1, maxAvailableY - topMargin);

  // Compute normalized dimensions satisfying target aspect ratio in normalized viewport space
  const effectiveViewportAspect = Number.isFinite(viewportAspect) && viewportAspect > 0
    ? viewportAspect
    : (16 / 9);
  
  let normHeight = maxAllowedHeight;
  let normWidth = normHeight * (targetAspect / effectiveViewportAspect);

  // If width exceeds theater horizontal bounds (allowing margin), constrict
  const maxAllowedWidth = 0.96;
  if (normWidth > maxAllowedWidth) {
    normWidth = maxAllowedWidth;
    normHeight = normWidth / (targetAspect / effectiveViewportAspect);
  }

  const screenX = Number(((1.0 - normWidth) / 2).toFixed(6));
  // Position screen centered in available vertical space above seats
  const screenY = Number((topMargin + (maxAllowedHeight - normHeight) / 2).toFixed(6));

  const screenBounds: OMSRect = {
    x: Math.max(0, screenX),
    y: Math.max(0, screenY),
    width: Number(normWidth.toFixed(6)),
    height: Number(normHeight.toFixed(6)),
  };

  const center: OMSPoint = {
    x: Number((screenBounds.x + screenBounds.width / 2).toFixed(6)),
    y: Number((screenBounds.y + screenBounds.height / 2).toFixed(6)),
  };

  const screen: OMSScreenGeometry = {
    bounds: screenBounds,
    center,
    curvatureX: mode === 'original' ? 0 : mode === '1.43' ? 0.035 : 0.022,
    curvatureY: mode === 'original' ? 0 : mode === '1.43' ? 0.025 : 0.015,
    perspective: {
      topWidth: screenBounds.width * (mode === '1.43' ? 0.985 : 0.99),
      bottomWidth: screenBounds.width,
    },
  };

  // Aperture hole sits flush at proscenium screen boundary without clipping borders
  const apertureClipCurve =
    mode === 'original'
      ? 'none'
      : 'polygon(0% 0%, 50% 0%, 100% 0%, 100% 100%, 50% 100%, 0% 100%)';

  const aperture: OMSApertureGeometry = {
    bounds: { ...screenBounds },
    center: { ...center },
    clipCurve: apertureClipCurve,
  };

  return { screen, aperture };
}

/**
 * Pure projection composition solver (Points 84–93)
 */
export function solveProjection(
  source: OMSSourceGeometry,
  aperture: OMSApertureGeometry,
  mode: OMSPresentationMode,
  focalPoint?: OMSFocalPoint
): { projection: OMSProjectionGeometry; crop: OMSCropRect } {
  // Point 91: Original Mode Contract - 100% source protected, zero crop, scale = 1.0
  if (mode === 'original') {
    const fullCrop: OMSCropRect = { x: 0, y: 0, width: 1.0, height: 1.0 };
    const projection: OMSProjectionGeometry = {
      bounds: { ...aperture.bounds },
      aspectRatio: source.aspectRatio,
      scale: 1.0,
      crop: fullCrop,
      offset: { x: 0, y: 0 },
    };
    return { projection, crop: fullCrop };
  }

  const targetAspect = resolveTargetAspect(mode, source.aspectRatio);
  const aspectDiff = targetAspect / source.aspectRatio;

  let cropW = 1.0;
  let cropH = 1.0;
  let cropX = 0;
  let cropY = 0;
  let scale = 1.0;

  // Source aspect preserved: scaleX = scaleY (Point 87)
  if (Math.abs(aspectDiff - 1.0) < OMS_GEOMETRY_CONFIG.TOLERANCE_ASPECT_RATIO) {
    // Exact match
    scale = 1.0;
  } else if (targetAspect > source.aspectRatio) {
    // Target is wider than source: top/bottom framing
    cropH = Math.max(0.75, source.aspectRatio / targetAspect);
    cropW = 1.0;
    scale = Number((targetAspect / source.aspectRatio).toFixed(4));

    // Focal point vertical alignment if high confidence
    if (focalPoint && focalPoint.confidence >= OMS_GEOMETRY_CONFIG.CONFIDENCE_MEDIUM) {
      const targetCenterY = Math.min(
        OMS_GEOMETRY_CONFIG.SAFE_ZONE_MAX_Y,
        Math.max(OMS_GEOMETRY_CONFIG.SAFE_ZONE_MIN_Y, focalPoint.y)
      );
      cropY = Math.max(0, Math.min(1.0 - cropH, targetCenterY - cropH / 2));
    } else {
      cropY = (1.0 - cropH) / 2;
    }
  } else {
    // Target is taller than source (e.g. 1.43 IMAX from 16:9)
    cropW = Math.max(0.75, targetAspect / source.aspectRatio);
    cropH = 1.0;
    scale = Number((source.aspectRatio / targetAspect).toFixed(4));

    // Focal point horizontal alignment if high confidence
    if (focalPoint && focalPoint.confidence >= OMS_GEOMETRY_CONFIG.CONFIDENCE_MEDIUM) {
      const targetCenterX = Math.min(
        OMS_GEOMETRY_CONFIG.SAFE_ZONE_MAX_X,
        Math.max(OMS_GEOMETRY_CONFIG.SAFE_ZONE_MIN_X, focalPoint.x)
      );
      cropX = Math.max(0, Math.min(1.0 - cropW, targetCenterX - cropW / 2));
    } else {
      cropX = (1.0 - cropW) / 2;
    }
  }

  // Point 90: Crop Loss Verification
  const visibleSourceArea = cropW * cropH;
  const cropLoss = 1.0 - visibleSourceArea;

  // If crop exceeds warning threshold, clamp to source-safe maximum
  if (cropLoss > OMS_GEOMETRY_CONFIG.CROP_LOSS_WARNING_MAX) {
    cropW = 0.88;
    cropH = 0.88;
    cropX = (1.0 - cropW) / 2;
    cropY = (1.0 - cropH) / 2;
    scale = 1.08;
  }

  const crop: OMSCropRect = {
    x: Number(cropX.toFixed(6)),
    y: Number(cropY.toFixed(6)),
    width: Number(cropW.toFixed(6)),
    height: Number(cropH.toFixed(6)),
  };

  const projection: OMSProjectionGeometry = {
    bounds: { ...aperture.bounds },
    aspectRatio: targetAspect,
    scale,
    crop,
    offset: { x: Number((cropX * 2 - 1).toFixed(4)), y: Number((cropY * 2 - 1).toFixed(4)) },
  };

  return { projection, crop };
}

/**
 * Creates deterministic fallback state on failure (Point 119, 120)
 */
export function createDeterministicFallbackState(
  sourceAspect: number = 16 / 9,
  generation: number = 0
): OMSProjectionState {
  const theater = resolveTheaterRegion();
  const seats = resolveSeatRegion(theater, true);
  const { screen, aperture } = resolveScreenAndAperture(theater, seats, sourceAspect, 'original', false);
  const source = resolveSourceGeometry(1920, Math.round(1920 / sourceAspect));

  const fullCrop: OMSCropRect = { x: 0, y: 0, width: 1.0, height: 1.0 };
  const projection: OMSProjectionGeometry = {
    bounds: { ...aperture.bounds },
    aspectRatio: sourceAspect,
    scale: 1.0,
    crop: fullCrop,
    offset: { x: 0, y: 0 },
  };

  return {
    source,
    presentation: {
      mode: 'original',
      targetAspect: sourceAspect,
    },
    theater,
    screen,
    aperture,
    projection,
    crop: fullCrop,
    seats,
    generation,
    timestamp: Date.now(),
  };
}

/**
 * Master pure geometry solver: solveOMSGeometry(input) -> OMSProjectionState
 * Guaranteed deterministic, idempotent, and O(1) (Points 134, 135)
 */
export function solveOMSGeometry(input: OMSGeometryInput): OMSProjectionState {
  try {
    const generation = input.generation ?? 0;
    const timestamp = input.timestamp ?? Date.now();

    const source = resolveSourceGeometry(input.widthPx, input.heightPx);
    const targetAspect = resolveTargetAspect(input.mode, source.aspectRatio);

    const theater = resolveTheaterRegion();
    const seats = resolveSeatRegion(theater, input.seatsVisible);

    const viewportAspect =
      input.viewportWidthPx && input.viewportHeightPx && input.viewportWidthPx > 0 && input.viewportHeightPx > 0
        ? input.viewportWidthPx / input.viewportHeightPx
        : 16 / 9;

    const { screen, aperture } = resolveScreenAndAperture(
      theater,
      seats,
      targetAspect,
      input.mode,
      Boolean(input.isFullscreen),
      viewportAspect
    );

    const { projection, crop } = solveProjection(source, aperture, input.mode, input.focalPoint);

    const candidateState: OMSProjectionState = {
      source,
      presentation: {
        mode: input.mode,
        targetAspect,
      },
      theater,
      screen,
      aperture,
      projection,
      crop,
      focalPoint: input.focalPoint,
      seats,
      generation,
      timestamp,
    };

    // Pre-flight validate state
    const validation = validateOMSGeometry(candidateState);
    if (!validation.valid) {
      console.warn('[OMS-SBH Solver] Candidate geometry validation failed, falling back:', validation.errors);
      return createDeterministicFallbackState(source.aspectRatio, generation);
    }

    return candidateState;
  } catch (err) {
    console.error('[OMS-SBH Solver] Unexpected solver error, executing safe fallback:', err);
    return createDeterministicFallbackState(16 / 9, input.generation ?? 0);
  }
}
