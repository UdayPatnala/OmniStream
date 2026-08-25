import { OMS_FrameSample } from './types';

/**
 * frameSampler.ts - Stage 2: Adaptive Frame Sampler
 * Captures downscaled 16x9 frame statistics from HTML5 video elements without blocking playback.
 * Automatically drops stale frames and throttles sampling rate based on system performance.
 */
export class OMS_FrameSampler {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private lastSampleTime = 0;
  private targetFps = 15;

  constructor(width: number = 16, height: number = 9) {
    if (typeof document !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.canvas.width = width;
      this.canvas.height = height;
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    }
  }

  public setTargetFps(fps: number): void {
    this.targetFps = Math.max(5, Math.min(30, fps));
  }

  public sampleFrame(videoEl: HTMLVideoElement): OMS_FrameSample | null {
    if (!this.ctx || !this.canvas || !videoEl) return null;
    if (typeof videoEl.readyState !== 'number' || videoEl.readyState < 2) return null;
    if (!videoEl.videoWidth || !videoEl.videoHeight) return null;

    const now = performance.now();
    const interval = 1000 / this.targetFps;
    if (now - this.lastSampleTime < interval) {
      return null; // Skip frame to respect adaptive FPS throttle
    }
    this.lastSampleTime = now;

    try {
      this.ctx.drawImage(videoEl, 0, 0, this.canvas.width, this.canvas.height);
      const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      const data = imgData.data;
      const totalPixels = this.canvas.width * this.canvas.height;

      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let totalBrightness = 0;
      const histogram = new Array(16).fill(0);

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

        rSum += r;
        gSum += g;
        bSum += b;
        totalBrightness += lum;

        const bin = Math.min(15, Math.floor(lum / 16));
        histogram[bin]++;
      }

      return {
        timestamp: videoEl.currentTime,
        data,
        width: this.canvas.width,
        height: this.canvas.height,
        luminanceHistogram: histogram,
        averageBrightness: Math.round(totalBrightness / totalPixels),
        averageRgb: {
          r: Math.round(rSum / totalPixels),
          g: Math.round(gSum / totalPixels),
          b: Math.round(bSum / totalPixels),
        },
      };
    } catch {
      return null;
    }
  }
}
