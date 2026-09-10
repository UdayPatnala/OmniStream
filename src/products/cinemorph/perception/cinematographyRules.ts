import { OMS_VisionAnalysisResult, OMS_MotionVector, OMS_CandidateFraming } from './types';

/**
 * cinematographyRules.ts - Stage 6: Cinematography Soft Constraint Engine
 * Evaluates candidates against Rule of Thirds, Headroom, Look-room, and Subtitle Safety.
 */
export class OMS_CinematographyRules {
  public scoreRuleCompliance(
    candidate: OMS_CandidateFraming,
    vision: OMS_VisionAnalysisResult,
    motion: OMS_MotionVector,
    subtitlesActive: boolean
  ): { ruleScore: number; subtitlePenalty: number; reason: string } {
    let ruleScore = 0.5; // Base neutral
    let subtitlePenalty = 0;
    const reasons: string[] = [];

    // 1. Rule of Thirds alignment (0.333 or 0.667)
    const focalX = vision.combinedCenter.x;
    const distToLeftThird = Math.abs(focalX - 0.333);
    const distToRightThird = Math.abs(focalX - 0.667);
    const minThirdDist = Math.min(distToLeftThird, distToRightThird);

    if (minThirdDist < 0.12) {
      ruleScore += 0.25;
      reasons.push('Rule of Thirds Alignment');
    }

    // 2. Headroom protection (subject top in upper 20-30% range)
    const focalY = vision.combinedCenter.y;
    if (focalY >= 0.15 && focalY <= 0.35) {
      ruleScore += 0.20;
      reasons.push('Optimal Headroom');
    }

    // 3. Lead-room alignment with motion vector
    if (motion.speed > 0.1) {
      const isLeadingX = (motion.vx > 0 && candidate.panX < 0) || (motion.vx < 0 && candidate.panX > 0);
      if (isLeadingX) {
        ruleScore += 0.15;
        reasons.push('Look/Lead Room Maintained');
      }
    }

    // 4. Subtitle Zone Protection Penalty
    if (subtitlesActive || vision.subtitleZoneBlocked) {
      if (candidate.panY > 0.05) {
        subtitlePenalty = 0.45; // Heavy penalty for cropping down into subtitle area
        reasons.push('Subtitle Area Occlusion Penalty');
      }
    }

    return {
      ruleScore: Math.min(1.0, ruleScore),
      subtitlePenalty,
      reason: reasons.join(', ') || 'Standard Cinematic Framing',
    };
  }
}
