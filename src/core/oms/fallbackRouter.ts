import { FallbackTier, IFallbackStage, IRuntimeExecutionResult } from './interfaces';

/**
 * OMS Fallback Router
 * Multi-Tier Capability Orchestration & Graceful Runtime Fallback
 * Level 1 (Silent Recovery) -> Level 2 (Diagnostic Log) -> Level 3 (Safe Fallback)
 */
export class OMSFallbackRouter<TInput, TOutput> {
  private stages: IFallbackStage<TInput, TOutput>[] = [];
  private onTelemetryNotification?: (tier: FallbackTier, reason: string, latencyMs: number) => void;

  constructor(
    stages: IFallbackStage<TInput, TOutput>[],
    onTelemetryNotification?: (tier: FallbackTier, reason: string, latencyMs: number) => void
  ) {
    this.stages = stages;
    this.onTelemetryNotification = onTelemetryNotification;
  }

  public async execute(input: TInput, defaultOutput: TOutput): Promise<IRuntimeExecutionResult<TOutput>> {
    const overallStartTime = performance.now();

    for (let i = 0; i < this.stages.length; i++) {
      const stage = this.stages[i];
      const stageStart = performance.now();

      try {
        if (!stage.isAvailable()) {
          continue;
        }

        // Execute stage with timeout watchdog
        const result = await this.executeWithTimeout(stage, input);
        const stageLatency = Number((performance.now() - stageStart).toFixed(2));
        const totalLatency = Number((performance.now() - overallStartTime).toFixed(2));

        const fallbackOccurred = i > 0;
        if (fallbackOccurred && this.onTelemetryNotification) {
          this.onTelemetryNotification(stage.tier, `Fell back to ${stage.name}`, totalLatency);
        }

        return {
          result,
          executedTier: stage.tier,
          fallbackOccurred,
          fallbackReason: fallbackOccurred ? `Prior stage unavailable; selected ${stage.name}` : undefined,
          latencyMs: totalLatency,
          confidence: 0.95,
        };
      } catch (err: any) {
        const errorReason = err?.message || 'Execution error';
        console.warn(`[OMSFallbackRouter] ${stage.name} failed (${errorReason}). Falling back to next tier.`);
        continue;
      }
    }

    // Catastrophic Safe Baseline
    const totalLatency = Number((performance.now() - overallStartTime).toFixed(2));
    return {
      result: defaultOutput,
      executedTier: 'original_source',
      fallbackOccurred: true,
      fallbackReason: 'All capability tiers exhausted or timed out. Used safe baseline default.',
      latencyMs: totalLatency,
      confidence: 0.5,
    };
  }

  private executeWithTimeout(stage: IFallbackStage<TInput, TOutput>, input: TInput): Promise<TOutput> {
    if (stage.timeoutMs <= 0) {
      return Promise.resolve(stage.execute(input));
    }

    return new Promise<TOutput>((resolve, reject) => {
      let settled = false;

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new Error(`Timeout: ${stage.name} exceeded ${stage.timeoutMs}ms limit`));
        }
      }, stage.timeoutMs);

      Promise.resolve(stage.execute(input))
        .then((res) => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve(res);
          }
        })
        .catch((err) => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            reject(err);
          }
        });
    });
  }
}
