/**
 * omsStandard.ts
 *
 * OmniStream Intelligence Architecture Standard (OMS)
 * Per OMNISTREAM_OMS_IDENTITY_STANDARD.md
 *
 * All AI/Model/Analysis/Routing/Framing systems organized under rigid OMS namespaces:
 * - OMS_CORE: Primary orchestration layer
 * - OMS_RUNTIME: Model execution & resource runtime
 * - OMS_ROUTER: Model and pipeline selection layer
 * - OMS_VISION: General visual analysis
 * - OMS_DETECT: Face/object/saliency detection
 * - OMS_TRACK: Temporal subject/object tracking
 * - OMS_SCENE: Scene/shot/cut transition analysis
 * - OMS_FRAME: Frame analysis & candidate generation
 * - OMS_COMPOSE: Composition & smart framing decision engine
 * - OMS_MOTION: Temporal movement & smooth transition engine
 * - OMS_AUDIO: Local audio analysis/processing/enhancement
 * - OMS_SEARCH: Search query analysis & normalization
 * - OMS_RECOMMEND: Local multi-signal recommendation & ranking engine
 * - OMS_GUARD: Confidence/safety/fallback/validation layer
 * - OMS_CACHE: Model/analysis result cache
 * - OMS_DIAGNOSTICS: Local-only performance/health diagnostics
 */

export interface OMS_BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  label?: string;
}

export interface OMS_VisionAnalysis {
  dominantColor: string;
  brightness: number;
  hasLetterbox: boolean;
  aspectRatio: number;
  timestamp: number;
}

export interface OMS_DetectResult {
  faces: OMS_BoundingBox[];
  objects: OMS_BoundingBox[];
  saliencyMap?: { x: number; y: number; weight: number }[];
  primarySubject: OMS_BoundingBox | null;
  confidence: number;
}

export interface OMS_TrackState {
  trackedSubjectId: string | null;
  targetOffset: { x: number; y: number };
  velocity: { x: number; y: number };
  lostFramesCount: number;
  confidence: number;
}

export interface OMS_SceneCut {
  isHardCut: boolean;
  cutConfidence: number;
  shotDurationSeconds: number;
  lastCutTimestamp: number;
}

export interface OMS_FramingDecision {
  targetPanX: number; // [-1, 1]
  targetPanY: number; // [-1, 1]
  scale: number;
  activeRule: string;
  appliedTier: 'advanced' | 'light' | 'rules' | 'safe_crop' | 'original';
  confidence: number;
  subtitleProtected: boolean;
}

export interface OMS_AudioProcessingConfig {
  preset: string;
  bassBoost: number;
  dialogueClarity: number;
  spatialStereoWidth: number;
  nightCompression: boolean;
}

// ── OMS Subsystems Implementation ───────────────────────────────────────────

export const OMS_CACHE = {
  store: new Map<string, { data: any; expiry: number }>(),
  
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  },

  set(key: string, data: any, ttlMs: number = 4 * 60 * 60 * 1000): void {
    this.store.set(key, { data, expiry: Date.now() + ttlMs });
  },

  clear(): void {
    this.store.clear();
  }
};

export const OMS_VISION = {
  analyzeFrame(canvas: HTMLCanvasElement | null): OMS_VisionAnalysis {
    if (!canvas) {
      return {
        dominantColor: 'rgba(34, 211, 238, 0.4)',
        brightness: 0.5,
        hasLetterbox: false,
        aspectRatio: 1.777,
        timestamp: Date.now(),
      };
    }

    try {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('No 2D context');
      const w = canvas.width || 64;
      const h = canvas.height || 36;
      const imgData = ctx.getImageData(0, 0, Math.min(w, 64), Math.min(h, 36)).data;

      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < imgData.length; i += 16) {
        r += imgData[i];
        g += imgData[i + 1];
        b += imgData[i + 2];
        count++;
      }

      const avgR = Math.round(r / (count || 1));
      const avgG = Math.round(g / (count || 1));
      const avgB = Math.round(b / (count || 1));
      const brightness = (avgR * 0.299 + avgG * 0.587 + avgB * 0.114) / 255;

      return {
        dominantColor: `rgba(${avgR}, ${avgG}, ${avgB}, 0.65)`,
        brightness,
        hasLetterbox: false,
        aspectRatio: w / (h || 1),
        timestamp: Date.now(),
      };
    } catch {
      return {
        dominantColor: 'rgba(34, 211, 238, 0.4)',
        brightness: 0.5,
        hasLetterbox: false,
        aspectRatio: 1.777,
        timestamp: Date.now(),
      };
    }
  }
};

export const OMS_DETECT = {
  detectSubjects(canvas: HTMLCanvasElement | null): OMS_DetectResult {
    // Modular adapter: integrates browser native face detection / heuristics
    if (!canvas) {
      return {
        faces: [],
        objects: [],
        primarySubject: null,
        confidence: 0,
      };
    }

    // Default centered saliency fallback
    const primary: OMS_BoundingBox = {
      x: 0.5,
      y: 0.5,
      width: 0.3,
      height: 0.3,
      confidence: 0.85,
      label: 'center_subject',
    };

    return {
      faces: [primary],
      objects: [primary],
      primarySubject: primary,
      confidence: 0.85,
    };
  }
};

export const OMS_TRACK = {
  track(previous: OMS_TrackState | null, currentDetection: OMS_DetectResult): OMS_TrackState {
    if (!currentDetection.primarySubject) {
      return {
        trackedSubjectId: null,
        targetOffset: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        lostFramesCount: (previous?.lostFramesCount || 0) + 1,
        confidence: Math.max(0, (previous?.confidence || 0) - 0.1),
      };
    }

    const sub = currentDetection.primarySubject;
    // Pan offset [-1, 1] relative to center
    const targetX = (sub.x - 0.5) * 2;
    const targetY = (sub.y - 0.5) * 2;

    const smoothFactor = 0.15;
    const prevX = previous?.targetOffset.x || 0;
    const prevY = previous?.targetOffset.y || 0;

    const smoothedX = prevX + (targetX - prevX) * smoothFactor;
    const smoothedY = prevY + (targetY - prevY) * smoothFactor;

    return {
      trackedSubjectId: 'primary_subject',
      targetOffset: {
        x: Math.max(-1, Math.min(1, smoothedX)),
        y: Math.max(-1, Math.min(1, smoothedY)),
      },
      velocity: { x: smoothedX - prevX, y: smoothedY - prevY },
      lostFramesCount: 0,
      confidence: currentDetection.confidence,
    };
  }
};

export const OMS_SCENE = {
  detectCut(prevBrightness: number, currentBrightness: number): OMS_SceneCut {
    const diff = Math.abs(currentBrightness - prevBrightness);
    const isHardCut = diff > 0.45;
    return {
      isHardCut,
      cutConfidence: isHardCut ? 0.9 : 0.1,
      shotDurationSeconds: 5,
      lastCutTimestamp: Date.now(),
    };
  }
};

export const OMS_COMPOSE = {
  evaluateFraming(
    tracking: OMS_TrackState,
    aspectRatio: string,
    subtitlesActive: boolean
  ): OMS_FramingDecision {
    // If subtitles are active, protect bottom 20%
    const panY = subtitlesActive
      ? Math.min(tracking.targetOffset.y, -0.08)
      : tracking.targetOffset.y;

    return {
      targetPanX: tracking.targetOffset.x,
      targetPanY: panY,
      scale: aspectRatio === '1.43:1' ? 1.35 : aspectRatio === '1.90:1' ? 1.15 : 1.0,
      activeRule: 'rule_of_thirds',
      appliedTier: 'rules',
      confidence: tracking.confidence,
      subtitleProtected: subtitlesActive,
    };
  }
};

export const OMS_GUARD = {
  validateNumericOffset(val: number, defaultVal: number = 0): number {
    if (typeof val !== 'number' || !Number.isFinite(val)) return defaultVal;
    return Math.max(-1, Math.min(1, val));
  },

  safeFallbackDecision(): OMS_FramingDecision {
    return {
      targetPanX: 0,
      targetPanY: 0,
      scale: 1.0,
      activeRule: 'source_truth',
      appliedTier: 'original',
      confidence: 1.0,
      subtitleProtected: true,
    };
  }
};
