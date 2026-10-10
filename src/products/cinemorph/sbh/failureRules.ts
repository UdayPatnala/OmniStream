/**
 * failureRules.ts - OMS-SBH Explicit Invariants, Failure Rules & Escalation Hierarchy
 * Normative error recovery and diagnostic contract (Sections 1–46)
 */

import { OMSProjectionState } from './geometryTypes';
import { createDeterministicFallbackState } from './geometrySolver';
import { validateOMSGeometry } from './geometryValidator';

export type OMSFailureSeverity = 'soft' | 'hard';

/** Structured diagnostic record (Section 40) */
export interface OMSFailure {
  code: string;
  severity: OMSFailureSeverity;
  subsystem: string;
  generation: number;
  timestamp: number;
  invariant: string;
  description: string;
  recovery: string;
}

/** 5-tier escalation hierarchy (Section 36) */
export const OMSEscalationLevel = {
  LEVEL_0_INTELLIGENT: 0,
  LEVEL_1_CONSERVATIVE: 1,
  LEVEL_2_DETERMINISTIC: 2,
  LEVEL_3_LAST_KNOWN_VALID: 3,
  LEVEL_4_SAFE_BASELINE: 4,
} as const;

export type OMSEscalationLevel = typeof OMSEscalationLevel[keyof typeof OMSEscalationLevel];

export class OMSFailureRecoveryManager {
  private lastKnownValidState: OMSProjectionState | null = null;
  private failureLog: OMSFailure[] = [];
  private fallbackUsed: boolean = false;

  /**
   * Commits a state as the last known valid state after verification
   */
  public commitValidState(state: OMSProjectionState): void {
    this.lastKnownValidState = { ...state };
    this.fallbackUsed = false;
  }

  public wasFallbackUsed(): boolean {
    return this.fallbackUsed;
  }

  public getFailureLog(): readonly OMSFailure[] {
    return this.failureLog;
  }

  public recordFailure(failure: OMSFailure): void {
    this.failureLog.push(failure);
    if (this.failureLog.length > 50) {
      this.failureLog.shift();
    }
  }

  /**
   * Executes the normative 5-tier escalation recovery hierarchy (Section 36)
   */
  public escalateAndRecover(
    candidateState: OMSProjectionState | null,
    sourceAspect: number = 16 / 9,
    generation: number = 0,
    causeDescription: string = 'Geometry validation failed'
  ): { state: OMSProjectionState; level: OMSEscalationLevel } {
    this.fallbackUsed = true;

    // LEVEL 0 -> LEVEL 1: Check candidate with validation
    if (candidateState) {
      const validation = validateOMSGeometry(candidateState);
      if (validation.valid) {
        return { state: candidateState, level: OMSEscalationLevel.LEVEL_0_INTELLIGENT };
      }

      this.recordFailure({
        code: validation.errors[0]?.code || 'OMS-INV-FAIL',
        severity: 'soft',
        subsystem: 'Geometry/Harmonization',
        generation,
        timestamp: Date.now(),
        invariant: 'Candidate geometry validation',
        description: causeDescription,
        recovery: 'Escalating to deterministic fallback',
      });
    }

    // LEVEL 2: Pure deterministic fallback
    const deterministicFallback = createDeterministicFallbackState(sourceAspect, generation);
    const detValidation = validateOMSGeometry(deterministicFallback);
    if (detValidation.valid) {
      return { state: deterministicFallback, level: OMSEscalationLevel.LEVEL_2_DETERMINISTIC };
    }

    // LEVEL 3: Last known valid state
    if (this.lastKnownValidState) {
      const lkvValidation = validateOMSGeometry(this.lastKnownValidState);
      if (lkvValidation.valid) {
        this.recordFailure({
          code: 'OMS-REC-LKV',
          severity: 'hard',
          subsystem: 'Harmonizer',
          generation,
          timestamp: Date.now(),
          invariant: 'Deterministic fallback failed',
          description: 'Restoring last known valid state',
          recovery: 'Last Known Valid State',
        });
        return { state: this.lastKnownValidState, level: OMSEscalationLevel.LEVEL_3_LAST_KNOWN_VALID };
      }
    }

    // LEVEL 4: Safe baseline state (Absolute Floor)
    const baseline = createDeterministicFallbackState(16 / 9, generation);
    this.recordFailure({
      code: 'OMS-REC-BASELINE',
      severity: 'hard',
      subsystem: 'Harmonizer',
      generation,
      timestamp: Date.now(),
      invariant: 'All intermediate fallbacks exhausted',
      description: 'Restoring safe baseline theater state',
      recovery: 'Safe Baseline',
    });
    return { state: baseline, level: OMSEscalationLevel.LEVEL_4_SAFE_BASELINE };
  }
}

export const omsFailureRecoveryManager = new OMSFailureRecoveryManager();
