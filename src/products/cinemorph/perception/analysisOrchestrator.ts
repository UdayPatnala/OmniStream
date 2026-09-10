/**
 * analysisOrchestrator.ts - Video Intelligence Orchestrator Layer
 * Copyright (c) Patnala Uday Kumar. All rights reserved.
 *
 * Implements L3 model orchestration:
 * UI -> Application Service -> Analysis Orchestrator -> Providers -> Cache
 */

import {
  ActiveImageBounds,
  CandidateFrame,
  DetectedAspectRatio,
  VideoIntelligenceReport,
} from './types';
import { frameQualityAnalyzer } from './qualityAnalyzer';
import { aspectRatioDetector } from './aspectRatioDetector';
import { bestFrameSelector } from './bestFrameSelector';

export interface AnalysisOptions {
  contentId: string;
  durationSeconds: number;
  sampleDensity?: 'coarse' | 'standard' | 'fine';
  onProgress?: (progressFraction: number) => void;
  signal?: AbortSignal;
}

export class VideoAnalysisOrchestrator {
  private cache = new Map<string, VideoIntelligenceReport>();
  private readonly ALGORITHM_VERSION = 'v2.1_hybrid';

  /**
   * Run full video intelligence pipeline on HTMLVideoElement
   */
  public async analyzeVideoSource(
    videoEl: HTMLVideoElement,
    options: AnalysisOptions
  ): Promise<VideoIntelligenceReport> {
    const startTime = performance.now();
    const cacheKey = `${options.contentId}_${this.ALGORITHM_VERSION}`;

    // 1. Check in-memory cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const duration = options.durationSeconds || videoEl.duration || 60;
    const sampleCount =
      options.sampleDensity === 'fine' ? 16 : options.sampleDensity === 'coarse' ? 6 : 10;

    const canvas = document.createElement('canvas');
    const width = 160;
    const height = 90;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
      return this.createFallbackReport(duration, performance.now() - startTime);
    }

    const interval = duration / (sampleCount + 1);
    const candidateSamples: {
      timestampSeconds: number;
      frameIndex: number;
      rgbaData: Uint8ClampedArray;
      width: number;
      height: number;
      dataUrl?: string;
    }[] = [];

    const aspectBoundsSamples: ActiveImageBounds[] = [];

    try {
      // 2. Progressive Sampling
      for (let i = 1; i <= sampleCount; i++) {
        if (options.signal?.aborted) {
          throw new Error('Video intelligence analysis aborted by user navigation');
        }

        const targetTime = i * interval;
        const frameData = await this.captureFrameAtTime(videoEl, targetTime, canvas, ctx);

        if (frameData) {
          candidateSamples.push({
            timestampSeconds: targetTime,
            frameIndex: i,
            rgbaData: frameData.rgba,
            width,
            height,
            dataUrl: frameData.dataUrl,
          });

          // Detect active bounds for this sample
          const bounds = aspectRatioDetector.detectFrameBounds(frameData.rgba, width, height);
          aspectBoundsSamples.push(bounds);
        }

        options.onProgress?.(i / sampleCount);
      }

      // 3. Aspect Ratio Consensus
      const aspectConsensus = aspectRatioDetector.aggregateTemporalDetections(aspectBoundsSamples);

      // 4. Best Frame Ranking (Poster & Preview)
      const { bestFrame: ticketPoster } = bestFrameSelector.selectBestFrames(
        candidateSamples,
        'ticket_thumbnail'
      );
      const { bestFrame: previewCard } = bestFrameSelector.selectBestFrames(
        candidateSamples,
        'preview_card'
      );

      const report: VideoIntelligenceReport = {
        videoDuration: duration,
        sampleCount: candidateSamples.length,
        detectedFormat: aspectConsensus.format,
        formatConfidence: aspectConsensus.confidence,
        isDynamicAspectRatio: aspectConsensus.isDynamic,
        bestFrames: {
          ticketPoster,
          previewCard,
        },
        analysisLatencyMs: Number((performance.now() - startTime).toFixed(1)),
      };

      // Cache result
      this.cache.set(cacheKey, report);
      return report;
    } catch (err: any) {
      return this.createFallbackReport(duration, performance.now() - startTime);
    } finally {
      // Resource cleanup: release canvas
      canvas.width = 0;
      canvas.height = 0;
    }
  }

  /**
   * Asynchronously seek and capture single video frame
   */
  private async captureFrameAtTime(
    videoEl: HTMLVideoElement,
    timeSecs: number,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D
  ): Promise<{ rgba: Uint8ClampedArray; dataUrl: string } | null> {
    return new Promise((resolve) => {
      const originalTime = videoEl.currentTime;

      const onSeeked = () => {
        videoEl.removeEventListener('seeked', onSeeked);
        try {
          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve({ rgba: imgData.data, dataUrl });
        } catch (e) {
          resolve(null);
        }
      };

      videoEl.addEventListener('seeked', onSeeked, { once: true });
      videoEl.currentTime = Math.max(0, Math.min(videoEl.duration || timeSecs, timeSecs));

      // Timeout guard: 600ms
      setTimeout(() => {
        videoEl.removeEventListener('seeked', onSeeked);
        resolve(null);
      }, 600);
    });
  }

  /**
   * Create deterministic fallback report when canvas or hardware is constrained
   */
  public createFallbackReport(
    duration: number,
    latencyMs: number
  ): VideoIntelligenceReport {
    const fallbackFrame: CandidateFrame = {
      timestampSeconds: 0,
      frameIndex: 0,
      quality: {
        sharpnessScore: 0.8,
        blurDetected: false,
        averageLuminance: 120,
        contrastScore: 0.7,
        exposureStatus: 'balanced',
        highlightClipping: 0.05,
        shadowClipping: 0.05,
      },
      composition: {
        ruleOfThirdsScore: 0.75,
        symmetryScore: 0.8,
        centerMassScore: 0.85,
        negativeSpaceBalance: 0.7,
      },
      temporalDistanceFromCut: 5,
      motionBlurPenalty: 0,
      totalScore: 0.82,
      selectionPurpose: 'ticket_thumbnail',
    };

    return {
      videoDuration: duration,
      sampleCount: 1,
      detectedFormat: '1.90:1',
      formatConfidence: 0.85,
      isDynamicAspectRatio: false,
      bestFrames: {
        ticketPoster: fallbackFrame,
        previewCard: fallbackFrame,
      },
      analysisLatencyMs: Number(latencyMs.toFixed(1)),
    };
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
  }
}

export const videoAnalysisOrchestrator = new VideoAnalysisOrchestrator();
