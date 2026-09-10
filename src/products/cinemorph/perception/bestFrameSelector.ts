/**
 * bestFrameSelector.ts - Multi-Stage Cascade Best Frame Selector
 * Copyright (c) Patnala Uday Kumar. All rights reserved.
 *
 * Implements L3 cascade scoring:
 * Final Score = w_q * Quality + w_c * Composition + w_t * TemporalStability - Penalties
 */

import { CandidateFrame, FrameCompositionMetrics, FrameQualityMetrics } from './types';
import { frameQualityAnalyzer } from './qualityAnalyzer';

export class BestFrameSelector {
  /**
   * Score and rank an array of frame candidates to select the optimal poster and preview frames
   */
  public selectBestFrames(
    candidates: {
      timestampSeconds: number;
      frameIndex: number;
      rgbaData: Uint8ClampedArray;
      width: number;
      height: number;
      temporalDistanceFromCut?: number;
      dataUrl?: string;
    }[],
    purpose: 'ticket_thumbnail' | 'poster' | 'preview_card' = 'ticket_thumbnail'
  ): {
    bestFrame: CandidateFrame;
    rankedCandidates: CandidateFrame[];
  } {
    if (candidates.length === 0) {
      const fallback: CandidateFrame = {
        timestampSeconds: 0,
        frameIndex: 0,
        quality: {
          sharpnessScore: 0.5,
          blurDetected: false,
          averageLuminance: 128,
          contrastScore: 0.5,
          exposureStatus: 'balanced',
          highlightClipping: 0,
          shadowClipping: 0,
        },
        composition: {
          ruleOfThirdsScore: 0.5,
          symmetryScore: 0.5,
          centerMassScore: 0.5,
          negativeSpaceBalance: 0.5,
        },
        temporalDistanceFromCut: 5,
        motionBlurPenalty: 0,
        totalScore: 0.5,
        selectionPurpose: purpose,
      };
      return { bestFrame: fallback, rankedCandidates: [fallback] };
    }

    const scoredList: CandidateFrame[] = candidates.map((c) => {
      // 1. Analyze Frame Quality
      const quality = frameQualityAnalyzer.analyzeFrameData(c.rgbaData, c.width, c.height);

      // 2. Analyze Frame Composition
      const composition = this.analyzeComposition(c.rgbaData, c.width, c.height);

      // 3. Temporal Stability Distance
      const cutDistance = c.temporalDistanceFromCut ?? 3.0;
      const temporalScore = Math.min(1.0, cutDistance / 4.0); // prefer frames > 3s away from hard cuts

      // 4. Motion Blur Penalty
      const motionBlurPenalty = quality.blurDetected ? 0.35 : 0.0;

      // 5. Purpose-Specific Weights
      let totalScore = 0;
      if (purpose === 'ticket_thumbnail' || purpose === 'poster') {
        // High emphasis on sharpness, contrast, and center focal energy
        totalScore =
          quality.sharpnessScore * 0.35 +
          quality.contrastScore * 0.25 +
          composition.centerMassScore * 0.20 +
          composition.ruleOfThirdsScore * 0.10 +
          temporalScore * 0.10 -
          motionBlurPenalty;
      } else {
        // Preview Card: balance symmetry and exposure
        totalScore =
          quality.sharpnessScore * 0.30 +
          quality.contrastScore * 0.20 +
          composition.symmetryScore * 0.25 +
          composition.negativeSpaceBalance * 0.15 +
          temporalScore * 0.10 -
          motionBlurPenalty;
      }

      totalScore = Math.max(0.0, Math.min(1.0, totalScore));

      return {
        timestampSeconds: c.timestampSeconds,
        frameIndex: c.frameIndex,
        dataUrl: c.dataUrl,
        quality,
        composition,
        temporalDistanceFromCut: cutDistance,
        motionBlurPenalty,
        totalScore: Number(totalScore.toFixed(3)),
        selectionPurpose: purpose,
      };
    });

    // Rank descending by total score
    scoredList.sort((a, b) => b.totalScore - a.totalScore);

    return {
      bestFrame: scoredList[0],
      rankedCandidates: scoredList,
    };
  }

  /**
   * Fast spatial luminance centroid & rule of thirds analyzer
   */
  private analyzeComposition(
    rgbaData: Uint8ClampedArray,
    width: number,
    height: number
  ): FrameCompositionMetrics {
    if (rgbaData.length === 0 || width <= 0 || height <= 0) {
      return {
        ruleOfThirdsScore: 0.5,
        symmetryScore: 0.5,
        centerMassScore: 0.5,
        negativeSpaceBalance: 0.5,
      };
    }

    let leftLuminance = 0;
    let rightLuminance = 0;
    let centerLuminance = 0;
    let powerPointsLuminance = 0;
    let totalLuminance = 0;

    const oneThirdX = Math.floor(width / 3);
    const twoThirdX = Math.floor((width * 2) / 3);
    const oneThirdY = Math.floor(height / 3);
    const twoThirdY = Math.floor((height * 2) / 3);

    const step = Math.max(1, Math.floor(width / 32)); // 32x32 sample grid

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const idx = (y * width + x) * 4;
        const lum = 0.299 * rgbaData[idx] + 0.587 * rgbaData[idx + 1] + 0.114 * rgbaData[idx + 2];
        totalLuminance += lum;

        if (x < width / 2) leftLuminance += lum;
        else rightLuminance += lum;

        // Center focal area (middle 40%)
        if (x >= width * 0.3 && x <= width * 0.7 && y >= height * 0.3 && y <= height * 0.7) {
          centerLuminance += lum;
        }

        // Rule of thirds power point clusters
        const nearPowerX = Math.abs(x - oneThirdX) < width * 0.08 || Math.abs(x - twoThirdX) < width * 0.08;
        const nearPowerY = Math.abs(y - oneThirdY) < height * 0.08 || Math.abs(y - twoThirdY) < height * 0.08;
        if (nearPowerX && nearPowerY) {
          powerPointsLuminance += lum;
        }
      }
    }

    if (totalLuminance === 0) {
      return {
        ruleOfThirdsScore: 0.5,
        symmetryScore: 0.5,
        centerMassScore: 0.5,
        negativeSpaceBalance: 0.5,
      };
    }

    // Symmetry: similarity between left and right halves [0, 1]
    const asymmetry = Math.abs(leftLuminance - rightLuminance) / totalLuminance;
    const symmetryScore = Math.max(0, 1 - asymmetry * 2);

    // Center focal mass [0, 1]
    const centerMassScore = Math.min(1.0, (centerLuminance / totalLuminance) * 2.5);

    // Rule of thirds score [0, 1]
    const ruleOfThirdsScore = Math.min(1.0, (powerPointsLuminance / totalLuminance) * 4.0);

    // Negative space balance [0, 1]
    const negativeSpaceBalance = Number((1.0 - Math.abs(0.5 - centerMassScore)).toFixed(2));

    return {
      ruleOfThirdsScore: Number(ruleOfThirdsScore.toFixed(3)),
      symmetryScore: Number(symmetryScore.toFixed(3)),
      centerMassScore: Number(centerMassScore.toFixed(3)),
      negativeSpaceBalance,
    };
  }
}

export const bestFrameSelector = new BestFrameSelector();
