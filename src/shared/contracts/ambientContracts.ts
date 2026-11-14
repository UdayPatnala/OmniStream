/**
 * OmniStream Ambient Light Shared Contracts
 * Defines runtime-independent contracts for CineMorph peripheral proscenium lighting.
 * Conforms to OPCA Rule 4 (zero cross-layer imports from shared to product capsules).
 */

export interface AmbientRgb {
  r: number;
  g: number;
  b: number;
}

export interface AmbientEdgeColors {
  top: string;
  bottom: string;
  left: string;
  right: string;
  dominant: string;
}

export interface AmbientAnalysis {
  top: AmbientRgb;
  bottom: AmbientRgb;
  left: AmbientRgb;
  right: AmbientRgb;
  dominant: AmbientRgb;
  luma: number;
  isCut: boolean;
  timestamp: number;
}

export type AmbientGlowMode = 'off' | 'subtle' | 'cinema' | 'vivid' | 'low' | 'medium' | 'ultra';

export interface AmbientConfig {
  enabled: boolean;
  intensity: AmbientGlowMode;
  smoothingFactor: number;
  sampleIntervalMs: number;
}

export const DEFAULT_AMBIENT_CONFIG: AmbientConfig = {
  enabled: true,
  intensity: 'cinema',
  smoothingFactor: 0.15,
  sampleIntervalMs: 50, // 20Hz throttled sampling
};

export function formatRgbString(rgb: AmbientRgb): string {
  const r = Math.min(255, Math.max(0, Math.round(rgb.r)));
  const g = Math.min(255, Math.max(0, Math.round(rgb.g)));
  const b = Math.min(255, Math.max(0, Math.round(rgb.b)));
  return `rgb(${r}, ${g}, ${b})`;
}

export function rgbToLuma(rgb: AmbientRgb): number {
  return Number((0.299 * (rgb.r / 255) + 0.587 * (rgb.g / 255) + 0.114 * (rgb.b / 255)).toFixed(3));
}

export function clampRgb(rgb: AmbientRgb): AmbientRgb {
  return {
    r: Math.min(255, Math.max(0, Math.round(Number.isFinite(rgb.r) ? rgb.r : 0))),
    g: Math.min(255, Math.max(0, Math.round(Number.isFinite(rgb.g) ? rgb.g : 0))),
    b: Math.min(255, Math.max(0, Math.round(Number.isFinite(rgb.b) ? rgb.b : 0))),
  };
}

/**
 * CineMorph SCREEN X Shared Contracts
 * Dual-wing peripheral panoramic ambient lighting extending horizontally to screen boundaries.
 */
export interface ScreenXConfig {
  enabled: boolean;
  intensity: number; // 0.0 - 1.0 (default 0.75)
  blurStrength: number; // 10 - 100px (default 50)
  lightingSpread: number; // 1.0 - 2.5 (default 1.5)
  colorSaturation: number; // 0.8 - 2.0 (default 1.2)
  smoothness: number; // 0.05 - 0.4 (default 0.15)
  responsiveness: number; // 0.5 - 1.0 (default 0.85)
  flickerReduction: boolean; // default true
  debanding: boolean; // default true
  frameBlending: number; // 0.0 - 1.0 (default 0.25)
  quality: 'performance' | 'balanced' | 'high' | 'ultra'; // default balanced
  leftEnabled: boolean; // default true
  rightEnabled: boolean; // default true
}

export const DEFAULT_SCREENX_CONFIG: ScreenXConfig = {
  enabled: true,
  intensity: 0.75,
  blurStrength: 50,
  lightingSpread: 1.5,
  colorSaturation: 1.2,
  smoothness: 0.15,
  responsiveness: 0.85,
  flickerReduction: true,
  debanding: true,
  frameBlending: 0.25,
  quality: 'balanced',
  leftEnabled: true,
  rightEnabled: true,
};

export interface ScreenXAnalysis {
  leftEdge: AmbientRgb;
  rightEdge: AmbientRgb;
  leftGradientStops: AmbientRgb[]; // 3-point vertical slices (top-left, mid-left, bottom-left)
  rightGradientStops: AmbientRgb[]; // 3-point vertical slices (top-right, mid-right, bottom-right)
  leftLuma: number;
  rightLuma: number;
  isCut: boolean;
  timestamp: number;
}

/**
 * U-Tube Four-Sided Ambient Lighting Shared Contracts
 * 360-degree top, bottom, left, and right peripheral ambient glow.
 */
export interface UTubeAmbientConfig {
  enabled: boolean;
  intensity: number; // 0.0 - 1.0 (default 0.70)
  blur: number; // 10 - 120px (default 60)
  spread: number; // 10 - 100px (default 40)
  fadeInDuration: number; // ms (default 400)
  smoothness: number; // 0.05 - 0.4 (default 0.15)
  edgeSampleSize: number; // 5 - 25% (default 10)
  frameBlending: number; // 0.0 - 1.0 (default 0.3)
  flickerReduction: boolean; // default true
  debanding: boolean; // default true
  quality: 'performance' | 'balanced' | 'high' | 'ultra'; // default balanced
  performanceMode: boolean; // default false
  topEnabled: boolean; // default true
  bottomEnabled: boolean; // default true
  leftEnabled: boolean; // default true
  rightEnabled: boolean; // default true
}

export const DEFAULT_UTUBE_AMBIENT_CONFIG: UTubeAmbientConfig = {
  enabled: true,
  intensity: 0.70,
  blur: 60,
  spread: 40,
  fadeInDuration: 400,
  smoothness: 0.15,
  edgeSampleSize: 10,
  frameBlending: 0.3,
  flickerReduction: true,
  debanding: true,
  quality: 'balanced',
  performanceMode: false,
  topEnabled: true,
  bottomEnabled: true,
  leftEnabled: true,
  rightEnabled: true,
};

export interface UTubeFourSidedAnalysis {
  top: AmbientRgb;
  bottom: AmbientRgb;
  left: AmbientRgb;
  right: AmbientRgb;
  topLeft: AmbientRgb;
  topRight: AmbientRgb;
  bottomLeft: AmbientRgb;
  bottomRight: AmbientRgb;
  dominant: AmbientRgb;
  luma: number;
  isCut: boolean;
  timestamp: number;
}
