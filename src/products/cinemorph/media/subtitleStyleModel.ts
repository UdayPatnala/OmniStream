/**
 * CineMorph Subtitle & Caption Subsystem — Subtitle Style Model
 * =============================================================
 * Defines the presentation configuration for subtitles and captions,
 * decoupled from raw cue data.
 * 
 * Invariants:
 * - Separates content from visual styling: cue text is never mutated for styling.
 * - Restrained typography: high legibility on dark cinematic background with soft drop shadow.
 * - Proportional scaling: supports small, medium, large, and extra-large sizes.
 */

export type SubtitleFontSize = 'small' | 'medium' | 'large' | 'extra-large';
export type SubtitleFontFamily = 'sans-serif' | 'serif' | 'monospace';

export interface SubtitleStyleConfig {
  readonly fontSize: SubtitleFontSize;
  readonly fontFamily: SubtitleFontFamily;
  readonly textColor: string;
  readonly backgroundColor: string;
  readonly backgroundOpacity: number; // 0.0 to 0.9
  readonly textShadow: string;
  readonly bottomOffsetRem: number;
}

export const DEFAULT_SUBTITLE_STYLE: SubtitleStyleConfig = {
  fontSize: 'medium',
  fontFamily: 'sans-serif',
  textColor: '#FFFFFF',
  backgroundColor: 'transparent',
  backgroundOpacity: 0.0,
  textShadow: '0 2px 6px rgba(0, 0, 0, 0.85)',
  bottomOffsetRem: 3.0,
};

/**
 * Maps SubtitleFontSize token to Tailwind font size class names
 */
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

/**
 * Maps SubtitleFontFamily token to font-family CSS value
 */
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
