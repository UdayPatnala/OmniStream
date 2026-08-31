import { describe, it, expect, vi } from 'vitest';
import { OMSCapabilityResolver, ICapabilityTierDefinition, IResolutionDiagnostic } from '../../lib/oms/capabilityResolver';

describe('Tier 1: OMS Capability Resolver & Structured Fallback Engine', () => {
  interface MockContext {
    hasGpu: boolean;
    hasWasm: boolean;
  }

  interface MockInput {
    videoWidth: number;
    videoHeight: number;
    codec: string;
  }

  interface MockOutput {
    panX: number;
    panY: number;
    mode: string;
  }

  const safeBaseline: MockOutput = {
    panX: 0,
    panY: 0,
    mode: 'safe-baseline-center',
  };

  it('T1-CR-01: executes Tier 3 when available, compatible, and successful', async () => {
    const tier3: ICapabilityTierDefinition<MockContext, MockInput, MockOutput> = {
      tier: 'tier3_advanced',
      name: 'Tier 3 AI Smart Pan',
      timeoutMs: 50,
      isAvailable: (ctx) => ctx.hasGpu,
      isCompatible: (_ctx, inp) => inp.videoWidth >= 720,
      execute: async () => ({ panX: 0.35, panY: 0.1, mode: 'tier-3-ai' }),
      validateOutput: (out) => Number.isFinite(out.panX) && Number.isFinite(out.panY),
    };

    const resolver = new OMSCapabilityResolver([tier3]);
    const res = await resolver.resolve({ hasGpu: true, hasWasm: true }, { videoWidth: 1920, videoHeight: 1080, codec: 'h264' }, safeBaseline);

    expect(res.executedTier).toBe('tier3_advanced');
    expect(res.fallbackOccurred).toBe(false);
    expect(res.result.mode).toBe('tier-3-ai');
    expect(res.result.panX).toBe(0.35);
  });

  it('T1-CR-02: skips Tier 3 via pre-flight availability check and executes Tier 2 without throw', async () => {
    let tier3Executed = false;

    const tier3: ICapabilityTierDefinition<MockContext, MockInput, MockOutput> = {
      tier: 'tier3_advanced',
      name: 'Tier 3 AI Smart Pan',
      timeoutMs: 50,
      isAvailable: (ctx) => ctx.hasGpu, // False in this test
      isCompatible: () => true,
      execute: async () => {
        tier3Executed = true;
        return { panX: 0.5, panY: 0.5, mode: 'tier-3' };
      },
    };

    const tier2: ICapabilityTierDefinition<MockContext, MockInput, MockOutput> = {
      tier: 'tier2_enhanced',
      name: 'Tier 2 Saliency Heuristic',
      timeoutMs: 50,
      isAvailable: () => true,
      isCompatible: () => true,
      execute: () => ({ panX: 0.2, panY: 0.0, mode: 'tier-2-saliency' }),
    };

    const diagnostics: IResolutionDiagnostic[] = [];
    const resolver = new OMSCapabilityResolver([tier3, tier2], (diag) => diagnostics.push(...diag));

    const res = await resolver.resolve({ hasGpu: false, hasWasm: true }, { videoWidth: 1920, videoHeight: 1080, codec: 'h264' }, safeBaseline);

    expect(tier3Executed).toBe(false);
    expect(res.executedTier).toBe('tier2_enhanced');
    expect(res.fallbackOccurred).toBe(true);
    expect(res.result.mode).toBe('tier-2-saliency');
    expect(diagnostics.some((d) => d.status === 'SKIPPED_UNAVAILABLE')).toBe(true);
  });

  it('T1-CR-03: skips Tier 3 on input incompatibility and executes Tier 2', async () => {
    const tier3: ICapabilityTierDefinition<MockContext, MockInput, MockOutput> = {
      tier: 'tier3_advanced',
      name: 'Tier 3 4K Specialist Vision',
      timeoutMs: 50,
      isAvailable: () => true,
      isCompatible: (_ctx, inp) => inp.videoWidth >= 3840, // 4K only
      execute: () => ({ panX: 0.4, panY: 0.2, mode: 'tier-3' }),
    };

    const tier2: ICapabilityTierDefinition<MockContext, MockInput, MockOutput> = {
      tier: 'tier2_enhanced',
      name: 'Tier 2 General Saliency',
      timeoutMs: 50,
      isAvailable: () => true,
      isCompatible: () => true,
      execute: () => ({ panX: 0.15, panY: 0.05, mode: 'tier-2' }),
    };

    const diagnostics: IResolutionDiagnostic[] = [];
    const resolver = new OMSCapabilityResolver([tier3, tier2], (diag) => diagnostics.push(...diag));

    // Pass 1080p video
    const res = await resolver.resolve({ hasGpu: true, hasWasm: true }, { videoWidth: 1920, videoHeight: 1080, codec: 'h264' }, safeBaseline);

    expect(res.executedTier).toBe('tier2_enhanced');
    expect(diagnostics.some((d) => d.status === 'SKIPPED_INCOMPATIBLE')).toBe(true);
  });

  it('T1-CR-04: catches runtime exceptions in Tier 3 and cleanly falls back to Tier 2', async () => {
    const tier3: ICapabilityTierDefinition<MockContext, MockInput, MockOutput> = {
      tier: 'tier3_advanced',
      name: 'Tier 3 Crashing Model',
      timeoutMs: 100,
      isAvailable: () => true,
      isCompatible: () => true,
      execute: () => {
        throw new Error('WASM Out of Memory');
      },
    };

    const tier2: ICapabilityTierDefinition<MockContext, MockInput, MockOutput> = {
      tier: 'tier2_enhanced',
      name: 'Tier 2 Safe Heuristic',
      timeoutMs: 50,
      isAvailable: () => true,
      isCompatible: () => true,
      execute: () => ({ panX: 0.1, panY: 0.0, mode: 'tier-2-recovered' }),
    };

    const diagnostics: IResolutionDiagnostic[] = [];
    const resolver = new OMSCapabilityResolver([tier3, tier2], (diag) => diagnostics.push(...diag));

    const res = await resolver.resolve({ hasGpu: true, hasWasm: true }, { videoWidth: 1920, videoHeight: 1080, codec: 'h264' }, safeBaseline);

    expect(res.executedTier).toBe('tier2_enhanced');
    expect(res.result.mode).toBe('tier-2-recovered');
    const failedDiag = diagnostics.find((d) => d.failureType === 'RUNTIME_ERROR');
    expect(failedDiag).toBeDefined();
    expect(failedDiag?.errorMessage).toBe('WASM Out of Memory');
  });

  it('T1-CR-05: aborts execution on budget timeout and classifies as EXECUTION_TIMEOUT', async () => {
    const tier3: ICapabilityTierDefinition<MockContext, MockInput, MockOutput> = {
      tier: 'tier3_advanced',
      name: 'Tier 3 Slow Model',
      timeoutMs: 20, // 20ms limit
      isAvailable: () => true,
      isCompatible: () => true,
      execute: () => new Promise((resolve) => setTimeout(() => resolve({ panX: 0.5, panY: 0.5, mode: 'slow' }), 100)),
    };

    const tier1: ICapabilityTierDefinition<MockContext, MockInput, MockOutput> = {
      tier: 'tier1_baseline',
      name: 'Tier 1 Center Crop',
      timeoutMs: 50,
      isAvailable: () => true,
      isCompatible: () => true,
      execute: () => ({ panX: 0, panY: 0, mode: 'tier-1-instant' }),
    };

    const diagnostics: IResolutionDiagnostic[] = [];
    const resolver = new OMSCapabilityResolver([tier3, tier1], (diag) => diagnostics.push(...diag));

    const res = await resolver.resolve({ hasGpu: true, hasWasm: true }, { videoWidth: 1920, videoHeight: 1080, codec: 'h264' }, safeBaseline);

    expect(res.executedTier).toBe('tier1_baseline');
    expect(res.result.mode).toBe('tier-1-instant');
    const timeoutDiag = diagnostics.find((d) => d.failureType === 'EXECUTION_TIMEOUT');
    expect(timeoutDiag).toBeDefined();
  });

  it('T1-CR-06: rejects NaN outputs via output validation and falls back to safe baseline', async () => {
    const tier3: ICapabilityTierDefinition<MockContext, MockInput, MockOutput> = {
      tier: 'tier3_advanced',
      name: 'Tier 3 Corrupt Math',
      timeoutMs: 50,
      isAvailable: () => true,
      isCompatible: () => true,
      execute: () => ({ panX: NaN, panY: Infinity, mode: 'corrupt' }),
      validateOutput: (out) => Number.isFinite(out.panX) && Number.isFinite(out.panY),
    };

    const resolver = new OMSCapabilityResolver([tier3]);
    const res = await resolver.resolve({ hasGpu: true, hasWasm: true }, { videoWidth: 1920, videoHeight: 1080, codec: 'h264' }, safeBaseline);

    expect(res.executedTier).toBe('original_source');
    expect(res.result.mode).toBe('safe-baseline-center');
    expect(res.result.panX).toBe(0);
  });
});
