/**
 * CineMorph Spatial Model — Viewport Scene State Machine Types
 * =============================================================
 * Codifies the authoritative 6-space CineMorph spatial architecture:
 * Arrival Lobby -> Booking Office -> Media Ingest -> Ticket Printing ->
 * Admission Decision -> Personal Screening Room -> Theater Entry
 * 
 * Invariant: Operates within a single 100dvh dynamic viewport with zero document scroll.
 */

export type CineMorphSpace =
  | 'arrival_lobby'
  | 'booking_office'
  | 'media_ingest'
  | 'ticket_printing'
  | 'admission_decision'
  | 'personal_screening_room'
  | 'theater_entry';

export type EnvironmentalTime = 'morning' | 'night';

export interface SceneSpatialParameters {
  depthZ: number; // Viewport Z depth offset in pixels
  focalBlurPx: number; // Spatial depth-of-field blur in px
  ambientIllumination: number; // Normalized illumination [0.0, 1.0]
  cameraPitchDeg: number; // Subtle physical perspective pitch in degrees
  screenScale: number; // Responsive scale factor of cinema screen aperture
  ambientBackground: string; // Dynamic architectural background color
  accentTint: string; // Dynamic practical lighting accent
}

export interface SceneTransition {
  from: CineMorphSpace;
  to: CineMorphSpace;
  progress: number; // [0.0, 1.0]
  isTransitioning: boolean;
  timestamp: number;
}

export interface CineMorphSceneState {
  currentSpace: CineMorphSpace;
  previousSpace: CineMorphSpace | null;
  environmentalTime: EnvironmentalTime;
  transition: SceneTransition | null;
  parameters: SceneSpatialParameters;
  canEnterTheater: boolean;
  generation: number;
}

export type SceneAction =
  | { type: 'ENTER_SPACE'; space: CineMorphSpace }
  | { type: 'START_INGEST' }
  | { type: 'START_PRINTING'; ticketId: string }
  | { type: 'FINISH_PRINTING' }
  | { type: 'CANCEL_PRINTING' }
  | { type: 'CONFIRM_ADMISSION' }
  | { type: 'ENTER_THEATER' }
  | { type: 'RETURN_TO_LOBBY' }
  | { type: 'SET_ENVIRONMENTAL_TIME'; time: EnvironmentalTime };
