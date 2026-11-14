/**
 * OmniStream Advanced Audio Shared Contracts
 * Defines runtime-independent contracts for container probing, codec support,
 * multi-track routing, delay compensation, Sony 360 Reality Audio detection,
 * and automatic spatial audio rendering.
 *
 * Conforms to OPCA Rule 4 (zero cross-layer imports from shared to product capsules).
 */

export type AudioCodecSupportLevel = 'native' | 'demuxed' | 'software' | 'unsupported';

export interface AudioFormatInfo {
  container: string;
  extension: string;
  codec: string;
  channels: number;
  channelLayout: string; // e.g. "Mono 1.0", "Stereo 2.0", "5.1 Surround", "7.1 Surround", "Sony 360 Reality Audio"
  bitrate?: number;
  sampleRate?: number;
  supportLevel: AudioCodecSupportLevel;
  isNativelySupported: boolean;
  unsupportedReason?: string;
  isImmersiveEligible: boolean;
  hasSony360Metadata: boolean;
}

export type SpatialAudioMode =
  | 'off'
  | 'auto'
  | 'spatial-3d'
  | 'binaural-cinema'
  | 'sony-360'
  | 'dialogue-focus';

export interface Sony360DetectionResult {
  isDetected: boolean;
  isNativeHardwareDecoded: boolean;
  confidence: 'none' | 'probable' | 'confirmed';
  formatProfile?: string; // e.g. "MPEG-H 3D Audio Profile Level 3", "360RA Object Stream"
  objectCount?: number;
  notes?: string;
}

export interface SpatialAudioConfig {
  mode: SpatialAudioMode;
  autoActivation: boolean;
  headroomGainDb: number;
  surroundWidth: number; // 0.0 - 2.0
  virtualRoomSize: 'intimate' | 'auditorium' | 'cathedral';
  dialogueCentering: number; // 0.0 - 1.0
  audioDelayMs: number; // -500 to +500 ms delay adjustment
  drcProtection: boolean; // dynamics compression protection against clipping
}

export const DEFAULT_SPATIAL_AUDIO_CONFIG: SpatialAudioConfig = {
  mode: 'auto',
  autoActivation: true,
  headroomGainDb: -2.0,
  surroundWidth: 1.25,
  virtualRoomSize: 'auditorium',
  dialogueCentering: 0.8,
  audioDelayMs: 0,
  drcProtection: true,
};

export interface AudioTrackMetadata {
  id: string;
  index: number;
  label: string;
  language: string;
  codec: string;
  channels: number;
  channelLayout: string;
  isDefault: boolean;
  isSpatialEligible: boolean;
  bitrate?: number;
}
