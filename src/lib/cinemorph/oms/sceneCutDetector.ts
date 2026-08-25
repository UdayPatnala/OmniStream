import { OMS_FrameSample, OMS_SceneCutEvent } from './types';

/**
 * sceneCutDetector.ts - Stage 3: Scene / Hard Cut Detector
 * Compares frame luminance/color histograms between consecutive samples.
 * Detects hard scene transitions and resets temporal tracking to prevent camera panning across unrelated shots.
 */
export class OMS_SceneCutDetector {
  private lastHistogram: number[] | null = null;
  private currentSceneId = 0;
  private readonly HARD_CUT_THRESHOLD = 0.45;

  public process(sample: OMS_FrameSample): OMS_SceneCutEvent {
    const totalPixels = sample.width * sample.height;
    let isHardCut = false;
    let deltaRatio = 0;

    if (this.lastHistogram) {
      let diff = 0;
      for (let i = 0; i < 16; i++) {
        diff += Math.abs(this.lastHistogram[i] - sample.luminanceHistogram[i]);
      }
      deltaRatio = diff / (totalPixels * 2);
      if (deltaRatio > this.HARD_CUT_THRESHOLD) {
        isHardCut = true;
        this.currentSceneId++;
      }
    }

    this.lastHistogram = [...sample.luminanceHistogram];

    return {
      isHardCut,
      deltaRatio,
      timestamp: sample.timestamp,
      sceneId: this.currentSceneId,
    };
  }

  public reset(): void {
    this.lastHistogram = null;
    this.currentSceneId = 0;
  }
}
