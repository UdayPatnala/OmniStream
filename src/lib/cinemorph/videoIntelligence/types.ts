/**
 * Video Intelligence & Frame Analysis Types
 * Copyright (c) Patnala Uday Kumar. All rights reserved.
 *
 * Implements L3 intelligence architecture for video sampling, frame scoring,
 * aspect ratio detection, and best-frame selection.
 */

export interface FrameQualityMetrics {
  sharpnessScore: number; // [0, 1] normalized Laplacian variance
  blurDetected: boolean;
  averageLuminance: number; // [0, 255]
  contrastScore: number; // [0, 1] standard deviation of luminance
  exposureStatus: 'underexposed' | 'balanced' | 'overexposed' | 'low_key_cinematic';
  highlightClipping: number; // [0, 1] fraction of pixels >= 250
  shadowClipping: number; // [0, 1] fraction of pixels <= 5
}

export interface FrameCompositionMetrics {
  ruleOfThirdsScore: number; // [0, 1] alignment with 1/3 and 2/3 power points
  symmetryScore: number; // [0, 1] horizontal balance
  centerMassScore: number; // [0, 1] focal energy near center
  negativeSpaceBalance: number; // [0, 1] distribution of visual density
}

export interface CandidateFrame {
  timestampSeconds: number;
  frameIndex: number;
  dataUrl?: string;
  quality: FrameQualityMetrics;
  composition: FrameCompositionMetrics;
  temporalDistanceFromCut: number; // seconds from nearest scene boundary
  motionBlurPenalty: number; // [0, 1] penalty factor
  totalScore: number; // [0, 1] weighted composite score
  selectionPurpose: 'poster' | 'ticket_thumbnail' | 'preview_card' | 'keyframe';
}

export type DetectedAspectRatio = '1.43:1' | '1.90:1' | '2.39:1' | '16:9' | '4:3' | 'original';

export interface ActiveImageBounds {
  topBarHeight: number; // black bar top pixels
  bottomBarHeight: number; // black bar bottom pixels
  leftBarWidth: number; // pillarbox left pixels
  rightBarWidth: number; // pillarbox right pixels
  activeWidth: number;
  activeHeight: number;
  measuredAspectRatio: number; // e.g. 1.43, 1.78, 1.90, 2.39
  matchedStandard: DetectedAspectRatio;
  confidence: number; // [0, 1]
}

export interface VideoIntelligenceReport {
  videoDuration: number;
  sampleCount: number;
  detectedFormat: DetectedAspectRatio;
  formatConfidence: number;
  isDynamicAspectRatio: boolean; // switches between formats (e.g. Nolan / Dune IMAX switches)
  bestFrames: {
    ticketPoster: CandidateFrame;
    previewCard: CandidateFrame;
  };
  analysisLatencyMs: number;
}
