/**
 * generationContract.ts - OMS-SBH Unified Generation & Freshness Contract
 * Single authoritative source of truth for concurrency, freshness, and state coherence (Sections 1–34)
 */

export type OMSGeneration = number;

/** Unified asynchronous payload wrapper (Section 5, 16) */
export interface OMSAsyncResult<T> {
  generation: OMSGeneration;
  result: T;
  mediaTime?: number;
  operationId?: string;
  timestamp: number;
}

/** Diagnostic for discarded stale results (Section 26) */
export interface OMSStaleResultDiagnostic {
  code: 'OMS_STALE_RESULT';
  resultGeneration: number;
  currentGeneration: number;
  subsystem: string;
  reason: string;
  timestamp: number;
}

/**
 * Single Authoritative OMS-SBH Generation Manager (Sections 2, 30)
 */
export class OMSGenerationManager {
  private currentGeneration: OMSGeneration = 1;
  private operationCounter: number = 0;
  private staleDiagnosticLog: OMSStaleResultDiagnostic[] = [];

  /**
   * Returns the single authoritative active spatial generation
   */
  public getCurrentGeneration(): OMSGeneration {
    return this.currentGeneration;
  }

  /**
   * Creates a new generation when context changes (Section 3)
   */
  public nextGeneration(reason: string): OMSGeneration {
    this.currentGeneration += 1;
    return this.currentGeneration;
  }

  /**
   * Generates unique operation ID within the current generation (Section 14)
   */
  public createOperationId(subsystem: string): string {
    this.operationCounter += 1;
    return `op_${subsystem}_${this.currentGeneration}_${this.operationCounter}`;
  }

  /**
   * Unified Acceptance Function (Section 31)
   */
  public isCurrentGeneration(generation: number): boolean {
    return generation === this.currentGeneration;
  }

  /**
   * Validates whether an async result is fresh and eligible for commit (Sections 5, 6, 16)
   */
  public validateFreshness<T>(
    asyncResult: OMSAsyncResult<T>,
    subsystem: string,
    currentMediaTime?: number,
    timeToleranceSec: number = 2.0
  ): boolean {
    // 1. Generation check: must match currentGeneration exactly
    if (asyncResult.generation !== this.currentGeneration) {
      this.recordStaleDiscard(
        asyncResult.generation,
        subsystem,
        `Generation mismatch (result: G${asyncResult.generation} vs current: G${this.currentGeneration})`
      );
      return false;
    }

    // 2. Playback timestamp check if mediaTime is provided (Section 16)
    if (
      typeof asyncResult.mediaTime === 'number' &&
      typeof currentMediaTime === 'number' &&
      currentMediaTime >= 0
    ) {
      const timeDelta = Math.abs(asyncResult.mediaTime - currentMediaTime);
      if (timeDelta > timeToleranceSec) {
        this.recordStaleDiscard(
          asyncResult.generation,
          subsystem,
          `Media timestamp drift exceeds tolerance (Δt: ${timeDelta.toFixed(2)}s > ${timeToleranceSec}s)`
        );
        return false;
      }
    }

    return true;
  }

  private recordStaleDiscard(
    resultGeneration: number,
    subsystem: string,
    reason: string
  ): void {
    const diagnostic: OMSStaleResultDiagnostic = {
      code: 'OMS_STALE_RESULT',
      resultGeneration,
      currentGeneration: this.currentGeneration,
      subsystem,
      reason,
      timestamp: Date.now(),
    };

    this.staleDiagnosticLog.push(diagnostic);
    if (this.staleDiagnosticLog.length > 50) {
      this.staleDiagnosticLog.shift();
    }
  }

  public getStaleDiagnostics(): readonly OMSStaleResultDiagnostic[] {
    return this.staleDiagnosticLog;
  }
}

export const omsGenerationManager = new OMSGenerationManager();
