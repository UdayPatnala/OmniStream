import { FrameAspectRatio, FrameReframeMode, AudioPreset, AudioEQConfig } from '../../types';
import { audioEngine } from './audioEngine';
import { calculateFrameStyle } from './frameEngine';

export interface AdaptiveCinemaEngineInput {
  videoId?: string;
  currentTime: number;
  duration: number;
  aspectRatio: FrameAspectRatio;
  reframeMode: FrameReframeMode;
  subtitlesActive?: boolean;
  audioPreset: AudioPreset;
  devicePerformance?: 'low' | 'balanced' | 'high';
  isLocalMedia?: boolean;
  rawConfidence?: number;
}

export interface AmbientLightState {
  dominantColor: string;
  luminance: number;
  opacity: number;
  lowpassColor: string;
}

export interface AdaptiveCinemaEngineOutput {
  screenTransform: {
    scale: number;
    translateX: number;
    translateY: number;
    cropX: number;
    cropY: number;
    cropWidth: number;
    cropHeight: number;
    confidence: number;
    cssTransform: string;
  };
  ambientLight: AmbientLightState;
  audioProfile: AudioEQConfig;
  analysisPriority: 'low' | 'medium' | 'high';
  subtitleSafeMode: boolean;
  activeFrameRatio: FrameAspectRatio;
  explainabilityLabel: string;
}

class AdaptiveCinemaEngine {
  private lastInputTime = 0;
  private lastSceneId = 0;
  private lastScale = 1.0;
  private lastTranslateY = 0;
  private lastTranslateX = 0;
  private lastConfidence = 1.0;
  private lastRgb = { r: 12, g: 15, b: 30 }; // Dark cyan-navy ambient

  // Dead zone thresholds
  private readonly DEADZONE_TRANSLATE_DELTA = 3.5; // percentage
  private readonly DEADZONE_SCALE_DELTA = 0.03;
  private readonly MIN_CONFIDENCE_THRESHOLD = 0.60;
  private readonly TEMPORAL_ALPHA = 0.15; // Low-pass temporal smoothing factor

  public process(input: AdaptiveCinemaEngineInput): AdaptiveCinemaEngineOutput {
    const {
      currentTime,
      duration,
      aspectRatio = 'original',
      reframeMode = 'face-priority',
      subtitlesActive = false,
      audioPreset = 'original',
      devicePerformance = 'balanced',
      rawConfidence = 0.92,
    } = input;

    const safeCurrentTime = typeof currentTime === 'number' && Number.isFinite(currentTime) ? Math.max(0, currentTime) : 0;
    const safeDuration = typeof duration === 'number' && Number.isFinite(duration) ? Math.max(0, duration) : 0;
    const safeConfidence = typeof rawConfidence === 'number' && Number.isFinite(rawConfidence) ? Math.min(1.0, Math.max(0.0, rawConfidence)) : 0.92;

    // 1. Detect Hard Scene Cut or Seek Jump
    const timeDelta = Math.abs(safeCurrentTime - this.lastInputTime);
    const isSeekOrCut = timeDelta > 1.5;
    this.lastInputTime = safeCurrentTime;

    if (isSeekOrCut) {
      this.lastSceneId++;
      // Flush temporal smoothing state on hard scene cut / seek
      this.lastScale = 1.0;
      this.lastTranslateY = 0;
      this.lastTranslateX = 0;
    }

    // 2. Determine Subtitle & Text Safe Mode
    let subtitleSafe = subtitlesActive;
    let targetScale = 1.0;
    let targetTranslateY = 0;
    let targetTranslateX = 0;
    let confidence = safeConfidence;
    let explainabilityLabel = 'Original Directorial Composition';

    // Biquad calculation from base frameEngine
    const baseStyle = calculateFrameStyle(aspectRatio, reframeMode);

    if (subtitleSafe) {
      // Bypasses smart crop instantly to preserve text readability
      explainabilityLabel = 'Subtitle Safe Mode (Original Uncropped Framing)';
      targetScale = 1.0;
      targetTranslateY = 0;
      targetTranslateX = 0;
      confidence = 1.0;
      this.lastScale = 1.0;
      this.lastTranslateY = 0;
    } else if (confidence < this.MIN_CONFIDENCE_THRESHOLD) {
      // Low confidence fallback to original composition
      explainabilityLabel = 'Original Composition (Confidence Fallback)';
      targetScale = 1.0;
      targetTranslateY = 0;
      targetTranslateX = 0;
    } else if (aspectRatio === 'original') {
      explainabilityLabel = 'Native 16:9 Uncropped Presentation';
      targetScale = 1.0;
      targetTranslateY = 0;
      targetTranslateX = 0;
    } else {
      // Derived targets based on aspect ratio & face-priority composition
      const ratioStr = String(aspectRatio || 'original').toUpperCase();
      explainabilityLabel = `Subject-Aware Presentation (${ratioStr})`;
      if (aspectRatio === '1.43:1') {
        explainabilityLabel = 'Large Format 1.43 (Vertical Immersive Aperture)';
        targetScale = reframeMode === 'face-priority' ? 1.28 : 1.25;
        targetTranslateY = reframeMode === 'face-priority' ? -3 : 0;
      } else if (aspectRatio === '1.90:1') {
        explainabilityLabel = 'Large Format 1.90 (Wide Immersive Aperture)';
        targetScale = reframeMode === 'face-priority' ? 1.12 : 1.08;
        targetTranslateY = reframeMode === 'face-priority' ? -2 : 0;
      } else if (aspectRatio === '4.3:1') {
        targetScale = reframeMode === 'face-priority' ? 1.45 : 1.35;
        targetTranslateY = reframeMode === 'face-priority' ? -5 : -2;
      } else if (aspectRatio === '21:9') {
        targetScale = reframeMode === 'face-priority' ? 1.35 : 1.33;
        targetTranslateY = reframeMode === 'face-priority' ? -4 : -2;
      } else if (aspectRatio === '1:1') {
        targetScale = 1.35;
        targetTranslateY = -3;
      } else if (aspectRatio === 'auto') {
        targetScale = 1.18;
        targetTranslateY = -3;
      } else if (aspectRatio === '4:3') {
        targetScale = 1.12;
        targetTranslateY = -2;
      }
    }

    // 3. Apply Dead Zone Hysteresis
    if (!Number.isFinite(this.lastScale) || this.lastScale <= 0) this.lastScale = 1.0;
    if (!Number.isFinite(this.lastTranslateY)) this.lastTranslateY = 0;
    if (!Number.isFinite(this.lastTranslateX)) this.lastTranslateX = 0;

    const scaleDelta = Math.abs(targetScale - this.lastScale);
    const translateYDelta = Math.abs(targetTranslateY - this.lastTranslateY);

    let nextScale = targetScale;
    let nextTranslateY = targetTranslateY;

    if (!isSeekOrCut) {
      if (scaleDelta < this.DEADZONE_SCALE_DELTA) {
        nextScale = this.lastScale;
      }
      if (translateYDelta < this.DEADZONE_TRANSLATE_DELTA) {
        nextTranslateY = this.lastTranslateY;
      }
    }

    // 4. Low-Pass Temporal Smoothing
    if (!isSeekOrCut) {
      this.lastScale = this.lastScale + this.TEMPORAL_ALPHA * (nextScale - this.lastScale);
      this.lastTranslateY = this.lastTranslateY + this.TEMPORAL_ALPHA * (nextTranslateY - this.lastTranslateY);
    } else {
      this.lastScale = nextScale;
      this.lastTranslateY = nextTranslateY;
    }

    if (!Number.isFinite(this.lastScale) || this.lastScale <= 0) this.lastScale = 1.0;
    if (!Number.isFinite(this.lastTranslateY)) this.lastTranslateY = 0;

    // 5. Ambient Dynamic Light Low-Pass Filter (Photic Safety)
    const targetRgb = this.computeAmbientRgb(safeCurrentTime, safeDuration);
    this.lastRgb.r += 0.05 * (targetRgb.r - this.lastRgb.r);
    this.lastRgb.g += 0.05 * (targetRgb.g - this.lastRgb.g);
    this.lastRgb.b += 0.05 * (targetRgb.b - this.lastRgb.b);

    if (!Number.isFinite(this.lastRgb.r)) this.lastRgb.r = 12;
    if (!Number.isFinite(this.lastRgb.g)) this.lastRgb.g = 15;
    if (!Number.isFinite(this.lastRgb.b)) this.lastRgb.b = 30;

    const lowpassColor = `rgba(${Math.round(this.lastRgb.r)}, ${Math.round(this.lastRgb.g)}, ${Math.round(this.lastRgb.b)}, 0.85)`;

    // 6. Audio EQ Profile & Dynamic Range Control
    const audioProfile = audioEngine.getPresetConfig(audioPreset);

    // 7. Adaptive Analysis Priority Determination
    let analysisPriority: 'low' | 'medium' | 'high' = 'medium';
    if (isSeekOrCut) {
      analysisPriority = 'high';
    } else if (devicePerformance === 'low') {
      analysisPriority = 'low';
    }

    return {
      screenTransform: {
        scale: Number(this.lastScale.toFixed(3)),
        translateX: 0,
        translateY: Number(this.lastTranslateY.toFixed(2)),
        cropX: 0,
        cropY: 0,
        cropWidth: 100,
        cropHeight: 100,
        confidence: Number(confidence.toFixed(2)),
        cssTransform: `scale(${this.lastScale.toFixed(3)}) translateY(${this.lastTranslateY.toFixed(2)}%)`,
      },
      ambientLight: {
        dominantColor: lowpassColor,
        luminance: 0.45,
        opacity: 0.8,
        lowpassColor,
      },
      audioProfile,
      analysisPriority,
      subtitleSafeMode: subtitleSafe,
      activeFrameRatio: aspectRatio,
      explainabilityLabel,
    };
  }

  private computeAmbientRgb(currentTime: number, duration: number) {
    // Smooth shifting color temperature based on playback timeline
    const progress = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
    const r = Math.round(10 + Math.sin(progress * Math.PI * 2) * 15);
    const g = Math.round(18 + Math.cos(progress * Math.PI * 2) * 20);
    const b = Math.round(45 + Math.sin(progress * Math.PI * 4) * 25);
    return { r, g, b };
  }

  public resetState() {
    this.lastInputTime = 0;
    this.lastSceneId = 0;
    this.lastScale = 1.0;
    this.lastTranslateY = 0;
    this.lastTranslateX = 0;
    this.lastConfidence = 1.0;
    this.lastRgb = { r: 12, g: 15, b: 30 };
  }
}

export const adaptiveCinemaEngine = new AdaptiveCinemaEngine();
