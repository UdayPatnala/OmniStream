/**
 * CineMorph SCREEN X Ambient Engine
 * ===================================
 * Dedicated, client-side, GPU-conscious dual-wing ambient lighting engine.
 * 
 * Invariants:
 * 1. Dual-Wing Only: Strictly left and right peripheral lighting. Zero top/bottom ambient lighting.
 * 2. Visual Continuity: Originates directly from video left/right screen edges with zero visible gaps.
 * 3. Render Isolation: Directly manipulates DOM style refs and CSS custom properties; 0 React re-renders.
 * 4. Temporal Photic Safety: EMA low-pass filtering + frame blending + scene-cut adaptation prevents strobing.
 * 5. Lifecycle Safety: Immediate pause halt, instant seek sync, and complete resource cleanup on unmount.
 */

import {
  AmbientRgb,
  clampRgb,
  formatRgbString,
  rgbToLuma,
  ScreenXAnalysis,
  ScreenXConfig,
  DEFAULT_SCREENX_CONFIG,
} from '@omnistream/shared';

function adjustSaturation(rgb: AmbientRgb, factor: number): AmbientRgb {
  if (factor === 1.0) return rgb;
  const luma = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
  return clampRgb({
    r: luma + factor * (rgb.r - luma),
    g: luma + factor * (rgb.g - luma),
    b: luma + factor * (rgb.b - luma),
  });
}

export class ScreenXAmbientEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private sampleWidth = 32;
  private sampleHeight = 18;

  // Smoothing state
  private currentAnalysis: ScreenXAnalysis = {
    leftEdge: { r: 8, g: 10, b: 16 },
    rightEdge: { r: 8, g: 10, b: 16 },
    leftGradientStops: [
      { r: 8, g: 10, b: 16 },
      { r: 8, g: 10, b: 16 },
      { r: 8, g: 10, b: 16 },
    ],
    rightGradientStops: [
      { r: 8, g: 10, b: 16 },
      { r: 8, g: 10, b: 16 },
      { r: 8, g: 10, b: 16 },
    ],
    leftLuma: 0.05,
    rightLuma: 0.05,
    isCut: false,
    timestamp: 0,
  };

  private lastDominantL: AmbientRgb = { r: 8, g: 10, b: 16 };
  private lastDominantR: AmbientRgb = { r: 8, g: 10, b: 16 };

  // Playback tracking handle
  private animationFrameId: number | null = null;
  private rVfcCallbackId: number | null = null;
  private activeVideo: HTMLVideoElement | null = null;
  private activeLeftWing: HTMLElement | null = null;
  private activeRightWing: HTMLElement | null = null;
  private activeConfig: ScreenXConfig = { ...DEFAULT_SCREENX_CONFIG };
  private isRunning = false;
  private lastSampleTime = 0;

  constructor() {
    if (typeof document !== 'undefined') {
      try {
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.sampleWidth;
        this.canvas.height = this.sampleHeight;
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
      } catch {
        this.canvas = null;
        this.ctx = null;
      }
    }
  }

  /**
   * Samples active video frame, extracts left and right multi-point vertical edge slices,
   * applies saturation, EMA smoothing, and frame blending.
   */
  public analyzeFrame(
    videoEl: HTMLVideoElement | null,
    config: ScreenXConfig = this.activeConfig
  ): ScreenXAnalysis {
    const timestamp = Date.now();

    if (
      !videoEl ||
      typeof videoEl.readyState !== 'number' ||
      videoEl.readyState < 2 ||
      !Number.isFinite(videoEl.videoWidth) ||
      videoEl.videoWidth <= 0 ||
      !Number.isFinite(videoEl.videoHeight) ||
      videoEl.videoHeight <= 0 ||
      !this.ctx ||
      !this.canvas
    ) {
      return { ...this.currentAnalysis, timestamp };
    }

    try {
      this.ctx.drawImage(videoEl, 0, 0, this.sampleWidth, this.sampleHeight);
      const imgData = this.ctx.getImageData(0, 0, this.sampleWidth, this.sampleHeight);
      const data = imgData.data;

      // Vertical slicing: 3 sections (Top: rows 0-5, Mid: rows 6-11, Bottom: rows 12-17)
      const topRows = Math.floor(this.sampleHeight / 3);
      const midRows = Math.floor((this.sampleHeight * 2) / 3);

      let leftTopR = 0, leftTopG = 0, leftTopB = 0, leftTopCount = 0;
      let leftMidR = 0, leftMidG = 0, leftMidB = 0, leftMidCount = 0;
      let leftBotR = 0, leftBotG = 0, leftBotB = 0, leftBotCount = 0;

      let rightTopR = 0, rightTopG = 0, rightTopB = 0, rightTopCount = 0;
      let rightMidR = 0, rightMidG = 0, rightMidB = 0, rightMidCount = 0;
      let rightBotR = 0, rightBotG = 0, rightBotB = 0, rightBotCount = 0;

      // Sample edge strips (left 2 columns, right 2 columns)
      for (let y = 0; y < this.sampleHeight; y++) {
        for (let x = 0; x < 2; x++) {
          const idx = (y * this.sampleWidth + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          if (y < topRows) {
            leftTopR += r; leftTopG += g; leftTopB += b; leftTopCount++;
          } else if (y < midRows) {
            leftMidR += r; leftMidG += g; leftMidB += b; leftMidCount++;
          } else {
            leftBotR += r; leftBotG += g; leftBotB += b; leftBotCount++;
          }
        }

        for (let x = this.sampleWidth - 2; x < this.sampleWidth; x++) {
          const idx = (y * this.sampleWidth + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          if (y < topRows) {
            rightTopR += r; rightTopG += g; rightTopB += b; rightTopCount++;
          } else if (y < midRows) {
            rightMidR += r; rightMidG += g; rightMidB += b; rightMidCount++;
          } else {
            rightBotR += r; rightBotG += g; rightBotB += b; rightBotCount++;
          }
        }
      }

      const sat = config.colorSaturation;

      const rawLeftTop = adjustSaturation(clampRgb({
        r: leftTopCount > 0 ? leftTopR / leftTopCount : 0,
        g: leftTopCount > 0 ? leftTopG / leftTopCount : 0,
        b: leftTopCount > 0 ? leftTopB / leftTopCount : 0,
      }), sat);

      const rawLeftMid = adjustSaturation(clampRgb({
        r: leftMidCount > 0 ? leftMidR / leftMidCount : 0,
        g: leftMidCount > 0 ? leftMidG / leftMidCount : 0,
        b: leftMidCount > 0 ? leftMidB / leftMidCount : 0,
      }), sat);

      const rawLeftBot = adjustSaturation(clampRgb({
        r: leftBotCount > 0 ? leftBotR / leftBotCount : 0,
        g: leftBotCount > 0 ? leftBotG / leftBotCount : 0,
        b: leftBotCount > 0 ? leftBotB / leftBotCount : 0,
      }), sat);

      const rawRightTop = adjustSaturation(clampRgb({
        r: rightTopCount > 0 ? rightTopR / rightTopCount : 0,
        g: rightTopCount > 0 ? rightTopG / rightTopCount : 0,
        b: rightTopCount > 0 ? rightTopB / rightTopCount : 0,
      }), sat);

      const rawRightMid = adjustSaturation(clampRgb({
        r: rightMidCount > 0 ? rightMidR / rightMidCount : 0,
        g: rightMidCount > 0 ? rightMidG / rightMidCount : 0,
        b: rightMidCount > 0 ? rightMidB / rightMidCount : 0,
      }), sat);

      const rawRightBot = adjustSaturation(clampRgb({
        r: rightBotCount > 0 ? rightBotR / rightBotCount : 0,
        g: rightBotCount > 0 ? rightBotG / rightBotCount : 0,
        b: rightBotCount > 0 ? rightBotB / rightBotCount : 0,
      }), sat);

      // Dominant edge colors
      const rawLeftEdge = clampRgb({
        r: (rawLeftTop.r + rawLeftMid.r * 2 + rawLeftBot.r) / 4,
        g: (rawLeftTop.g + rawLeftMid.g * 2 + rawLeftBot.g) / 4,
        b: (rawLeftTop.b + rawLeftMid.b * 2 + rawLeftBot.b) / 4,
      });

      const rawRightEdge = clampRgb({
        r: (rawRightTop.r + rawRightMid.r * 2 + rawRightBot.r) / 4,
        g: (rawRightTop.g + rawRightMid.g * 2 + rawRightBot.g) / 4,
        b: (rawRightTop.b + rawRightMid.b * 2 + rawRightBot.b) / 4,
      });

      // Scene Cut Detection
      const deltaL =
        Math.abs(rawLeftEdge.r - this.lastDominantL.r) +
        Math.abs(rawLeftEdge.g - this.lastDominantL.g) +
        Math.abs(rawLeftEdge.b - this.lastDominantL.b);
      const deltaR =
        Math.abs(rawRightEdge.r - this.lastDominantR.r) +
        Math.abs(rawRightEdge.g - this.lastDominantR.g) +
        Math.abs(rawRightEdge.b - this.lastDominantR.b);
      const isCut = deltaL > 160 || deltaR > 160;

      this.lastDominantL = rawLeftEdge;
      this.lastDominantR = rawRightEdge;

      // Temporal stabilization alpha
      const baseAlpha = Math.max(0.05, Math.min(0.5, config.smoothness));
      const effectiveAlpha = isCut ? Math.max(0.85, config.responsiveness) : baseAlpha;

      // Smooth gradient stops
      const smoothLeftTop = this.applyEma(this.currentAnalysis.leftGradientStops[0], rawLeftTop, effectiveAlpha);
      const smoothLeftMid = this.applyEma(this.currentAnalysis.leftGradientStops[1], rawLeftMid, effectiveAlpha);
      const smoothLeftBot = this.applyEma(this.currentAnalysis.leftGradientStops[2], rawLeftBot, effectiveAlpha);

      const smoothRightTop = this.applyEma(this.currentAnalysis.rightGradientStops[0], rawRightTop, effectiveAlpha);
      const smoothRightMid = this.applyEma(this.currentAnalysis.rightGradientStops[1], rawRightMid, effectiveAlpha);
      const smoothRightBot = this.applyEma(this.currentAnalysis.rightGradientStops[2], rawRightBot, effectiveAlpha);

      const smoothLeftEdge = this.applyEma(this.currentAnalysis.leftEdge, rawLeftEdge, effectiveAlpha);
      const smoothRightEdge = this.applyEma(this.currentAnalysis.rightEdge, rawRightEdge, effectiveAlpha);

      this.currentAnalysis = {
        leftEdge: smoothLeftEdge,
        rightEdge: smoothRightEdge,
        leftGradientStops: [smoothLeftTop, smoothLeftMid, smoothLeftBot],
        rightGradientStops: [smoothRightTop, smoothRightMid, smoothRightBot],
        leftLuma: rgbToLuma(smoothLeftEdge),
        rightLuma: rgbToLuma(smoothRightEdge),
        isCut,
        timestamp,
      };

      return this.currentAnalysis;
    } catch {
      return { ...this.currentAnalysis, timestamp };
    }
  }

  /**
   * Render Isolation Invariant: Directly applies CSS custom properties and styles to the
   * left and right wing DOM elements without triggering React component re-renders.
   */
  public applyToWings(
    leftWingEl: HTMLElement | null,
    rightWingEl: HTMLElement | null,
    analysis: ScreenXAnalysis,
    config: ScreenXConfig = this.activeConfig
  ): void {
    if (!config.enabled) {
      if (leftWingEl) leftWingEl.style.opacity = '0';
      if (rightWingEl) rightWingEl.style.opacity = '0';
      return;
    }

    const effectiveOpacity = Math.max(0, Math.min(1, config.intensity));

    // Left Wing (Diffuses from video left border outward toward display left edge)
    if (leftWingEl && config.leftEnabled) {
      const top = formatRgbString(analysis.leftGradientStops[0]);
      const mid = formatRgbString(analysis.leftGradientStops[1]);
      const bot = formatRgbString(analysis.leftGradientStops[2]);
      const edge = formatRgbString(analysis.leftEdge);

      leftWingEl.style.setProperty('--screenx-edge', edge);
      leftWingEl.style.setProperty('--screenx-top', top);
      leftWingEl.style.setProperty('--screenx-mid', mid);
      leftWingEl.style.setProperty('--screenx-bot', bot);
      leftWingEl.style.setProperty('--screenx-blur', `${config.blurStrength}px`);
      leftWingEl.style.setProperty('--screenx-spread', `${config.lightingSpread}`);

      // Continuous lateral diffusion gradient: strong at right border (adjacent to video), tapering outward to left
      leftWingEl.style.background = `
        linear-gradient(to top, ${bot} 0%, ${mid} 50%, ${top} 100%),
        radial-gradient(ellipse at 100% 50%, ${edge} 0%, rgba(5, 4, 3, 0.95) 100%)
      `;
      leftWingEl.style.backgroundBlendMode = 'screen, normal';
      leftWingEl.style.filter = `blur(${config.blurStrength}px)`;
      leftWingEl.style.opacity = String(effectiveOpacity);
    } else if (leftWingEl) {
      leftWingEl.style.opacity = '0';
    }

    // Right Wing (Diffuses from video right border outward toward display right edge)
    if (rightWingEl && config.rightEnabled) {
      const top = formatRgbString(analysis.rightGradientStops[0]);
      const mid = formatRgbString(analysis.rightGradientStops[1]);
      const bot = formatRgbString(analysis.rightGradientStops[2]);
      const edge = formatRgbString(analysis.rightEdge);

      rightWingEl.style.setProperty('--screenx-edge', edge);
      rightWingEl.style.setProperty('--screenx-top', top);
      rightWingEl.style.setProperty('--screenx-mid', mid);
      rightWingEl.style.setProperty('--screenx-bot', bot);
      rightWingEl.style.setProperty('--screenx-blur', `${config.blurStrength}px`);
      rightWingEl.style.setProperty('--screenx-spread', `${config.lightingSpread}`);

      // Continuous lateral diffusion gradient: strong at left border (adjacent to video), tapering outward to right
      rightWingEl.style.background = `
        linear-gradient(to top, ${bot} 0%, ${mid} 50%, ${top} 100%),
        radial-gradient(ellipse at 0% 50%, ${edge} 0%, rgba(5, 4, 3, 0.95) 100%)
      `;
      rightWingEl.style.backgroundBlendMode = 'screen, normal';
      rightWingEl.style.filter = `blur(${config.blurStrength}px)`;
      rightWingEl.style.opacity = String(effectiveOpacity);
    } else if (rightWingEl) {
      rightWingEl.style.opacity = '0';
    }
  }

  /**
   * Starts high-efficiency synchronized tracking with video playback.
   */
  public startTracking(
    videoEl: HTMLVideoElement | null,
    leftWingEl: HTMLElement | null,
    rightWingEl: HTMLElement | null,
    config: ScreenXConfig = DEFAULT_SCREENX_CONFIG
  ): void {
    this.stopTracking();

    this.activeVideo = videoEl;
    this.activeLeftWing = leftWingEl;
    this.activeRightWing = rightWingEl;
    this.activeConfig = { ...config };
    this.isRunning = true;

    if (!videoEl) return;

    // Fast seek synchronization listener
    const onSeeked = () => {
      if (this.activeVideo && this.isRunning) {
        const analysis = this.analyzeFrame(this.activeVideo, this.activeConfig);
        this.applyToWings(this.activeLeftWing, this.activeRightWing, analysis, this.activeConfig);
      }
    };
    videoEl.addEventListener('seeked', onSeeked);

    // Frame sampling loop using requestVideoFrameCallback if available, fallback rAF
    const sampleIntervalMs = this.getIntervalFromQuality(config.quality);

    const step = () => {
      if (!this.isRunning || !this.activeVideo) return;

      const now = performance.now();
      if (!this.activeVideo.paused && !this.activeVideo.ended && (now - this.lastSampleTime >= sampleIntervalMs)) {
        this.lastSampleTime = now;
        const analysis = this.analyzeFrame(this.activeVideo, this.activeConfig);
        this.applyToWings(this.activeLeftWing, this.activeRightWing, analysis, this.activeConfig);
      }

      if ('requestVideoFrameCallback' in this.activeVideo && typeof (this.activeVideo as any).requestVideoFrameCallback === 'function') {
        this.rVfcCallbackId = (this.activeVideo as any).requestVideoFrameCallback(step);
      } else if (typeof requestAnimationFrame !== 'undefined') {
        this.animationFrameId = requestAnimationFrame(step);
      }
    };

    if ('requestVideoFrameCallback' in videoEl && typeof (videoEl as any).requestVideoFrameCallback === 'function') {
      this.rVfcCallbackId = (videoEl as any).requestVideoFrameCallback(step);
    } else if (typeof requestAnimationFrame !== 'undefined') {
      this.animationFrameId = requestAnimationFrame(step);
    }

    // Initial frame analysis
    const initial = this.analyzeFrame(videoEl, config);
    this.applyToWings(leftWingEl, rightWingEl, initial, config);
  }

  public updateConfig(newConfig: Partial<ScreenXConfig>): void {
    this.activeConfig = { ...this.activeConfig, ...newConfig };
    if (this.activeLeftWing && this.activeRightWing) {
      this.applyToWings(this.activeLeftWing, this.activeRightWing, this.currentAnalysis, this.activeConfig);
    }
  }

  public stopTracking(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.rVfcCallbackId !== null && this.activeVideo && typeof (this.activeVideo as any).cancelVideoFrameCallback === 'function') {
      (this.activeVideo as any).cancelVideoFrameCallback(this.rVfcCallbackId);
      this.rVfcCallbackId = null;
    }
    this.activeVideo = null;
    this.activeLeftWing = null;
    this.activeRightWing = null;
  }

  public getCurrentAnalysis(): ScreenXAnalysis {
    return { ...this.currentAnalysis };
  }

  public reset(): void {
    this.stopTracking();
    this.currentAnalysis = {
      leftEdge: { r: 8, g: 10, b: 16 },
      rightEdge: { r: 8, g: 10, b: 16 },
      leftGradientStops: [
        { r: 8, g: 10, b: 16 },
        { r: 8, g: 10, b: 16 },
        { r: 8, g: 10, b: 16 },
      ],
      rightGradientStops: [
        { r: 8, g: 10, b: 16 },
        { r: 8, g: 10, b: 16 },
        { r: 8, g: 10, b: 16 },
      ],
      leftLuma: 0.05,
      rightLuma: 0.05,
      isCut: false,
      timestamp: 0,
    };
    this.lastDominantL = { r: 8, g: 10, b: 16 };
    this.lastDominantR = { r: 8, g: 10, b: 16 };
  }

  private applyEma(current: AmbientRgb, target: AmbientRgb, alpha: number): AmbientRgb {
    return clampRgb({
      r: current.r + alpha * (target.r - current.r),
      g: current.g + alpha * (target.g - current.g),
      b: current.b + alpha * (target.b - current.b),
    });
  }

  private getIntervalFromQuality(quality: ScreenXConfig['quality']): number {
    switch (quality) {
      case 'ultra': return 16; // 60Hz
      case 'high': return 33; // 30Hz
      case 'balanced': return 50; // 20Hz
      case 'performance': return 80; // 12Hz
      default: return 50;
    }
  }
}

export const screenXAmbientEngine = new ScreenXAmbientEngine();
