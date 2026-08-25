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
