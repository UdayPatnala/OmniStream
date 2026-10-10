/**
 * Subtitle & Caption Shared Runtime Contracts
 * =============================================
 * Canonical interfaces used across shared UI components and product capsules.
 * Pure primitive contracts with zero cross-layer dependencies.
 */

export interface SubtitleCueContract {
  readonly id: string;
  readonly startTime: number;
  readonly endTime: number;
  readonly text: string;
  readonly speaker?: string;
  readonly isSdh?: boolean;
  readonly isRtl?: boolean;
  readonly format?: 'vtt' | 'srt' | 'ass' | 'native';
  readonly settings?: Record<string, string>;
}

export type SubtitleFontSize = 'small' | 'medium' | 'large' | 'extra-large';
export type SubtitleFontFamily = 'sans-serif' | 'serif' | 'monospace';

export interface SubtitleStyleConfig {
  readonly fontSize: SubtitleFontSize;
  readonly fontFamily: SubtitleFontFamily;
  readonly textColor: string;
  readonly backgroundColor: string;
  readonly backgroundOpacity: number;
  readonly textShadow: string;
  readonly bottomOffsetRem: number;
}

export const DEFAULT_SUBTITLE_STYLE_CONFIG: SubtitleStyleConfig = {
  fontSize: 'medium',
  fontFamily: 'sans-serif',
  textColor: '#FFFFFF',
  backgroundColor: 'transparent',
  backgroundOpacity: 0.0,
  textShadow: '0 2px 6px rgba(0, 0, 0, 0.85)',
  bottomOffsetRem: 3.0,
};

export function getSubtitleFontSizeClass(size: SubtitleFontSize): string {
  switch (size) {
    case 'small':
      return 'text-xs sm:text-sm';
    case 'medium':
      return 'text-xs sm:text-sm md:text-base';
    case 'large':
      return 'text-sm sm:text-base md:text-lg';
    case 'extra-large':
      return 'text-base sm:text-lg md:text-xl';
    default:
      return 'text-xs sm:text-sm md:text-base';
  }
}

export function getSubtitleFontFamily(family: SubtitleFontFamily): string {
  switch (family) {
    case 'serif':
      return 'Cinzel, Georgia, serif';
    case 'monospace':
      return '"JetBrains Mono", Menlo, monospace';
    case 'sans-serif':
    default:
      return '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
  }
}
