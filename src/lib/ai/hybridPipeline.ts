/**
 * Hybrid Intelligence Pipeline & Temporal Smoothing Engine
 * Provides stable cinematic viewport tracking with zero visual jitter.
 */

export interface FrameCompositionAnalysis {
  focalPointX: number; // 0.0 (left) to 1.0 (right)
  focalPointY: number; // 0.0 (top) to 1.0 (bottom)
  confidence: number;  // 0.0 to 1.0
  recommendedAspect: '16:9' | '21:9' | '4:3' | '1:1';
  pipelineStage: 'FAST_PATH' | 'BALANCED_PATH' | 'FALLBACK';
}

export class HybridIntelligencePipeline {
  private static previousFocalX = 0.5;
  private static previousFocalY = 0.5;
  private static smoothingFactor = 0.15; // Exponential Moving Average (EMA) alpha
  private static minConfidenceThreshold = 0.60;

  /**
   * Analyzes scene composition and calculates smoothed focal coordinates
   */
  public static analyzeFrame(
    canvasWidth: number,
    canvasHeight: number,
    sampleLuminanceGrid?: number[]
  ): FrameCompositionAnalysis {
    try {
      if (!sampleLuminanceGrid || sampleLuminanceGrid.length === 0) {
        return this.getNeutralFallback();
      }

      // Fast Path: Saliency Grid Weighted Average
      let totalWeight = 0;
      let weightedX = 0;
      let weightedY = 0;
      const gridSize = Math.sqrt(sampleLuminanceGrid.length);

      for (let i = 0; i < sampleLuminanceGrid.length; i++) {
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;
        const weight = sampleLuminanceGrid[i];
        
        weightedX += (col / gridSize) * weight;
        weightedY += (row / gridSize) * weight;
        totalWeight += weight;
      }

      if (totalWeight === 0) {
        return this.getNeutralFallback();
      }

      const rawFocalX = weightedX / totalWeight;
      const rawFocalY = weightedY / totalWeight;
      const confidence = Math.min(1.0, totalWeight / (sampleLuminanceGrid.length * 128));

      // Confidence Guardrail: Fallback if confidence is too low
      if (confidence < this.minConfidenceThreshold) {
        return {
          focalPointX: this.previousFocalX,
          focalPointY: this.previousFocalY,
          confidence,
          recommendedAspect: '21:9',
          pipelineStage: 'FALLBACK',
        };
      }

      // Temporal Hysteresis & Exponential Smoothing
      const smoothedX = this.previousFocalX + this.smoothingFactor * (rawFocalX - this.previousFocalX);
      const smoothedY = this.previousFocalY + this.smoothingFactor * (rawFocalY - this.previousFocalY);

      this.previousFocalX = Math.max(0.1, Math.min(0.9, smoothedX));
      this.previousFocalY = Math.max(0.1, Math.min(0.9, smoothedY));

      return {
        focalPointX: this.previousFocalX,
        focalPointY: this.previousFocalY,
        confidence,
        recommendedAspect: '21:9',
        pipelineStage: 'BALANCED_PATH',
      };
    } catch (err) {
      return this.getNeutralFallback();
    }
  }

  public static resetTemporalBuffer(): void {
    this.previousFocalX = 0.5;
    this.previousFocalY = 0.5;
  }

  private static getNeutralFallback(): FrameCompositionAnalysis {
    return {
      focalPointX: 0.5,
      focalPointY: 0.5,
      confidence: 1.0,
      recommendedAspect: '16:9',
      pipelineStage: 'FALLBACK',
    };
  }
}
