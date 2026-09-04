/**
 * audioIntelligence.ts - E9/E10: Meaningful Audio Perception & Dynamic Clarity Service
 * Analyzes real-time Web Audio API spectrum data and provides smooth dialogue clarity guidance.
 * Zero marketing gimmicks, zero fake 3D effects, 100% deterministic DSP safety.
 */

import { IAudioPerceptionProvider, IAudioPerceptionEvidence } from '../oms/interfaces';
import { PerceptionNormalizer, NullAudioPerceptionProvider } from '../oms/perceptionNormalizer';

export class AudioIntelligenceService {
  private provider: IAudioPerceptionProvider;
  private smoothedClarityBoost = 0;
  private readonly SMOOTHING_FACTOR = 0.12; // Gradual transitions to prevent audible pumping

  constructor(provider?: IAudioPerceptionProvider) {
    this.provider = provider || new NullAudioPerceptionProvider();
  }

  public setProvider(provider: IAudioPerceptionProvider): void {
    this.provider = provider;
  }

  /**
   * Evaluates active audio spectrum and computes smoothed dialogue boost recommendation
   */
  public processSpectrum(spectrumData: Uint8Array, timestamp: number): {
    evidence: IAudioPerceptionEvidence;
    appliedClarityBoost: number;
    dialogueDetected: boolean;
  } {
    const evidence = this.provider.analyze(spectrumData, timestamp);

    // Apply temporal smoothing to clarity boost recommendation
    const targetBoost = evidence.recommendedClarityBoost;
    this.smoothedClarityBoost += (targetBoost - this.smoothedClarityBoost) * this.SMOOTHING_FACTOR;

    const dialogueDetected = evidence.dialogue.speechLikelihood > 0.45;

    return {
      evidence,
      appliedClarityBoost: Math.max(0, Math.min(1, this.smoothedClarityBoost)),
      dialogueDetected,
    };
  }

  public reset(): void {
    this.smoothedClarityBoost = 0;
  }
}
