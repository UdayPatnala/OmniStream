/**
 * posterIntelligence.ts - E5: Cascaded Best Frame & Poster Intelligence Engine
 * Staged Pipeline: Sampling -> Cheap Rejection -> Laplacian Sharpness -> Subject Presence -> Composition -> Final Selection
 */

import { FrameQualityAnalyzer } from '../perception/qualityAnalyzer';
import { IVisualPerceptionProvider, IVisualPerceptionEvidence } from '@omnistream/core/oms/interfaces';
import { NullVisualPerceptionProvider } from '@omnistream/core/oms/perceptionNormalizer';

export interface FrameCandidate {
  timestamp: number;
  canvas: HTMLCanvasElement;
  technicalScore: number; // Laplacian sharpness [0, 1]
  subjectScore: number;   // Facial / human presence score [0, 1]
  compositionScore: number; // Rule of thirds balance [0, 1]
  totalScore: number;
  rejectionReason?: string;
}

export interface BestFrameSelectionResult {
  bestTimestamp: number;
  bestCanvas: HTMLCanvasElement;
  bestImageDataUrl: string;
  totalScore: number;
  evaluatedCandidatesCount: number;
  scoreBreakdown: {
    technicalQuality: number;
    subjectPresence: number;
    composition: number;
  };
  source: 'enhanced_cascade' | 'deterministic_fallback';
}

export class PosterIntelligenceEngine {
  private qualityAnalyzer = new FrameQualityAnalyzer();
  private perceptionProvider: IVisualPerceptionProvider;

  constructor(perceptionProvider?: IVisualPerceptionProvider) {
    this.perceptionProvider = perceptionProvider || new NullVisualPerceptionProvider();
  }

  /**
   * Selects the single most representative frame across the media element
   */
  public async selectBestPosterFrame(
    videoEl: HTMLVideoElement,
    numSamples = 6
  ): Promise<BestFrameSelectionResult> {
    const duration = videoEl.duration || 60;
    const candidates: FrameCandidate[] = [];

    // Avoid beginning (<5%) and ending (>90%) title/credit sequences
    const startTime = duration * 0.08;
    const endTime = duration * 0.88;
    const step = (endTime - startTime) / Math.max(1, numSamples);

    for (let i = 0; i < numSamples; i++) {
      const targetTime = startTime + i * step;
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 180;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx) continue;

      try {
        ctx.drawImage(videoEl, 0, 0, 320, 180);
        const imgData = ctx.getImageData(0, 0, 320, 180);
        const data = imgData.data;

        // 1. Cheap Rejection: Black/white interstitial frames
        let totalLum = 0;
        for (let p = 0; p < data.length; p += 16) {
          totalLum += (data[p] * 0.299 + data[p + 1] * 0.587 + data[p + 2] * 0.114);
        }
        const avgLum = totalLum / (data.length / 16);

        if (avgLum < 12 || avgLum > 240) {
          continue; // Rejected
        }

        // 2. Technical Quality: Laplacian variance sharpness
        const techMetrics = this.qualityAnalyzer.analyzeFrameData(data, 320, 180);
        const rawSharpness = Number(techMetrics.sharpnessScore);
        const technicalScore = Number.isFinite(rawSharpness) ? Math.max(0, Math.min(1, rawSharpness / 100)) : 0.5;

        // 3. Subject Evidence: Visual perception localization
        let subjectScore = 0.5;
        let perception: IVisualPerceptionEvidence | null = null;

        if (this.perceptionProvider.isAvailable()) {
          perception = await this.perceptionProvider.processFrame(canvas, targetTime);
          if (perception.status === 'AVAILABLE' && perception.candidates.length > 0) {
            subjectScore = Math.min(1.0, 0.6 + perception.confidence * 0.4);
          }
        }

        // 4. Composition Score: Rule of thirds alignment
        let compositionScore = 0.5;
        if (perception && perception.primarySubject) {
          const fx = perception.primarySubject.box.x + perception.primarySubject.box.width / 2;
          const fy = perception.primarySubject.box.y + perception.primarySubject.box.height / 2;
          // Distance to thirds (0.33 or 0.66)
          const distThirdX = Math.min(Math.abs(fx - 0.33), Math.abs(fx - 0.66));
          const distThirdY = Math.min(Math.abs(fy - 0.33), Math.abs(fy - 0.66));
          compositionScore = Math.max(0.2, 1.0 - (distThirdX + distThirdY));
        }

        // Combined Score
        const combined = technicalScore * 0.40 + subjectScore * 0.35 + compositionScore * 0.25;
        const totalScore = Number.isFinite(combined) ? combined : 0.5;

        candidates.push({
          timestamp: targetTime,
          canvas,
          technicalScore,
          subjectScore,
          compositionScore,
          totalScore,
        });
      } catch {
        continue;
      }
    }

    // Fallback: If all candidates rejected or sampling failed
    if (candidates.length === 0) {
      const fallbackCanvas = document.createElement('canvas');
      fallbackCanvas.width = 320;
      fallbackCanvas.height = 180;
      const fctx = fallbackCanvas.getContext('2d');
      if (fctx) fctx.drawImage(videoEl, 0, 0, 320, 180);

      let fallbackDataUrl = 'data:image/jpeg;base64,omnistream_fallback_poster';
      try {
        if (typeof fallbackCanvas.toDataURL === 'function') {
          const res = fallbackCanvas.toDataURL('image/jpeg', 0.85);
          if (res) fallbackDataUrl = res;
        }
      } catch {}

      return {
        bestTimestamp: duration * 0.35,
        bestCanvas: fallbackCanvas,
        bestImageDataUrl: fallbackDataUrl,
        totalScore: 0.5,
        evaluatedCandidatesCount: 0,
        scoreBreakdown: {
          technicalQuality: 0.5,
          subjectPresence: 0.5,
          composition: 0.5,
        },
        source: 'deterministic_fallback',
      };
    }

    // Sort descending by total score
    candidates.sort((a, b) => b.totalScore - a.totalScore);
    const winner = candidates[0];

    let bestImageDataUrl = 'data:image/jpeg;base64,omnistream_representative_poster';
    try {
      if (typeof winner.canvas.toDataURL === 'function') {
        const res = winner.canvas.toDataURL('image/jpeg', 0.88);
        if (res) bestImageDataUrl = res;
      }
    } catch {}

    return {
      bestTimestamp: winner.timestamp,
      bestCanvas: winner.canvas,
      bestImageDataUrl,
      totalScore: winner.totalScore,
      evaluatedCandidatesCount: candidates.length,
      scoreBreakdown: {
        technicalQuality: winner.technicalScore,
        subjectPresence: winner.subjectScore,
        composition: winner.compositionScore,
      },
      source: 'enhanced_cascade',
    };
  }
}

