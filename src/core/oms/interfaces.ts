/**
 * OMS (OmniStream Intelligence System) - Core Interfaces & Architectural Contracts
 * 100% Free, Local-First, Zero-Paid-API Architecture
 */

export type FallbackTier = 'tier3_advanced' | 'tier2_enhanced' | 'tier1_baseline' | 'original_source';
export type HealthStatus = 'AVAILABLE' | 'LOADING' | 'READY' | 'DEGRADED' | 'FAILED';
export type ModelRuntimeType = 'browser-wasm' | 'web-audio-api' | 'canvas-cv' | 'deterministic-algorithm' | 'local-tokenizer' | 'web-worker';

export interface IDeviceCapabilities {
  hasWasm: boolean;
  hasSimd: boolean;
  hasWebGpu: boolean;
  hasWebWorkers: boolean;
  hasOffscreenCanvas: boolean;
  hasAudioContext: boolean;
  hardwareConcurrency: number;
  deviceMemoryGb: number;
  isOnline: boolean;
  isOnBattery?: boolean;
  batteryLevel?: number;
  maxTextureSize: number;
  estimatedTier: 'high' | 'balanced' | 'low' | 'ultra-low';
}

export interface IModelMetadata {
  id: string;
  name: string;
  version: string;
  category: 'vision' | 'audio' | 'nlp' | 'temporal' | 'heuristic';
  provenance: {
    source: string;
    license: string;
    originalModelName: string;
  };
  resourceBudget: {
    downloadSizeKb: number;
    ramRequirementMb: number;
    targetLatencyMs: number;
    recommendedRuntime: ModelRuntimeType;
  };
  healthStatus: HealthStatus;
  fallbackModelId?: string;
}

export interface IModelRuntimeAdapter<TInput, TOutput> {
  readonly id: string;
  readonly metadata: IModelMetadata;
  initialize(): Promise<boolean>;
  execute(input: TInput): Promise<TOutput>;
  isAvailable(): boolean;
  dispose(): void;
}

export interface IRuntimeExecutionResult<T> {
  result: T;
  executedTier: FallbackTier;
  fallbackOccurred: boolean;
  fallbackReason?: string;
  latencyMs: number;
  confidence: number;
}

export interface IFallbackStage<TInput, TOutput> {
  tier: FallbackTier;
  name: string;
  timeoutMs: number;
  isAvailable: () => boolean;
  execute: (input: TInput) => Promise<TOutput> | TOutput;
}

export interface IApertureTransform {
  panX: number;
  panY: number;
  scale: number;
  cssTransform: string;
  isSourceProtected: boolean;
  activeRule: string;
  confidence: number;
  latencyMs: number;
}

export interface IFrameProcessor {
  processFrame(video: HTMLVideoElement, aspectRatio: string, subtitlesActive?: boolean): IApertureTransform;
  reset(): void;
}

export interface IAudioDSPProcessor {
  initialize(audioElement: HTMLMediaElement): Promise<boolean>;
  applyPreset(preset: string, params?: Record<string, number | boolean>): void;
  reset(): void;
  dispose(): void;
}

/**
 * ============================================================================
 * E1 ARCHITECTURAL CONTRACTS: VISUAL & AUDIO PERCEPTION DOMAINS
 * ============================================================================
 */

export interface IVisualSubjectCandidate {
  readonly id: string;
  readonly box: {
    readonly x: number;      // [0, 1] normalized
    readonly y: number;      // [0, 1] normalized
    readonly width: number;  // [0, 1] normalized
    readonly height: number; // [0, 1] normalized
  };
  readonly confidence: number; // [0, 1] normalized
  readonly type: 'face' | 'person' | 'salient_region' | 'contrast_cluster';
  readonly keypoints?: ReadonlyArray<{ readonly x: number; readonly y: number; readonly name?: string }>;
}

export interface IVisualPerceptionEvidence {
  readonly timestamp: number;
  readonly status: 'AVAILABLE' | 'NO_SUBJECTS' | 'DEGRADED' | 'FAILED';
  readonly candidates: readonly IVisualSubjectCandidate[];
  readonly primarySubject: IVisualSubjectCandidate | null;
  readonly focalCenter: { readonly x: number; readonly y: number };
  readonly confidence: number;
  readonly latencyMs: number;
  readonly source: 'enhanced_ml' | 'classical_cv' | 'safe_fallback';
}

export interface IVisualPerceptionProvider {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  initialize(): Promise<boolean>;
  processFrame(
    frame: ImageBitmap | HTMLVideoElement | HTMLCanvasElement,
    timestamp: number
  ): Promise<IVisualPerceptionEvidence>;
  isAvailable(): boolean;
  dispose(): void;
}

export interface IAudioDialogueEvent {
  readonly speechLikelihood: number;  // [0, 1]
  readonly clarityDeficit: number;    // [0, 1]
  readonly energyDb: number;          // [-100, 0]
  readonly spectralCentroid: number;  // Hz
}

export interface IAudioPerceptionEvidence {
  readonly timestamp: number;
  readonly status: 'AVAILABLE' | 'NO_SIGNAL' | 'DEGRADED' | 'FAILED';
  readonly dialogue: IAudioDialogueEvent;
  readonly acousticEnvironment: 'dialogue' | 'music' | 'mixed' | 'ambient' | 'silent';
  readonly recommendedClarityBoost: number; // [0, 1] normalized recommendation
  readonly latencyMs: number;
  readonly source: 'enhanced_ml' | 'webaudio_analyser' | 'safe_fallback';
}

export interface IAudioPerceptionProvider {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  initialize(context: AudioContext, sourceNode?: AudioNode): Promise<boolean>;
  analyze(spectrumData: Uint8Array, timestamp: number): IAudioPerceptionEvidence;
  isAvailable(): boolean;
  dispose(): void;
}

