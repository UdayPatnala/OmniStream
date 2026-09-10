import { OMS_FrameSample, OMS_VisionAnalysisResult, OMS_SubjectDetection } from './types';
import { IVisualPerceptionEvidence } from '@omnistream/core/oms/interfaces';

/**
 * visionAnalyzer.ts - Stage 4: Multi-Subject & Saliency Vision Analyzer
 * Identifies focal regions, multi-subject centers of mass, and subtitle safe zone occlusion.
 * Seamlessly integrates normalized IVisualPerceptionEvidence when available.
 */
export class OMS_VisionAnalyzer {
  public analyze(
    sample: OMS_FrameSample,
    enhancedEvidence?: IVisualPerceptionEvidence | null
  ): OMS_VisionAnalysisResult {
    const { data, width, height } = sample;
    const subjects: OMS_SubjectDetection[] = [];

    let weightedX = 0;
    let weightedY = 0;
    let totalWeight = 0;
    let subtitlePixels = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      const px = (i / 4) % width;
      const py = Math.floor((i / 4) / width);

      // Contrast variation weight (saliency)
      const weight = Math.abs(lum - 128);
      weightedX += px * weight;
      weightedY += py * weight;
      totalWeight += weight;

      // Subtitle safe zone inspection (bottom 18% of frame)
      if (py / height > 0.82 && lum > 200) {
        subtitlePixels++;
      }
    }

    const normX = totalWeight > 0 ? (weightedX / totalWeight) / width : 0.5;
    const normY = totalWeight > 0 ? (weightedY / totalWeight) / height : 0.5;

    // 1. If enhanced ML perception evidence is present with valid candidates, use them as primary focal anchors
    if (enhancedEvidence && enhancedEvidence.status === 'AVAILABLE' && enhancedEvidence.candidates.length > 0) {
      for (const cand of enhancedEvidence.candidates) {
        subjects.push({
          x: cand.box.x + cand.box.width / 2,
          y: cand.box.y + cand.box.height / 2,
          width: cand.box.width,
          height: cand.box.height,
          confidence: cand.confidence,
          type: cand.type,
        });
      }

      const primary = subjects[0];
      const subtitleZoneBlocked = subtitlePixels >= (width * 0.4);

      return {
        subjects,
        primarySubject: primary,
        combinedCenter: enhancedEvidence.focalCenter,
        subtitleZoneBlocked,
        confidence: primary.confidence,
      };
    }

    // 2. Classical Baseline Fallback (Contrast COM)
    const primarySubject: OMS_SubjectDetection = {
      x: Math.max(0.1, Math.min(0.9, normX)),
      y: Math.max(0.1, Math.min(0.9, normY)),
      width: 0.35,
      height: 0.35,
      confidence: 0.88,
      type: 'salient_region',
    };
    subjects.push(primarySubject);

    const subtitleZoneBlocked = subtitlePixels >= (width * 0.4);

    return {
      subjects,
      primarySubject,
      combinedCenter: { x: normX, y: normY },
      subtitleZoneBlocked,
      confidence: primarySubject.confidence,
    };
  }
}


