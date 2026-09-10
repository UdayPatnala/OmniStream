/**
 * aspectRatioDetector.ts - Active Image Area & IMAX Format Detector
 * Copyright (c) Patnala Uday Kumar. All rights reserved.
 *
 * Analyzes edge scanlines across temporal frame samples to detect persistent letterboxing / pillarboxing,
 * measure effective active image area, and identify format standards (1.43:1, 1.90:1, 2.39:1, 16:9, 4:3).
 */

import { ActiveImageBounds, DetectedAspectRatio } from './types';

export class AspectRatioDetector {
  private blackThreshold = 12; // Max pixel luminance considered black bar

  /**
   * Measure active image boundaries on a single frame buffer
   */
  public detectFrameBounds(
    rgbaData: Uint8ClampedArray,
    width: number,
    height: number
  ): ActiveImageBounds {
    if (rgbaData.length === 0 || width <= 0 || height <= 0) {
      return {
        topBarHeight: 0,
        bottomBarHeight: 0,
        leftBarWidth: 0,
        rightBarWidth: 0,
        activeWidth: width,
        activeHeight: height,
        measuredAspectRatio: 1.78,
        matchedStandard: '16:9',
        confidence: 0.5,
      };
    }

    // 1. Scan Top to Bottom (Letterbox Top Bar)
    let topBar = 0;
    for (let y = 0; y < Math.floor(height * 0.4); y++) {
      if (this.isRowBlack(rgbaData, y, width)) {
        topBar = y + 1;
      } else {
        break;
      }
    }

    // 2. Scan Bottom to Top (Letterbox Bottom Bar)
    let bottomBar = 0;
    for (let y = height - 1; y >= Math.floor(height * 0.6); y--) {
      if (this.isRowBlack(rgbaData, y, width)) {
        bottomBar = height - y;
      } else {
        break;
      }
    }

    // 3. Scan Left to Right (Pillarbox Left Bar)
    let leftBar = 0;
    for (let x = 0; x < Math.floor(width * 0.35); x++) {
      if (this.isColBlack(rgbaData, x, width, height)) {
        leftBar = x + 1;
      } else {
        break;
      }
    }

    // 4. Scan Right to Left (Pillarbox Right Bar)
    let rightBar = 0;
    for (let x = width - 1; x >= Math.floor(width * 0.65); x--) {
      if (this.isColBlack(rgbaData, x, width, height)) {
        rightBar = width - x;
      } else {
        break;
      }
    }

    // Balance symmetrical bars if delta is small
    const verticalBar = Math.min(topBar, bottomBar);
    const horizontalBar = Math.min(leftBar, rightBar);

    const activeW = Math.max(10, width - horizontalBar * 2);
    const activeH = Math.max(10, height - verticalBar * 2);
    const measuredRatio = Number((activeW / activeH).toFixed(2));

    const { standard, confidence } = this.classifyAspectRatio(measuredRatio);

    return {
      topBarHeight: verticalBar,
      bottomBarHeight: verticalBar,
      leftBarWidth: horizontalBar,
      rightBarWidth: horizontalBar,
      activeWidth: activeW,
      activeHeight: activeH,
      measuredAspectRatio: measuredRatio,
      matchedStandard: standard,
      confidence,
    };
  }

  /**
   * Aggregate multiple temporal frame bounds to confirm persistent format without false positives
   */
  public aggregateTemporalDetections(
    samples: ActiveImageBounds[]
  ): { format: DetectedAspectRatio; confidence: number; isDynamic: boolean } {
    if (samples.length === 0) {
      return { format: '16:9', confidence: 0.5, isDynamic: false };
    }

    const counts: Record<DetectedAspectRatio, number> = {
      '1.43:1': 0,
      '1.90:1': 0,
      '2.39:1': 0,
      '16:9': 0,
      '4:3': 0,
      original: 0,
    };

    for (const s of samples) {
      counts[s.matchedStandard] = (counts[s.matchedStandard] || 0) + 1;
    }

    let dominantFormat: DetectedAspectRatio = '16:9';
    let maxCount = 0;
    let distinctStandardsCount = 0;

    for (const [standard, count] of Object.entries(counts)) {
      if (count > 0) distinctStandardsCount++;
      if (count > maxCount) {
        maxCount = count;
        dominantFormat = standard as DetectedAspectRatio;
      }
    }

    const consistencyRatio = maxCount / samples.length;
    const isDynamic = distinctStandardsCount >= 2 && consistencyRatio < 0.85;

    return {
      format: dominantFormat,
      confidence: Number(consistencyRatio.toFixed(2)),
      isDynamic,
    };
  }

  private isRowBlack(rgba: Uint8ClampedArray, y: number, width: number): boolean {
    const step = Math.max(1, Math.floor(width / 20)); // Sample 20 points across row
    for (let x = 0; x < width; x += step) {
      const idx = (y * width + x) * 4;
      const lum = 0.299 * rgba[idx] + 0.587 * rgba[idx + 1] + 0.114 * rgba[idx + 2];
      if (lum > this.blackThreshold) return false;
    }
    return true;
  }

  private isColBlack(rgba: Uint8ClampedArray, x: number, width: number, height: number): boolean {
    const step = Math.max(1, Math.floor(height / 20)); // Sample 20 points down column
    for (let y = 0; y < height; y += step) {
      const idx = (y * width + x) * 4;
      const lum = 0.299 * rgba[idx] + 0.587 * rgba[idx + 1] + 0.114 * rgba[idx + 2];
      if (lum > this.blackThreshold) return false;
    }
    return true;
  }

  private classifyAspectRatio(
    ratio: number
  ): { standard: DetectedAspectRatio; confidence: number } {
    if (ratio >= 2.25) {
      return { standard: '2.39:1', confidence: 0.95 };
    }
    if (ratio >= 1.85 && ratio <= 2.05) {
      return { standard: '1.90:1', confidence: 0.92 };
    }
    if (ratio >= 1.70 && ratio <= 1.84) {
      return { standard: '16:9', confidence: 0.96 };
    }
    if (ratio >= 1.40 && ratio <= 1.55) {
      return { standard: '1.43:1', confidence: 0.90 };
    }
    if (ratio <= 1.38) {
      return { standard: '4:3', confidence: 0.94 };
    }
    return { standard: '16:9', confidence: 0.7 };
  }
}

export const aspectRatioDetector = new AspectRatioDetector();
