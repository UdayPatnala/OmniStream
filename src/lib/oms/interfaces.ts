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
