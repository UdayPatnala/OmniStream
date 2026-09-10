/**
 * perceptionNormalizer.ts - OMS Perception Normalization & Fallback Guard
 * Enforces strictly bounded, normalized coordinates and safe deterministic fallbacks.
 */

import {
  IVisualPerceptionEvidence,
  IVisualSubjectCandidate,
  IVisualPerceptionProvider,
  IAudioPerceptionEvidence,
  IAudioPerceptionProvider,
} from './interfaces';

export class PerceptionNormalizer {
  /**
   * Validates and sanitizes raw visual candidates into normalized visual evidence
   */
  public static normalizeVisual(
    rawCandidates: Partial<IVisualSubjectCandidate>[],
    timestamp: number,
    latencyMs = 0,
    source: 'enhanced_ml' | 'classical_cv' | 'safe_fallback' = 'enhanced_ml'
  ): IVisualPerceptionEvidence {
    const validCandidates: IVisualSubjectCandidate[] = [];

    for (let i = 0; i < rawCandidates.length; i++) {
      const c = rawCandidates[i];
      if (!c || !c.box) continue;

      const rawX = Number(c.box.x);
      const rawY = Number(c.box.y);
      const rawW = Number(c.box.width);
      const rawH = Number(c.box.height);
      const rawConf = Number(c.confidence ?? 1.0);

      // Rejection of non-finite numbers
      if (!Number.isFinite(rawX) || !Number.isFinite(rawY) || !Number.isFinite(rawW) || !Number.isFinite(rawH) || !Number.isFinite(rawConf)) {
        continue;
      }

      // Rejection of non-positive dimensions
      if (rawW <= 0 || rawH <= 0) {
        continue;
      }

      // Clamp geometry strictly to [0, 1]
      const clampedX = Math.max(0, Math.min(1, rawX));
      const clampedY = Math.max(0, Math.min(1, rawY));
      const clampedW = Math.max(0.001, Math.min(1 - clampedX, rawW));
      const clampedH = Math.max(0.001, Math.min(1 - clampedY, rawH));
      const clampedConf = Math.max(0, Math.min(1, rawConf));

      // Keypoints sanitization if present
      const validKeypoints: Array<{ x: number; y: number; name?: string }> = [];
      if (Array.isArray(c.keypoints)) {
        for (const kp of c.keypoints) {
          const kx = Number(kp.x);
          const ky = Number(kp.y);
          if (Number.isFinite(kx) && Number.isFinite(ky)) {
            validKeypoints.push({
              x: Math.max(0, Math.min(1, kx)),
              y: Math.max(0, Math.min(1, ky)),
              name: kp.name,
            });
          }
        }
      }

      validCandidates.push({
        id: c.id || `candidate_${i}`,
        box: {
          x: clampedX,
          y: clampedY,
          width: clampedW,
          height: clampedH,
        },
        confidence: clampedConf,
        type: c.type || 'face',
        keypoints: validKeypoints.length > 0 ? validKeypoints : undefined,
      });
    }

    if (validCandidates.length === 0) {
      return {
        timestamp,
        status: 'NO_SUBJECTS',
        candidates: [],
        primarySubject: null,
        focalCenter: { x: 0.5, y: 0.5 },
        confidence: 0,
        latencyMs: Math.max(0, latencyMs),
        source,
      };
    }

    // Sort descending by confidence * area
    validCandidates.sort((a, b) => {
      const areaA = a.box.width * a.box.height;
      const areaB = b.box.width * b.box.height;
      return (b.confidence * areaB) - (a.confidence * areaA);
    });

    const primary = validCandidates[0];
    const focalCenter = {
      x: primary.box.x + primary.box.width / 2,
      y: primary.box.y + primary.box.height / 2,
    };

    return {
      timestamp,
      status: 'AVAILABLE',
      candidates: validCandidates,
      primarySubject: primary,
      focalCenter,
      confidence: primary.confidence,
      latencyMs: Math.max(0, latencyMs),
      source,
    };
  }

  /**
   * Validates and sanitizes raw audio metrics into normalized audio perception evidence
   */
  public static normalizeAudio(
    spectrumData: Uint8Array | null | undefined,
    timestamp: number,
    latencyMs = 0,
    source: 'enhanced_ml' | 'webaudio_analyser' | 'safe_fallback' = 'webaudio_analyser'
  ): IAudioPerceptionEvidence {
    if (!spectrumData || spectrumData.length === 0) {
      return {
        timestamp,
        status: 'NO_SIGNAL',
        dialogue: {
          speechLikelihood: 0,
          clarityDeficit: 0,
          energyDb: -100,
          spectralCentroid: 0,
        },
        acousticEnvironment: 'silent',
        recommendedClarityBoost: 0,
        latencyMs: Math.max(0, latencyMs),
        source,
      };
    }

    // Calculate energy and spectral distribution across human speech bands (300Hz - 3400Hz)
    let totalEnergy = 0;
    let weightedFrequencySum = 0;
    const len = spectrumData.length;

    // Speech band is approximately bins 2 to 7 in a 16-bin / 32-bin FFT spectrum
    const speechStartBin = Math.max(1, Math.floor(len * 0.08));
    const speechEndBin = Math.min(len - 1, Math.floor(len * 0.45));
    let speechBandEnergy = 0;

    for (let i = 0; i < len; i++) {
      const val = spectrumData[i];
      totalEnergy += val;
      weightedFrequencySum += val * (i + 1);

      if (i >= speechStartBin && i <= speechEndBin) {
        speechBandEnergy += val;
      }
    }

    const avgEnergy = totalEnergy / len;
    const speechRatio = totalEnergy > 0 ? speechBandEnergy / totalEnergy : 0;
    const spectralCentroid = totalEnergy > 0 ? (weightedFrequencySum / totalEnergy) * 250 : 0;

    // Speech likelihood estimation based on mid-frequency concentration
    const speechLikelihood = Math.max(0, Math.min(1, speechRatio * 1.6));
    const clarityDeficit = speechLikelihood > 0.35 ? Math.max(0.25, Math.min(1, 1.0 - speechRatio * 0.4)) : 0;
    const recommendedClarityBoost = Math.max(0, Math.min(1, clarityDeficit * speechLikelihood));

    let acousticEnvironment: 'dialogue' | 'music' | 'mixed' | 'ambient' | 'silent' = 'ambient';
    if (avgEnergy < 2) {
      acousticEnvironment = 'silent';
    } else if (speechLikelihood > 0.65) {
      acousticEnvironment = 'dialogue';
    } else if (speechLikelihood < 0.25 && avgEnergy > 30) {
      acousticEnvironment = 'music';
    } else if (speechLikelihood >= 0.25 && speechLikelihood <= 0.65) {
      acousticEnvironment = 'mixed';
    }

    const energyDb = avgEnergy > 0 ? Math.max(-100, Math.min(0, 20 * Math.log10(avgEnergy / 255))) : -100;

    return {
      timestamp,
      status: 'AVAILABLE',
      dialogue: {
        speechLikelihood,
        clarityDeficit,
        energyDb,
        spectralCentroid,
      },
      acousticEnvironment,
      recommendedClarityBoost,
      latencyMs: Math.max(0, latencyMs),
      source,
    };
  }
}

/**
 * Deterministic Null Visual Perception Provider (Zero ML, 100% Safe Baseline)
 */
export class NullVisualPerceptionProvider implements IVisualPerceptionProvider {
  public readonly id = 'null_visual_perception';
  public readonly name = 'Null Visual Perception Provider';
  public readonly version = '1.0.0';

  public async initialize(): Promise<boolean> {
    return true;
  }

  public async processFrame(
    _frame: ImageBitmap | HTMLVideoElement | HTMLCanvasElement,
    timestamp: number
  ): Promise<IVisualPerceptionEvidence> {
    return PerceptionNormalizer.normalizeVisual([], timestamp, 0, 'safe_fallback');
  }

  public isAvailable(): boolean {
    return true;
  }

  public dispose(): void {
    // No-op
  }
}

/**
 * Deterministic Null Audio Perception Provider (Zero ML, 100% Safe Baseline)
 */
export class NullAudioPerceptionProvider implements IAudioPerceptionProvider {
  public readonly id = 'null_audio_perception';
  public readonly name = 'Null Audio Perception Provider';
  public readonly version = '1.0.0';

  public async initialize(_context: AudioContext, _sourceNode?: AudioNode): Promise<boolean> {
    return true;
  }

  public analyze(spectrumData: Uint8Array, timestamp: number): IAudioPerceptionEvidence {
    return PerceptionNormalizer.normalizeAudio(spectrumData, timestamp, 0, 'safe_fallback');
  }

  public isAvailable(): boolean {
    return true;
  }

  public dispose(): void {
    // No-op
  }
}
