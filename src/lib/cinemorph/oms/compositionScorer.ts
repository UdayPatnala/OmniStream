import { 
  OMS_CandidateFraming, 
  OMS_ScoredFraming, 
  OMS_VisionAnalysisResult, 
  OMS_MotionVector 
} from './types';
import { OMS_CinematographyRules } from './cinematographyRules';

/**
 * compositionScorer.ts - Stage 8: Composition Scorer & Source Composition Protection Gate
 * Evaluates candidate viewports and strictly enforces Source Composition Protection (Delta >= 0.15).
 */
export class OMS_CompositionScorer {
  private rules = new OMS_CinematographyRules();
  private readonly SOURCE_PROTECTION_DELTA = 0.15; // Minimum improvement needed to alter original framing
  private readonly SWITCHING_HYSTERESIS_DELTA = 0.08; // Hysteresis margin to prevent rapid focal jumping
  private lastSelectedId: string | null = null;
  private selectionHoldFrames = 0;

  public scoreAndSelect(
    candidates: OMS_CandidateFraming[],
    vision: OMS_VisionAnalysisResult,
    motion: OMS_MotionVector,
    subtitlesActive: boolean
  ): { selected: OMS_ScoredFraming; isSourceProtected: boolean } {
    // Determine group focal target if multiple subjects exist
    let focalTargetX = 0.5;
    let focalTargetY = 0.5;

    if (vision.subjects && vision.subjects.length > 1) {
      let sumX = 0;
      let sumY = 0;
      let sumWeight = 0;
      for (const s of vision.subjects) {
        const w = s.confidence * (s.width * s.height);
        sumX += s.x * w;
        sumY += s.y * w;
        sumWeight += w;
      }
      if (sumWeight > 0) {
        focalTargetX = sumX / sumWeight;
        focalTargetY = sumY / sumWeight;
      }
    } else if (vision.primarySubject) {
      focalTargetX = vision.primarySubject.x;
      focalTargetY = vision.primarySubject.y;
    }

    const normFocalX = (focalTargetX - 0.5) * 2;
    const normFocalY = (focalTargetY - 0.5) * 2;

    const scored: OMS_ScoredFraming[] = candidates.map(cand => {
      // 1. Subject coverage & alignment score
      const dist = Math.sqrt(Math.pow(cand.panX - normFocalX, 2) + Math.pow(cand.panY - normFocalY, 2));
      const subjectScore = Math.max(0, 1.0 - dist);

      // 2. Cinematography rule score & subtitle safety
      const { ruleScore, subtitlePenalty, reason } = this.rules.scoreRuleCompliance(
        cand,
        vision,
        motion,
        subtitlesActive
      );

      // 3. Motion lead score
      let motionScore = 0.5;
      if (motion.speed > 0.1) {
        const dot = (cand.panX * -motion.vx) + (cand.panY * -motion.vy);
        motionScore = dot > 0 ? 0.8 : 0.3;
      }

      // 4. Excessive zoom penalty
      const zoomPenalty = Math.max(0, (cand.scale - 1.0) * 0.25);

      // Total weighted composition score
      const totalScore = Math.max(
        0,
        subjectScore * 0.35 +
        ruleScore * 0.30 +
        motionScore * 0.20 -
        subtitlePenalty -
        zoomPenalty
      );

      return {
        ...cand,
        subjectScore,
        ruleScore,
        motionScore,
        subtitlePenalty,
        zoomPenalty,
        totalScore,
        reason,
      };
    });

    // Sort by highest score
    scored.sort((a, b) => b.totalScore - a.totalScore);
    let bestCandidate = scored[0];
    const sourceCandidate = scored.find(s => s.id === 'source_original') || scored[scored.length - 1];

    // Switching Hysteresis: Prevent rapid jumping between nearly identical candidate scores
    if (this.lastSelectedId && this.lastSelectedId !== bestCandidate.id) {
      const prevCandidate = scored.find(s => s.id === this.lastSelectedId);
      if (prevCandidate && (bestCandidate.totalScore - prevCandidate.totalScore) < this.SWITCHING_HYSTERESIS_DELTA) {
        // Keep previous candidate if advantage is minor
        bestCandidate = prevCandidate;
      } else {
        this.lastSelectedId = bestCandidate.id;
        this.selectionHoldFrames = 0;
      }
    } else {
      this.lastSelectedId = bestCandidate.id;
      this.selectionHoldFrames++;
    }

    // Source Composition Protection:
    // If the top candidate does not exceed source composition score by at least Delta >= 0.15, preserve source!
    const improvement = bestCandidate.totalScore - sourceCandidate.totalScore;
    if (improvement < this.SOURCE_PROTECTION_DELTA || subtitlesActive) {
      return {
        selected: {
          ...sourceCandidate,
          reason: subtitlesActive 
            ? 'Source Preserved (Subtitle Protection Active)' 
            : 'Source Directorial Composition Protected (Delta < 0.15)',
        },
        isSourceProtected: true,
      };
    }

    return {
      selected: bestCandidate,
      isSourceProtected: false,
    };
  }

  public reset(): void {
    this.lastSelectedId = null;
    this.selectionHoldFrames = 0;
  }
}

