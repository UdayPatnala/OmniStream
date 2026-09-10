/**
 * OmniStream Shared — Public API
 * ================================
 * Genuinely product-neutral UI primitives and utilities.
 * A file belongs here ONLY if both U-Tube and CineMorph would use it
 * and it contains zero product-specific semantics.
 *
 *   ui/            — ErrorBoundary, Skeleton, CaptionOverlay, OMSLogo
 *   utils/         — Generic utility functions (extractYouTubeId, formatDuration, etc.)
 *   design/        — Design tokens, typography, color system
 *   accessibility/ — ARIA helpers, focus management
 */

export { ErrorBoundary } from './ui/ErrorBoundary';
export { Skeleton } from './ui/Skeleton';
export { CaptionOverlay } from './ui/CaptionOverlay';
export { OMSLogo } from './ui/OMSLogo';
