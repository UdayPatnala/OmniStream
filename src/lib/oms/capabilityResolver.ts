import { FallbackTier, IRuntimeExecutionResult } from './interfaces';

export type CapabilityFailureType =
  | 'UNAVAILABLE'           // Hardware / Model / Dependency not present
  | 'INCOMPATIBLE'          // Media format or dimensions unsupported
  | 'EXECUTION_TIMEOUT'     // Execution exceeded allotted time budget
  | 'RUNTIME_ERROR'         // Exception thrown or NaN / invalid output produced
  | 'CRITICAL_SYSTEM_ERROR'; // Underlying media or storage unrecoverable

export interface ICapabilityTierDefinition<TContext, TInput, TOutput> {
  tier: FallbackTier;
  name: string;
  timeoutMs: number;
  /** Check if prerequisites (hardware, wasm, worker, model weights) are available */
  isAvailable: (context: TContext) => boolean;
  /** Check if the specific input (e.g. video dimensions, audio codec) is compatible */
  isCompatible: (context: TContext, input: TInput) => boolean;
  /** Execute the capability */
  execute: (context: TContext, input: TInput) => Promise<TOutput> | TOutput;
  /** Validate the output (e.g. verify finite coordinates, non-empty bounds) */
  validateOutput?: (output: TOutput) => boolean;
}

export interface IResolutionDiagnostic {
  tier: FallbackTier;
  name: string;
  status: 'SKIPPED_UNAVAILABLE' | 'SKIPPED_INCOMPATIBLE' | 'EXECUTED_SUCCESS' | 'FAILED';
  failureType?: CapabilityFailureType;
  errorMessage?: string;
  latencyMs: number;
}

/**
 * Structured Capability Resolver
 * Evaluates capability availability, pre-flight compatibility, and failure classification
 * without nested try-catch anti-patterns.
 */
export class OMSCapabilityResolver<TContext, TInput, TOutput> {
  private tiers: ICapabilityTierDefinition<TContext, TInput, TOutput>[] = [];
  private onDiagnosticEvent?: (diagnostics: IResolutionDiagnostic[]) => void;

  constructor(
    tiers: ICapabilityTierDefinition<TContext, TInput, TOutput>[],
    onDiagnosticEvent?: (diagnostics: IResolutionDiagnostic[]) => void
  ) {
    this.tiers = tiers;
    this.onDiagnosticEvent = onDiagnosticEvent;
  }

  public async resolve(
    context: TContext,
    input: TInput,
    safeBaselineOutput: TOutput
  ): Promise<IRuntimeExecutionResult<TOutput>> {
    const overallStartTime = performance.now();
    const diagnostics: IResolutionDiagnostic[] = [];

    for (let i = 0; i < this.tiers.length; i++) {
      const tierDef = this.tiers[i];
      const tierStart = performance.now();

      // 1. Availability Pre-flight Check
      if (!tierDef.isAvailable(context)) {
        diagnostics.push({
          tier: tierDef.tier,
          name: tierDef.name,
          status: 'SKIPPED_UNAVAILABLE',
          failureType: 'UNAVAILABLE',
          errorMessage: 'Hardware or dependency requirement not met',
          latencyMs: 0,
        });
        continue;
      }

      // 2. Compatibility Pre-flight Check
      if (!tierDef.isCompatible(context, input)) {
        diagnostics.push({
          tier: tierDef.tier,
          name: tierDef.name,
          status: 'SKIPPED_INCOMPATIBLE',
          failureType: 'INCOMPATIBLE',
          errorMessage: 'Input format or dimension incompatible with capability',
          latencyMs: 0,
        });
        continue;
      }

      // 3. Execution with Timeout Budget
      try {
        const output = await this.executeWithBudget(tierDef, context, input);
        const stageLatency = Number((performance.now() - tierStart).toFixed(2));

        // 4. Output Validation Guard
        if (tierDef.validateOutput && !tierDef.validateOutput(output)) {
          diagnostics.push({
            tier: tierDef.tier,
            name: tierDef.name,
            status: 'FAILED',
            failureType: 'RUNTIME_ERROR',
            errorMessage: 'Output validation check failed (invalid data or coordinates)',
            latencyMs: stageLatency,
          });
          continue;
        }

        diagnostics.push({
          tier: tierDef.tier,
          name: tierDef.name,
          status: 'EXECUTED_SUCCESS',
          latencyMs: stageLatency,
        });

        if (this.onDiagnosticEvent) {
          this.onDiagnosticEvent(diagnostics);
        }

        const totalLatency = Number((performance.now() - overallStartTime).toFixed(2));
        const fallbackOccurred = i > 0;

        return {
          result: output,
          executedTier: tierDef.tier,
          fallbackOccurred,
          fallbackReason: fallbackOccurred
            ? `Selected ${tierDef.name} after prior tiers were unavailable/incompatible`
            : undefined,
          latencyMs: totalLatency,
          confidence: tierDef.tier === 'tier3_advanced' ? 0.98 : tierDef.tier === 'tier2_enhanced' ? 0.90 : 0.80,
        };
      } catch (err: any) {
        const stageLatency = Number((performance.now() - tierStart).toFixed(2));
        const isTimeout = err?.message?.includes('Timeout');
        diagnostics.push({
          tier: tierDef.tier,
          name: tierDef.name,
          status: 'FAILED',
          failureType: isTimeout ? 'EXECUTION_TIMEOUT' : 'RUNTIME_ERROR',
          errorMessage: err?.message || 'Execution exception',
          latencyMs: stageLatency,
        });
        continue;
      }
    }

    // All tiers failed or were skipped -> Safe Baseline Fallback
    const totalLatency = Number((performance.now() - overallStartTime).toFixed(2));
    diagnostics.push({
      tier: 'original_source',
      name: 'Safe Baseline Fallback',
      status: 'EXECUTED_SUCCESS',
      latencyMs: totalLatency,
    });

    if (this.onDiagnosticEvent) {
      this.onDiagnosticEvent(diagnostics);
    }

    return {
      result: safeBaselineOutput,
      executedTier: 'original_source',
      fallbackOccurred: true,
      fallbackReason: 'All capability tiers were unavailable or failed. Using safe baseline fallback.',
      latencyMs: totalLatency,
      confidence: 0.5,
    };
  }

  private executeWithBudget(
    tierDef: ICapabilityTierDefinition<TContext, TInput, TOutput>,
    context: TContext,
    input: TInput
  ): Promise<TOutput> {
    if (tierDef.timeoutMs <= 0) {
      return Promise.resolve(tierDef.execute(context, input));
    }

    return new Promise<TOutput>((resolve, reject) => {
      let isSettled = false;

      const timer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          reject(new Error(`Timeout: ${tierDef.name} exceeded ${tierDef.timeoutMs}ms budget`));
        }
      }, tierDef.timeoutMs);

      Promise.resolve(tierDef.execute(context, input))
        .then((res) => {
          if (!isSettled) {
            isSettled = true;
            clearTimeout(timer);
            resolve(res);
          }
        })
        .catch((err) => {
          if (!isSettled) {
            isSettled = true;
            clearTimeout(timer);
            reject(err);
          }
        });
    });
  }
}
