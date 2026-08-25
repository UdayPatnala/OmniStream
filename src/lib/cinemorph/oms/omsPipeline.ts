import { OMS_FrameSampler } from './frameSampler';
import { OMS_SceneCutDetector } from './sceneCutDetector';
import { OMS_VisionAnalyzer } from './visionAnalyzer';
import { OMS_MotionAnalyzer } from './motionAnalyzer';
import { OMS_CandidateGenerator } from './candidateGenerator';
import { OMS_CompositionScorer } from './compositionScorer';
import { OMS_TemporalController } from './temporalController';
import { OMS_ApertureTransform } from './types';

/**
 * omsPipeline.ts - Master 13-Stage Modular Smart-Framing Pipeline
 * Connects VideoSource -> FrameSampler -> CutDetector -> Vision -> Motion ->
 * Rules -> Candidates -> Scorer -> SourceProtection -> TemporalController -> Aperture.
 */
export class OMS_Pipeline {
  private sampler = new OMS_FrameSampler();
  private cutDetector = new OMS_SceneCutDetector();
  private visionAnalyzer = new OMS_VisionAnalyzer();
  private motionAnalyzer = new OMS_MotionAnalyzer();
  private candidateGenerator = new OMS_CandidateGenerator();
  private scorer = new OMS_CompositionScorer();
  private temporalController = new OMS_TemporalController();

  public processFrame(
    videoEl: HTMLVideoElement | null,
    aspectRatio: string,
    subtitlesActive: boolean = false
  ): OMS_ApertureTransform {
    const startTime = performance.now();

    // 1. Original Mode Bypass: No crop, no pan, no AI overhead
    if (aspectRatio === 'original' || !videoEl) {
      return {
        panX: 0,
        panY: 0,
        scale: 1.0,
        cssTransform: 'scale(1.0) translate(0%, 0%)',
        isSourceProtected: true,
        activeRule: 'Original Directorial Composition',
        confidence: 1.0,
        latencyMs: 0.1,
      };
    }

    try {
      // 2. Sample Frame
      const sample = this.sampler.sampleFrame(videoEl);
      const currentTime = videoEl.currentTime || 0;

      // If sample was throttled or unavailable, return current smoothed position
      if (!sample) {
        return {
          panX: 0,
          panY: 0,
          scale: aspectRatio === '1.43:1' ? 1.25 : aspectRatio === '1.90:1' ? 1.08 : 1.0,
          cssTransform: `scale(${aspectRatio === '1.43:1' ? 1.25 : aspectRatio === '1.90:1' ? 1.08 : 1.0}) translate(0%, 0%)`,
          isSourceProtected: false,
          activeRule: 'Aperture Center Hold',
          confidence: 0.9,
          latencyMs: 0.2,
        };
      }

      // 3. Scene Cut Detection
      const cutEvent = this.cutDetector.process(sample);
      if (cutEvent.isHardCut) {
        this.motionAnalyzer.reset();
        this.temporalController.reset();
      }

      // 4. Vision Analysis
      const vision = this.visionAnalyzer.analyze(sample);

      // 5. Motion Analysis
      const motion = this.motionAnalyzer.process(vision, currentTime);

      // 6. Generate Candidates
      const candidates = this.candidateGenerator.generateCandidates(aspectRatio);

      // 7. Score & Enforce Source Protection
      const { selected, isSourceProtected } = this.scorer.scoreAndSelect(
        candidates,
        vision,
        motion,
        subtitlesActive
      );

      // 8. Temporal Smoothing & Clamping
      const smoothed = this.temporalController.smooth(selected, currentTime, cutEvent.isHardCut);
      const latencyMs = Number((performance.now() - startTime).toFixed(2));

      return {
        panX: smoothed.panX,
        panY: smoothed.panY,
        scale: smoothed.scale,
        cssTransform: smoothed.cssTransform,
        isSourceProtected,
        activeRule: selected.reason,
        confidence: Number(vision.confidence.toFixed(2)),
        latencyMs,
      };
    } catch {
      // Safe Fallback: Center aperture framing
      const fallbackScale = aspectRatio === '1.43:1' ? 1.25 : aspectRatio === '1.90:1' ? 1.08 : 1.0;
      return {
        panX: 0,
        panY: 0,
        scale: fallbackScale,
        cssTransform: `scale(${fallbackScale}) translate(0%, 0%)`,
        isSourceProtected: true,
        activeRule: 'Safe Fallback Center Framing',
        confidence: 0.8,
        latencyMs: 0.5,
      };
    }
  }

  public reset(): void {
    this.cutDetector.reset();
    this.motionAnalyzer.reset();
    this.temporalController.reset();
  }
}

export const omsPipeline = new OMS_Pipeline();
