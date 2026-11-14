/**
 * U-Tube Four-Sided Ambient Lighting Engine
 * ==========================================
 * Client-side, GPU-conscious four-sided peripheral ambient lighting engine for U-Tube.
 * Samples top, bottom, left, and right video edges, applies frame smoothing and corner blending,
 * and updates DOM element styles directly (0 React state re-renders).
 */

import {
  AmbientRgb,
  clampRgb,
  formatRgbString,
  rgbToLuma,
  UTubeAmbientConfig,
  UTubeFourSidedAnalysis,
  DEFAULT_UTUBE_AMBIENT_CONFIG,
} from '@omnistream/shared';

export class UTubeAmbientEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private sampleWidth = 32;
  private sampleHeight = 18;

  private currentAnalysis: UTubeFourSidedAnalysis = {
    top: { r: 12, g: 14, b: 24 },
    bottom: { r: 12, g: 14, b: 24 },
    left: { r: 12, g: 14, b: 24 },
    right: { r: 12, g: 14, b: 24 },
    topLeft: { r: 12, g: 14, b: 24 },
    topRight: { r: 12, g: 14, b: 24 },
    bottomLeft: { r: 12, g: 14, b: 24 },
    bottomRight: { r: 12, g: 14, b: 24 },
    dominant: { r: 12, g: 14, b: 24 },
    luma: 0.05,
    isCut: false,
    timestamp: 0,
  };

  private targetAnalysis: UTubeFourSidedAnalysis = { ...this.currentAnalysis };
  private config: UTubeAmbientConfig = { ...DEFAULT_UTUBE_AMBIENT_CONFIG };

  private isRunning = false;
  private animFrameId: number | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private topRef: HTMLElement | null = null;
  private bottomRef: HTMLElement | null = null;
  private leftRef: HTMLElement | null = null;
  private rightRef: HTMLElement | null = null;
  private containerRef: HTMLElement | null = null;

  private lastSampleTime = 0;
  private sampleIntervalMs = 50; // 20fps sampling target

  constructor(config?: Partial<UTubeAmbientConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  public bindElements(elements: {
    video: HTMLVideoElement | null;
    container?: HTMLElement | null;
    top?: HTMLElement | null;
    bottom?: HTMLElement | null;
    left?: HTMLElement | null;
    right?: HTMLElement | null;
  }): void {
    this.videoEl = elements.video;
    this.containerRef = elements.container || null;
    this.topRef = elements.top || null;
    this.bottomRef = elements.bottom || null;
    this.leftRef = elements.left || null;
    this.rightRef = elements.right || null;

    if (this.videoEl && this.config.enabled) {
      this.start();
    }
  }

  public updateConfig(newConfig: Partial<UTubeAmbientConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (!this.config.enabled) {
      this.stop();
      this.clearStyles();
    } else {
      this.applyStyles();
      if (this.videoEl && !this.isRunning) {
        this.start();
      }
    }
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.ensureCanvas();
    this.loop();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public syncImmediate(): void {
    if (!this.videoEl) return;
    this.sampleFrame();
    this.currentAnalysis = { ...this.targetAnalysis };
    this.applyStyles();
  }

  private ensureCanvas(): void {
    if (!this.canvas && typeof document !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.sampleWidth;
      this.canvas.height = this.sampleHeight;
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    }
  }

  private loop = (): void => {
    if (!this.isRunning) return;

    const now = performance.now();
    if (now - this.lastSampleTime >= this.sampleIntervalMs) {
      this.lastSampleTime = now;
      this.sampleFrame();
    }

    this.smoothTransition();
    this.applyStyles();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private sampleFrame(): void {
    if (!this.videoEl || !this.ctx || this.videoEl.readyState < 2) return;

    try {
      this.ctx.drawImage(this.videoEl, 0, 0, this.sampleWidth, this.sampleHeight);
      const imgData = this.ctx.getImageData(0, 0, this.sampleWidth, this.sampleHeight);
      this.processImageData(imgData);
    } catch {
      // Cross-origin fallback
    }
  }

  private smoothTransition(): void {
    const factor = this.config.smoothness;
    const smoothRgb = (curr: AmbientRgb, target: AmbientRgb): AmbientRgb => ({
      r: curr.r + (target.r - curr.r) * factor,
      g: curr.g + (target.g - curr.g) * factor,
      b: curr.b + (target.b - curr.b) * factor,
    });

    this.currentAnalysis = {
      top: smoothRgb(this.currentAnalysis.top, this.targetAnalysis.top),
      bottom: smoothRgb(this.currentAnalysis.bottom, this.targetAnalysis.bottom),
      left: smoothRgb(this.currentAnalysis.left, this.targetAnalysis.left),
      right: smoothRgb(this.currentAnalysis.right, this.targetAnalysis.right),
      topLeft: smoothRgb(this.currentAnalysis.topLeft, this.targetAnalysis.topLeft),
      topRight: smoothRgb(this.currentAnalysis.topRight, this.targetAnalysis.topRight),
      bottomLeft: smoothRgb(this.currentAnalysis.bottomLeft, this.targetAnalysis.bottomLeft),
      bottomRight: smoothRgb(this.currentAnalysis.bottomRight, this.targetAnalysis.bottomRight),
      dominant: smoothRgb(this.currentAnalysis.dominant, this.targetAnalysis.dominant),
      luma: this.targetAnalysis.luma,
      isCut: this.targetAnalysis.isCut,
      timestamp: this.targetAnalysis.timestamp,
    };
  }

  private applyStyles(): void {
    const intensity = this.config.intensity;
    const blur = this.config.blur;
    const spread = this.config.spread;

    if (this.containerRef) {
      this.containerRef.style.setProperty('--utube-ambient-top', formatRgbString(this.currentAnalysis.top));
      this.containerRef.style.setProperty('--utube-ambient-bottom', formatRgbString(this.currentAnalysis.bottom));
      this.containerRef.style.setProperty('--utube-ambient-left', formatRgbString(this.currentAnalysis.left));
      this.containerRef.style.setProperty('--utube-ambient-right', formatRgbString(this.currentAnalysis.right));
      this.containerRef.style.setProperty('--utube-ambient-dominant', formatRgbString(this.currentAnalysis.dominant));
      this.containerRef.style.setProperty('--utube-ambient-opacity', `${intensity}`);
    }

    if (this.topRef) {
      if (this.config.topEnabled) {
        this.topRef.style.background = `radial-gradient(ellipse 100% 100% at 50% 100%, ${formatRgbString(this.currentAnalysis.top)} 0%, transparent 80%)`;
        this.topRef.style.filter = `blur(${blur}px)`;
        this.topRef.style.opacity = `${intensity}`;
      } else {
        this.topRef.style.opacity = '0';
      }
    }

    if (this.bottomRef) {
      if (this.config.bottomEnabled) {
        this.bottomRef.style.background = `radial-gradient(ellipse 100% 100% at 50% 0%, ${formatRgbString(this.currentAnalysis.bottom)} 0%, transparent 80%)`;
        this.bottomRef.style.filter = `blur(${blur}px)`;
        this.bottomRef.style.opacity = `${intensity}`;
      } else {
        this.bottomRef.style.opacity = '0';
      }
    }

    if (this.leftRef) {
      if (this.config.leftEnabled) {
        this.leftRef.style.background = `radial-gradient(ellipse 100% 100% at 100% 50%, ${formatRgbString(this.currentAnalysis.left)} 0%, transparent 80%)`;
        this.leftRef.style.filter = `blur(${blur}px)`;
        this.leftRef.style.opacity = `${intensity}`;
      } else {
        this.leftRef.style.opacity = '0';
      }
    }

    if (this.rightRef) {
      if (this.config.rightEnabled) {
        this.rightRef.style.background = `radial-gradient(ellipse 100% 100% at 0% 50%, ${formatRgbString(this.currentAnalysis.right)} 0%, transparent 80%)`;
        this.rightRef.style.filter = `blur(${blur}px)`;
        this.rightRef.style.opacity = `${intensity}`;
      } else {
        this.rightRef.style.opacity = '0';
      }
    }
  }

  public getCurrentAnalysis(): UTubeFourSidedAnalysis {
    return { ...this.currentAnalysis };
  }

  public setThumbnail(url: string | null): void {
    if (!url) return;
    if (typeof Image === 'undefined') return;
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.sampleImage(img);
        this.currentAnalysis = { ...this.targetAnalysis };
        this.applyStyles();
      };
      img.src = url;
    } catch {}
  }

  public sampleImage(source: CanvasImageSource): void {
    if (!this.ctx || !this.canvas) {
      this.ensureCanvas();
    }
    if (!this.ctx || !this.canvas) return;

    try {
      this.ctx.drawImage(source, 0, 0, this.sampleWidth, this.sampleHeight);
      const imgData = this.ctx.getImageData(0, 0, this.sampleWidth, this.sampleHeight);
      this.processImageData(imgData);
    } catch {}
  }

  private processImageData(imgData: ImageData): void {
    const data = imgData.data;
    const edgeSize = Math.max(1, Math.round((this.config.edgeSampleSize / 100) * this.sampleWidth));

    let tR = 0, tG = 0, tB = 0, tCount = 0;
    let bR = 0, bG = 0, bB = 0, bCount = 0;
    let lR = 0, lG = 0, lB = 0, lCount = 0;
    let rR = 0, rG = 0, rB = 0, rCount = 0;

    for (let y = 0; y < this.sampleHeight; y++) {
      for (let x = 0; x < this.sampleWidth; x++) {
        const idx = (y * this.sampleWidth + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Top edge
        if (y < edgeSize) {
          tR += r; tG += g; tB += b; tCount++;
        }
        // Bottom edge
        if (y >= this.sampleHeight - edgeSize) {
          bR += r; bG += g; bB += b; bCount++;
        }
        // Left edge
        if (x < edgeSize) {
          lR += r; lG += g; lB += b; lCount++;
        }
        // Right edge
        if (x >= this.sampleWidth - edgeSize) {
          rR += r; rG += g; rB += b; rCount++;
        }
      }
    }

    const top = clampRgb({ r: tR / (tCount || 1), g: tG / (tCount || 1), b: tB / (tCount || 1) });
    const bottom = clampRgb({ r: bR / (bCount || 1), g: bG / (bCount || 1), b: bB / (bCount || 1) });
    const left = clampRgb({ r: lR / (lCount || 1), g: lG / (lCount || 1), b: lB / (lCount || 1) });
    const right = clampRgb({ r: rR / (rCount || 1), g: rG / (rCount || 1), b: rB / (rCount || 1) });

    // Corner blends
    const topLeft = clampRgb({ r: (top.r + left.r) / 2, g: (top.g + left.g) / 2, b: (top.b + left.b) / 2 });
    const topRight = clampRgb({ r: (top.r + right.r) / 2, g: (top.g + right.g) / 2, b: (top.b + right.b) / 2 });
    const bottomLeft = clampRgb({ r: (bottom.r + left.r) / 2, g: (bottom.g + left.g) / 2, b: (bottom.b + left.b) / 2 });
    const bottomRight = clampRgb({ r: (bottom.r + right.r) / 2, g: (bottom.g + right.g) / 2, b: (bottom.b + right.b) / 2 });

    const domR = (top.r + bottom.r + left.r + right.r) / 4;
    const domG = (top.g + bottom.g + left.g + right.g) / 4;
    const domB = (top.b + bottom.b + left.b + right.b) / 4;
    const dominant = clampRgb({ r: domR, g: domG, b: domB });

    this.targetAnalysis = {
      top,
      bottom,
      left,
      right,
      topLeft,
      topRight,
      bottomLeft,
      bottomRight,
      dominant,
      luma: rgbToLuma(dominant),
      isCut: false,
      timestamp: performance.now(),
    };
  }

  private clearStyles(): void {
    if (this.topRef) this.topRef.style.opacity = '0';
    if (this.bottomRef) this.bottomRef.style.opacity = '0';
    if (this.leftRef) this.leftRef.style.opacity = '0';
    if (this.rightRef) this.rightRef.style.opacity = '0';
  }

  public reset(): void {
    this.stop();
    this.clearStyles();
    this.currentAnalysis = {
      top: { r: 12, g: 14, b: 24 },
      bottom: { r: 12, g: 14, b: 24 },
      left: { r: 12, g: 14, b: 24 },
      right: { r: 12, g: 14, b: 24 },
      topLeft: { r: 12, g: 14, b: 24 },
      topRight: { r: 12, g: 14, b: 24 },
      bottomLeft: { r: 12, g: 14, b: 24 },
      bottomRight: { r: 12, g: 14, b: 24 },
      dominant: { r: 12, g: 14, b: 24 },
      luma: 0.05,
      isCut: false,
      timestamp: 0,
    };
    this.targetAnalysis = { ...this.currentAnalysis };
  }

  public dispose(): void {
    this.reset();
    this.videoEl = null;
    this.containerRef = null;
    this.topRef = null;
    this.bottomRef = null;
    this.leftRef = null;
    this.rightRef = null;
    this.canvas = null;
    this.ctx = null;
  }
}

export const utubeAmbientEngine = new UTubeAmbientEngine();
