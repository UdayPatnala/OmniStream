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
