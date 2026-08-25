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

  public scoreAndSelect(
    candidates: OMS_CandidateFraming[],
    vision: OMS_VisionAnalysisResult,
    motion: OMS_MotionVector,
    subtitlesActive: boolean
  ): { selected: OMS_ScoredFraming; isSourceProtected: boolean } {
    const scored: OMS_ScoredFraming[] = candidates.map(cand => {
      // 1. Subject coverage & alignment score
      let subjectScore = 0.5;
      if (vision.primarySubject) {
        const normSubX = (vision.primarySubject.x - 0.5) * 2;
        const normSubY = (vision.primarySubject.y - 0.5) * 2;
        const dist = Math.sqrt(Math.pow(cand.panX - normSubX, 2) + Math.pow(cand.panY - normSubY, 2));
        subjectScore = Math.max(0, 1.0 - dist);
      }

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
    const bestCandidate = scored[0];
    const sourceCandidate = scored.find(s => s.id === 'source_original') || scored[scored.length - 1];

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
}
