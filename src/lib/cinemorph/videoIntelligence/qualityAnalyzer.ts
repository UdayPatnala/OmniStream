/**
 * qualityAnalyzer.ts - Fast Deterministic Frame Quality Analyzer
 * Copyright (c) Patnala Uday Kumar. All rights reserved.
 *
 * Implements L3 quality metrics: Laplacian variance sharpness, blur detection,
 * contrast entropy, dynamic range, and low-key cinematic protection.
 */

import { FrameQualityMetrics } from './types';

export class FrameQualityAnalyzer {
  /**
   * Analyze raw RGBA pixel data to compute quality metrics
   */
  public analyzeFrameData(
    rgbaData: Uint8ClampedArray,
    width: number,
    height: number
  ): FrameQualityMetrics {
    if (rgbaData.length === 0 || width <= 2 || height <= 2) {
      return {
        sharpnessScore: 0,
        blurDetected: true,
        averageLuminance: 0,
        contrastScore: 0,
        exposureStatus: 'underexposed',
        highlightClipping: 0,
        shadowClipping: 1.0,
      };
    }

    const totalPixels = width * height;
    const luminance = new Float32Array(totalPixels);
    let sumLuminance = 0;
    let highlightCount = 0;
    let shadowCount = 0;

    // 1. Calculate Per-Pixel Luminance and Clipping
    for (let i = 0; i < totalPixels; i++) {
      const offset = i * 4;
      const r = rgbaData[offset];
      const g = rgbaData[offset + 1];
      const b = rgbaData[offset + 2];

      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      luminance[i] = lum;
      sumLuminance += lum;

      if (lum >= 250) highlightCount++;
      if (lum <= 5) shadowCount++;
    }

    const avgLuminance = sumLuminance / totalPixels;
    const highlightClipping = highlightCount / totalPixels;
    const shadowClipping = shadowCount / totalPixels;

    // 2. Contrast Standard Deviation
    let varianceSum = 0;
    for (let i = 0; i < totalPixels; i++) {
      const diff = luminance[i] - avgLuminance;
      varianceSum += diff * diff;
    }
    const contrastStdDev = Math.sqrt(varianceSum / totalPixels);
    const contrastScore = Math.min(1.0, contrastStdDev / 64.0);

    // 3. Laplacian Variance for Edge Sharpness
    let laplacianSum = 0;
    let laplacianSqSum = 0;
    let edgePixelCount = 0;

    for (let y = 1; y < height - 1; y++) {
      const rowOffset = y * width;
      for (let x = 1; x < width - 1; x++) {
        const idx = rowOffset + x;
        const center = luminance[idx];
        const top = luminance[idx - width];
        const bottom = luminance[idx + width];
        const left = luminance[idx - 1];
        const right = luminance[idx + 1];

        const lap = 4 * center - top - bottom - left - right;
        laplacianSum += lap;
        laplacianSqSum += lap * lap;
        edgePixelCount++;
      }
    }

    const meanLaplacian = edgePixelCount > 0 ? laplacianSum / edgePixelCount : 0;
    const laplacianVariance =
      edgePixelCount > 0
        ? laplacianSqSum / edgePixelCount - meanLaplacian * meanLaplacian
        : 0;

    // Normalize sharpness score [0, 1] using adaptive sigmoid scaling
    const normalizedSharpness = Math.min(
      1.0,
      Math.max(0.0, Math.tanh(laplacianVariance / 450.0))
    );

    // 4. Exposure Status Classification with Low-Key Cinema Protection
    let exposureStatus: FrameQualityMetrics['exposureStatus'] = 'balanced';
    if (avgLuminance < 40) {
      // If low brightness but high contrast ratio, it is intentional cinematic low-key lighting
      if (contrastScore > 0.45) {
        exposureStatus = 'low_key_cinematic';
      } else {
        exposureStatus = 'underexposed';
      }
    } else if (avgLuminance > 220 || highlightClipping > 0.35) {
      exposureStatus = 'overexposed';
    }

    const blurDetected = normalizedSharpness < 0.18;

    return {
      sharpnessScore: Number(normalizedSharpness.toFixed(3)),
      blurDetected,
      averageLuminance: Number(avgLuminance.toFixed(1)),
      contrastScore: Number(contrastScore.toFixed(3)),
      exposureStatus,
      highlightClipping: Number(highlightClipping.toFixed(3)),
      shadowClipping: Number(shadowClipping.toFixed(3)),
    };
  }
}

export const frameQualityAnalyzer = new FrameQualityAnalyzer();
