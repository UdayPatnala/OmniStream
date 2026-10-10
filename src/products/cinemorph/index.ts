/**
 * CineMorph Product Capsule — Public API
 * ===========================================
 * External code (shell, tests) imports from here.
 * Never import from internal product paths directly.
 *
 * Internal structure:
 *   pages/         — CineMorphLanding, CineMorphTheater
 *   components/    — landing (CineMorphNav, CinemaLounge)
 *   state/         — useCineMorphStore
 *   ticketing/     — useTicketStore, TicketPrinterAnimation
 *   media/         — mediaParser, audioEngine, captionService, ...
 *   theater/       — adaptiveCinemaEngine
 *   perception/    — CV/ML pipeline (CineMorph-specific)
 *   services/      — orientationService
 *   spatial/       — CineMorph Spatial Model (Entities, Solver, Validator, Motion, Renderer, Recovery, Engine)
 *   sbh/           — Backward-compatible OMS-SBH aliases
 *   types/         — CineMorph types
 */

// Pages (lazy-loaded by shell)
export { CineMorphLanding } from './pages/CineMorphLanding';
export { CineMorphTheater } from './pages/CineMorphTheater';

// Components
export { CineMorphNav } from './components/landing/CineMorphNav';
export { CinemaLounge } from './components/landing/CinemaLounge';
export { CineMorphPlayerControls } from './components/player/CineMorphPlayerControls';
export { TrackSelectionMenu } from './components/player/TrackSelectionMenu';

// Ticketing
export { TicketPrinterAnimation } from './ticketing/TicketPrinterAnimation';
export { useTicketStore } from './ticketing/useTicketStore';
export type { MovieTicket, TicketStoreState } from './ticketing/useTicketStore';

// State
export { useCineMorphStore } from './state/useCineMorphStore';
export { useCineMorphScene } from './state/useCineMorphScene';
export type { AspectRatioMode, FramingRuleMode, CineMorphStoreState, CineMorphVideoSource } from './state/useCineMorphStore';

// Spatial Model & Engine
export * from './spatial';

// Media Subsystem, Capability Probing & Track Model
export * from './media';

// Types (public surface only)
export type {
  LocalMediaItem, CineMorphScreeningSession, MediaContainerAnalysis,
  MediaAudioTrack, MediaVideoStream, MediaSubtitleTrack,
  FrameAspectRatio, DevicePerformanceProfile,
  AdaptivePerformanceDecision, MediaHybridRouteType,
} from './types';

// Media Validation
export { validateCineMorphMedia, SUPPORTED_VIDEO_EXTENSIONS, SUPPORTED_AUDIO_EXTENSIONS, SUPPORTED_MEDIA_EXTENSIONS, NON_VIDEO_ERROR_MESSAGE, VERTICAL_VIDEO_ERROR_MESSAGE } from './media/mediaValidator';
export type { MediaValidationResult } from './media/mediaValidator';
