import { describe, it, expect } from 'vitest';
import { OMSCapabilityResolver, ICapabilityTierDefinition, IResolutionDiagnostic } from '../../lib/oms/capabilityResolver';

describe('Tier 5 Adversarial: Progressive Capability Failure & Recovery Matrix (Phase 11)', () => {
  interface PipelineContext {
    gpuAvailable: boolean;
    wasmLoaded: boolean;
    canvasAvailable: boolean;
  }

  interface VideoInput {
    videoElement: HTMLVideoElement | null;
    aspectRatio: '1.43:1' | '1.90:1' | 'original' | '4:3';
    hasSubtitles: boolean;
  }

  interface FramingOutput {
    panX: number;
    panY: number;
    scale: number;
    mode: string;
    isSourceProtected: boolean;
  }

  const safeBaselineDefault: FramingOutput = {
    panX: 0,
    panY: 0,
    scale: 1.0,
    mode: 'safe-baseline-original-directorial',
    isSourceProtected: true,
  };

  // TEST 1: Advanced works
  it('TEST 1: Advanced capability executes successfully when healthy', async () => {
    const tier3: ICapabilityTierDefinition<PipelineContext, VideoInput, FramingOutput> = {
      tier: 'tier3_advanced',
      name: 'Tier 3 AI Smart Pan',
      timeoutMs: 50,
      isAvailable: (ctx) => ctx.gpuAvailable && ctx.wasmLoaded,
      isCompatible: (_ctx, inp) => inp.aspectRatio !== 'original',
      execute: () => ({ panX: 0.35, panY: 0.1, scale: 1.25, mode: 'tier-3-advanced-model', isSourceProtected: false }),
      validateOutput: (out) => Number.isFinite(out.panX) && Number.isFinite(out.panY) && out.scale > 0,
    };

    const resolver = new OMSCapabilityResolver([tier3]);
    const res = await resolver.resolve(
      { gpuAvailable: true, wasmLoaded: true, canvasAvailable: true },
      { videoElement: null, aspectRatio: '1.43:1', hasSubtitles: false },
      safeBaselineDefault
    );

    expect(res.executedTier).toBe('tier3_advanced');
    expect(res.fallbackOccurred).toBe(false);
    expect(res.result.mode).toBe('tier-3-advanced-model');
  });

  // TEST 2: Advanced unavailable → Enhanced works
  it('TEST 2: Advanced capability unavailable falls back gracefully to Enhanced Saliency', async () => {
    const tier3: ICapabilityTierDefinition<PipelineContext, VideoInput, FramingOutput> = {
      tier: 'tier3_advanced',
      name: 'Tier 3 AI Smart Pan',
      timeoutMs: 50,
      isAvailable: (ctx) => ctx.gpuAvailable && ctx.wasmLoaded, // False in test
      isCompatible: () => true,
      execute: () => ({ panX: 0.5, panY: 0.5, scale: 1.25, mode: 'tier-3', isSourceProtected: false }),
    };

    const tier2: ICapabilityTierDefinition<PipelineContext, VideoInput, FramingOutput> = {
      tier: 'tier2_enhanced',
      name: 'Tier 2 Canvas CV Saliency',
      timeoutMs: 50,
      isAvailable: (ctx) => ctx.canvasAvailable,
      isCompatible: () => true,
      execute: () => ({ panX: 0.2, panY: 0.05, scale: 1.25, mode: 'tier-2-enhanced-saliency', isSourceProtected: false }),
    };

    const diagnostics: IResolutionDiagnostic[] = [];
    const resolver = new OMSCapabilityResolver([tier3, tier2], (diag) => diagnostics.push(...diag));

    const res = await resolver.resolve(
      { gpuAvailable: false, wasmLoaded: false, canvasAvailable: true },
      { videoElement: null, aspectRatio: '1.43:1', hasSubtitles: false },
      safeBaselineDefault
    );

    expect(res.executedTier).toBe('tier2_enhanced');
    expect(res.fallbackOccurred).toBe(true);
    expect(res.result.mode).toBe('tier-2-enhanced-saliency');
    expect(diagnostics.some((d) => d.status === 'SKIPPED_UNAVAILABLE')).toBe(true);
  });

  // TEST 3: Advanced crashes → Enhanced works
  it('TEST 3: Advanced capability runtime crash falls back gracefully to Enhanced Saliency', async () => {
    const tier3: ICapabilityTierDefinition<PipelineContext, VideoInput, FramingOutput> = {
      tier: 'tier3_advanced',
      name: 'Tier 3 Crashing Model',
      timeoutMs: 50,
      isAvailable: () => true,
      isCompatible: () => true,
      execute: () => {
        throw new Error('GPU Context Lost in Neural Runtime');
      },
    };

    const tier2: ICapabilityTierDefinition<PipelineContext, VideoInput, FramingOutput> = {
      tier: 'tier2_enhanced',
      name: 'Tier 2 Canvas CV Saliency',
      timeoutMs: 50,
      isAvailable: () => true,
      isCompatible: () => true,
      execute: () => ({ panX: 0.15, panY: 0.0, scale: 1.08, mode: 'tier-2-recovered', isSourceProtected: false }),
    };

    const diagnostics: IResolutionDiagnostic[] = [];
    const resolver = new OMSCapabilityResolver([tier3, tier2], (diag) => diagnostics.push(...diag));

    const res = await resolver.resolve(
      { gpuAvailable: true, wasmLoaded: true, canvasAvailable: true },
      { videoElement: null, aspectRatio: '1.90:1', hasSubtitles: false },
      safeBaselineDefault
    );

    expect(res.executedTier).toBe('tier2_enhanced');
    expect(res.result.mode).toBe('tier-2-recovered');
    const crashDiag = diagnostics.find((d) => d.failureType === 'RUNTIME_ERROR');
    expect(crashDiag).toBeDefined();
    expect(crashDiag?.errorMessage).toBe('GPU Context Lost in Neural Runtime');
  });

  // TEST 4: Enhanced unavailable → Baseline works
  it('TEST 4: Enhanced capability unavailable (canvas tainted) falls back to Tier 1 Center Crop', async () => {
    const tier2: ICapabilityTierDefinition<PipelineContext, VideoInput, FramingOutput> = {
      tier: 'tier2_enhanced',
      name: 'Tier 2 Canvas CV Saliency',
      timeoutMs: 50,
      isAvailable: (ctx) => ctx.canvasAvailable, // False in test
      isCompatible: () => true,
      execute: () => ({ panX: 0.2, panY: 0.0, scale: 1.08, mode: 'tier-2', isSourceProtected: false }),
    };

    const tier1: ICapabilityTierDefinition<PipelineContext, VideoInput, FramingOutput> = {
      tier: 'tier1_baseline',
      name: 'Tier 1 Center Aperture Crop',
      timeoutMs: 20,
      isAvailable: () => true,
      isCompatible: () => true,
      execute: () => ({ panX: 0, panY: 0, scale: 1.08, mode: 'tier-1-center-aperture', isSourceProtected: false }),
    };

    const resolver = new OMSCapabilityResolver([tier2, tier1]);
    const res = await resolver.resolve(
      { gpuAvailable: false, wasmLoaded: false, canvasAvailable: false },
      { videoElement: null, aspectRatio: '1.90:1', hasSubtitles: false },
      safeBaselineDefault
    );

    expect(res.executedTier).toBe('tier1_baseline');
    expect(res.result.mode).toBe('tier-1-center-aperture');
    expect(res.result.panX).toBe(0);
  });

  // TEST 5: All advanced systems unavailable → Baseline remains functional
  it('TEST 5: Airgapped or low-spec device runs Baseline Crop with zero errors', async () => {
    const tier3: ICapabilityTierDefinition<PipelineContext, VideoInput, FramingOutput> = {
      tier: 'tier3_advanced',
      name: 'Tier 3 Model',
      timeoutMs: 50,
      isAvailable: (ctx) => ctx.gpuAvailable,
      isCompatible: () => true,
      execute: () => ({ panX: 0.5, panY: 0.5, scale: 1.25, mode: 'tier-3', isSourceProtected: false }),
    };

    const tier2: ICapabilityTierDefinition<PipelineContext, VideoInput, FramingOutput> = {
      tier: 'tier2_enhanced',
      name: 'Tier 2 Canvas',
      timeoutMs: 50,
      isAvailable: (ctx) => ctx.canvasAvailable,
      isCompatible: () => true,
      execute: () => ({ panX: 0.2, panY: 0.0, scale: 1.25, mode: 'tier-2', isSourceProtected: false }),
    };

    const tier1: ICapabilityTierDefinition<PipelineContext, VideoInput, FramingOutput> = {
      tier: 'tier1_baseline',
      name: 'Tier 1 Center Crop',
      timeoutMs: 20,
      isAvailable: () => true,
      isCompatible: () => true,
      execute: () => ({ panX: 0, panY: 0, scale: 1.25, mode: 'tier-1-baseline', isSourceProtected: false }),
    };

    const resolver = new OMSCapabilityResolver([tier3, tier2, tier1]);
    const res = await resolver.resolve(
      { gpuAvailable: false, wasmLoaded: false, canvasAvailable: false },
      { videoElement: null, aspectRatio: '1.43:1', hasSubtitles: false },
      safeBaselineDefault
    );

    expect(res.executedTier).toBe('tier1_baseline');
    expect(res.result.mode).toBe('tier-1-baseline');
  });

  // TEST 6: Invalid advanced output → Rejected → fallback
  it('TEST 6: Corrupted/NaN coordinates from advanced tier are rejected and fallback is engaged', async () => {
    const tier3: ICapabilityTierDefinition<PipelineContext, VideoInput, FramingOutput> = {
      tier: 'tier3_advanced',
      name: 'Tier 3 Buggy Model',
      timeoutMs: 50,
      isAvailable: () => true,
      isCompatible: () => true,
      execute: () => ({ panX: NaN, panY: -Infinity, scale: 0, mode: 'corrupt', isSourceProtected: false }),
      validateOutput: (out) => Number.isFinite(out.panX) && Number.isFinite(out.panY) && out.scale > 0,
    };

    const tier1: ICapabilityTierDefinition<PipelineContext, VideoInput, FramingOutput> = {
      tier: 'tier1_baseline',
      name: 'Tier 1 Center Crop',
      timeoutMs: 20,
      isAvailable: () => true,
      isCompatible: () => true,
      execute: () => ({ panX: 0, panY: 0, scale: 1.08, mode: 'tier-1-fallback', isSourceProtected: false }),
    };

    const resolver = new OMSCapabilityResolver([tier3, tier1]);
    const res = await resolver.resolve(
      { gpuAvailable: true, wasmLoaded: true, canvasAvailable: true },
      { videoElement: null, aspectRatio: '1.90:1', hasSubtitles: false },
      safeBaselineDefault
    );

    expect(res.executedTier).toBe('tier1_baseline');
    expect(res.result.mode).toBe('tier-1-fallback');
    expect(res.result.panX).toBe(0);
  });

  // TEST 7: All implementations fail → Safe diagnostic state
  it('TEST 7: Catastrophic total pipeline failure defaults cleanly to Original Directorial Aspect Ratio', async () => {
    const tier3: ICapabilityTierDefinition<PipelineContext, VideoInput, FramingOutput> = {
      tier: 'tier3_advanced',
      name: 'Tier 3 Model',
      timeoutMs: 10,
      isAvailable: () => true,
      isCompatible: () => true,
      execute: () => {
        throw new Error('Fatal 1');
      },
    };

    const tier2: ICapabilityTierDefinition<PipelineContext, VideoInput, FramingOutput> = {
      tier: 'tier2_enhanced',
      name: 'Tier 2 Canvas',
      timeoutMs: 10,
      isAvailable: () => true,
      isCompatible: () => true,
      execute: () => {
        throw new Error('Fatal 2');
      },
    };

    const tier1: ICapabilityTierDefinition<PipelineContext, VideoInput, FramingOutput> = {
      tier: 'tier1_baseline',
      name: 'Tier 1 Baseline',
      timeoutMs: 10,
      isAvailable: () => true,
      isCompatible: () => true,
      execute: () => {
        throw new Error('Fatal 3');
      },
    };

    const resolver = new OMSCapabilityResolver([tier3, tier2, tier1]);
    const res = await resolver.resolve(
      { gpuAvailable: true, wasmLoaded: true, canvasAvailable: true },
      { videoElement: null, aspectRatio: '1.43:1', hasSubtitles: false },
      safeBaselineDefault
    );

    expect(res.executedTier).toBe('original_source');
    expect(res.result.mode).toBe('safe-baseline-original-directorial');
    expect(res.result.scale).toBe(1.0);
    expect(res.result.isSourceProtected).toBe(true);
  });
});
