import { HealthStatus, IModelMetadata, IModelRuntimeAdapter } from './interfaces';

/**
 * OMS Model Registry & Lifecycle Manager
 * Tracks models, licenses, hardware bounds, and runtime adapters.
 */
export class OMSModelRegistry {
  private static metadataMap: Map<string, IModelMetadata> = new Map([
    [
      'oms-vision-saliency-v1',
      {
        id: 'oms-vision-saliency-v1',
        name: 'OMS Fast 16x9 Saliency & Gradient Tracker',
        version: '1.2.0',
        category: 'vision',
        provenance: {
          source: 'local-canvas-cv',
          license: 'MIT (AROH Open Source)',
          originalModelName: 'Sobel-Luminance-COM-Tracker',
        },
        resourceBudget: {
          downloadSizeKb: 0,
          ramRequirementMb: 4.0,
          targetLatencyMs: 1.2,
          recommendedRuntime: 'canvas-cv',
        },
        healthStatus: 'READY',
      },
    ],
    [
      'oms-audio-biquad-dsp-v2',
      {
        id: 'oms-audio-biquad-dsp-v2',
        name: 'OMS Web Audio 5-Band Parametric DSP',
        version: '2.0.0',
        category: 'audio',
        provenance: {
          source: 'browser-native-webaudio',
          license: 'MIT (AROH Open Source)',
          originalModelName: 'WebAudio-5Band-DRC-Spatializer',
        },
        resourceBudget: {
          downloadSizeKb: 0,
          ramRequirementMb: 1.0,
          targetLatencyMs: 0.1,
          recommendedRuntime: 'web-audio-api',
        },
        healthStatus: 'READY',
      },
    ],
    [
      'oms-intent-tokenizer-v1',
      {
        id: 'oms-intent-tokenizer-v1',
        name: 'OMS Deterministic Intent & Keyword Classifier',
        version: '1.1.0',
        category: 'nlp',
        provenance: {
          source: 'local-regex-tokenizer',
          license: 'MIT (AROH Open Source)',
          originalModelName: 'Deterministic-Intent-Matcher',
        },
        resourceBudget: {
          downloadSizeKb: 0,
          ramRequirementMb: 0.5,
          targetLatencyMs: 0.05,
          recommendedRuntime: 'deterministic-algorithm',
        },
        healthStatus: 'READY',
      },
    ],
    [
      'oms-face-blazeface-wasm',
      {
        id: 'oms-face-blazeface-wasm',
        name: 'MediaPipe BlazeFace WASM (Pre-Scan Only)',
        version: '0.0.7',
        category: 'vision',
        provenance: {
          source: 'mediapipe-blazeface',
          license: 'Apache-2.0',
          originalModelName: 'BlazeFace-ShortRange',
        },
        resourceBudget: {
          downloadSizeKb: 2100,
          ramRequirementMb: 15.0,
          targetLatencyMs: 5.0,
          recommendedRuntime: 'browser-wasm',
        },
        healthStatus: 'AVAILABLE',
        fallbackModelId: 'oms-vision-saliency-v1',
      },
    ],
  ]);

  private static adapters: Map<string, IModelRuntimeAdapter<any, any>> = new Map();

  public static registerModel(metadata: IModelMetadata): void {
    this.metadataMap.set(metadata.id, metadata);
  }

  public static registerAdapter(adapter: IModelRuntimeAdapter<any, any>): void {
    this.adapters.set(adapter.id, adapter);
    if (!this.metadataMap.has(adapter.id)) {
      this.metadataMap.set(adapter.id, adapter.metadata);
    }
  }

  public static getModel(id: string): IModelMetadata | undefined {
    return this.metadataMap.get(id);
  }

  public static getAdapter<TIn, TOut>(id: string): IModelRuntimeAdapter<TIn, TOut> | undefined {
    return this.adapters.get(id);
  }

  public static listModels(): IModelMetadata[] {
    return Array.from(this.metadataMap.values());
  }

  public static updateHealthStatus(id: string, status: HealthStatus): void {
    const meta = this.metadataMap.get(id);
    if (meta) {
      meta.healthStatus = status;
    }
  }

  public static getReadyModels(category?: IModelMetadata['category']): IModelMetadata[] {
    return this.listModels().filter((m) => m.healthStatus === 'READY' && (!category || m.category === category));
  }
}
