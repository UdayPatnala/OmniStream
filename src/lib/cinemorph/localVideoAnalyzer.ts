import { LocalVideoAnalysis } from '../../types';

/**
 * LocalVideoAnalyzer
 * Real client-side canvas-based frame and scene analysis for personal local video files.
 * Zero-upload, zero-cost, runs completely inside the browser.
 */
export class LocalVideoAnalyzer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private lastHistogram: number[] | null = null;
  private cacheMap = new Map<string, LocalVideoAnalysis>();

  constructor() {
    if (typeof document !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.canvas.width = 16;  // 16x9 ultra-fast sample grid (144 pixels for zero CPU overhead)
      this.canvas.height = 9;
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    }
  }

  public getCachedAnalysis(key: string): LocalVideoAnalysis | undefined {
    return this.cacheMap.get(key);
  }

  /**
   * Analyzes an active HTML5 Video Element frame
   */
  public analyzeVideoFrame(videoEl: HTMLVideoElement, fileKey?: string): LocalVideoAnalysis | null {
    if (!this.ctx || !this.canvas || videoEl.readyState < 2 || videoEl.videoWidth === 0) {
      return null;
    }

    try {
      this.ctx.drawImage(videoEl, 0, 0, this.canvas.width, this.canvas.height);
      const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      const data = imgData.data;
      const totalPixels = this.canvas.width * this.canvas.height;

      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let totalBrightness = 0;

      // 16-bin luminance histogram for scene change detection
      const histogram = new Array(16).fill(0);

      // Saliency edge accumulator
      let weightedX = 0;
      let totalWeight = 0;

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

        // Pixel X index
        const px = (i / 4) % this.canvas.width;
        // Weight by high contrast / luminance variation
        const weight = Math.abs(lum - 128);
        weightedX += px * weight;
        totalWeight += weight;
      }

      const avgR = Math.round(rSum / totalPixels);
      const avgG = Math.round(gSum / totalPixels);
      const avgB = Math.round(bSum / totalPixels);
      const avgBrightness = Math.round(totalBrightness / totalPixels);

      // Scene change calculation (histogram delta)
      let sceneChangeDetected = false;
      if (this.lastHistogram) {
        let diff = 0;
        for (let i = 0; i < 16; i++) {
          diff += Math.abs(this.lastHistogram[i] - histogram[i]);
        }
        const deltaRatio = diff / totalPixels;
        if (deltaRatio > 0.45) {
          sceneChangeDetected = true;
        }
      }
      this.lastHistogram = histogram;

      const saliencyCenterX = totalWeight > 0 
        ? Math.max(0.1, Math.min(0.9, (weightedX / totalWeight) / this.canvas.width)) 
        : 0.5;

      const dominantColor = `rgb(${avgR}, ${avgG}, ${avgB})`;
      const secondaryColor = `rgb(${Math.min(255, avgR + 30)}, ${Math.max(0, avgG - 20)}, ${Math.min(255, avgB + 40)})`;

      const result: LocalVideoAnalysis = {
        avgBrightness,
        dominantColor,
        secondaryColor,
        sceneChangeDetected,
        saliencyCenterX,
        contrastScore: Math.round((totalWeight / (totalPixels * 128)) * 100),
        timestamp: Date.now(),
      };

      if (fileKey) {
        this.cacheMap.set(fileKey, result);
      }

      return result;
    } catch (err) {
      return null;
    }
  }

  public analyzeVideoFrameWithKey(videoEl: HTMLVideoElement, fileKey?: string): LocalVideoAnalysis | null {
    return this.analyzeVideoFrame(videoEl, fileKey);
  }

  public reset(): void {
    this.lastHistogram = null;
  }
}

export const localVideoAnalyzer = new LocalVideoAnalyzer();
