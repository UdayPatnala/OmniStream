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
 *   types/         — CineMorph types
 */

// Pages (lazy-loaded by shell)
export { CineMorphLanding } from './pages/CineMorphLanding';
export { CineMorphTheater } from './pages/CineMorphTheater';

// Components
export { CineMorphNav } from './components/landing/CineMorphNav';
export { CinemaLounge } from './components/landing/CinemaLounge';

// Ticketing
export { TicketPrinterAnimation } from './ticketing/TicketPrinterAnimation';
export { useTicketStore } from './ticketing/useTicketStore';
export type { MovieTicket, TicketStoreState } from './ticketing/useTicketStore';

// State
export { useCineMorphStore } from './state/useCineMorphStore';
export type { AspectRatioMode, FramingRuleMode, CineMorphStoreState, CineMorphVideoSource } from './state/useCineMorphStore';

// Types (public surface only)
export type {
  LocalMediaItem, CineMorphScreeningSession, MediaContainerAnalysis,
  MediaAudioTrack, MediaVideoStream, MediaSubtitleTrack,
  FrameAspectRatio, DevicePerformanceProfile,
  AdaptivePerformanceDecision, MediaHybridRouteType,
} from './types';
