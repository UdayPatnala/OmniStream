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


/**
 * types.ts - OMS Smart-Framing Architecture Types
 * Defines data structures across all 13 stages of the OMS pipeline.
 */

export interface OMS_FrameSample {
  timestamp: number;
  data: Uint8ClampedArray;
  width: number;
  height: number;
  luminanceHistogram: number[];
  averageBrightness: number;
  averageRgb: { r: number; g: number; b: number };
}

export interface OMS_SceneCutEvent {
  isHardCut: boolean;
  deltaRatio: number;
  timestamp: number;
  sceneId: number;
  transitionType?: 'CONTINUOUS' | 'POSSIBLE_TRANSITION' | 'CONFIRMED_CUT';
}

export interface OMS_SubjectDetection {
  x: number; // [0, 1] normalized
  y: number; // [0, 1] normalized
  width: number;
  height: number;
  confidence: number;
  type: 'face' | 'person' | 'salient_region' | 'contrast_cluster';
}

export interface OMS_VisionAnalysisResult {
  subjects: OMS_SubjectDetection[];
  primarySubject: OMS_SubjectDetection | null;
  combinedCenter: { x: number; y: number };
  subtitleZoneBlocked: boolean;
  confidence: number;
}

export interface OMS_MotionVector {
  vx: number; // [-1, 1] per second
  vy: number; // [-1, 1] per second
  speed: number;
  directionRad: number;
}

export interface OMS_CandidateFraming {
  id: string;
  name: string;
  panX: number; // [-1, 1]
  panY: number; // [-1, 1]
  scale: number;
  aspectRatio: string;
}

export interface OMS_ScoredFraming extends OMS_CandidateFraming {
  subjectScore: number;
  ruleScore: number;
  motionScore: number;
  subtitlePenalty: number;
  zoomPenalty: number;
  totalScore: number;
  reason: string;
}

export interface OMS_TemporalState {
  currentPanX: number;
  currentPanY: number;
  currentScale: number;
  velocity: { vx: number; vy: number };
  lastUpdateTime: number;
}

export interface OMS_ApertureTransform {
  panX: number;
  panY: number;
  scale: number;
  cssTransform: string;
  isSourceProtected: boolean;
  activeRule: string;
  confidence: number;
  latencyMs: number;
}

