import { Video, RankingProfile } from '../../types';

/**
 * Weighted Configurable Ranking Engine for YouTube Candidate Scoring.
 */

export interface RankingWeights {
  relevance: number;   // default 0.40
  playability: number; // default 0.25
  titleMatch: number;  // default 0.15
  channel: number;     // default 0.10
  duration: number;    // default 0.05
  recency: number;     // default 0.05
}

export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  relevance: 0.40,
  playability: 0.25,
  titleMatch: 0.15,
  channel: 0.10,
  duration: 0.05,
  recency: 0.05,
};

export const RANKING_PROFILE_PRESETS: Record<RankingProfile, RankingWeights> = {
  balanced: DEFAULT_RANKING_WEIGHTS,
  recency: {
    relevance: 0.30,
    playability: 0.20,
    titleMatch: 0.10,
    channel: 0.05,
    duration: 0.05,
    recency: 0.30,
  },
  tutorials: {
    relevance: 0.30,
    playability: 0.20,
    titleMatch: 0.10,
    channel: 0.05,
    duration: 0.30,
    recency: 0.05,
  },
  authority: {
    relevance: 0.30,
    playability: 0.20,
    titleMatch: 0.10,
    channel: 0.30,
    duration: 0.05,
    recency: 0.05,
  },
};

export interface ScoredCandidate {
  video: Video;
  totalScore: number;
  breakdown: {
    relevanceScore: number;
    playabilityScore: number;
    titleScore: number;
    channelScore: number;
    durationScore: number;
    recencyScore: number;
  };
}

export function calculateCandidateScore(
  query: string,
  video: Video,
  isPlayable: boolean = true,
  weights: RankingWeights = DEFAULT_RANKING_WEIGHTS
): ScoredCandidate {
  const qTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
  const titleLower = video.title.toLowerCase();
  const descLower = (video.description || '').toLowerCase();
  const channelLower = (video.channelTitle || '').toLowerCase();

  // 1. Relevance Score (0 - 100)
  let relevanceScore = 50;
  qTerms.forEach(term => {
    if (titleLower.includes(term)) relevanceScore += 15;
    if (descLower.includes(term)) relevanceScore += 5;
    if (channelLower.includes(term)) relevanceScore += 10;
  });
  relevanceScore = Math.min(100, relevanceScore);

  // 2. Playability Score (0 - 100)
  const playabilityScore = isPlayable ? 100 : 0;

  // 3. Title Match Score (0 - 100)
  let titleScore = 0;
  if (titleLower.includes(query.toLowerCase())) titleScore = 100;
  else {
    const matchedCount = qTerms.filter(t => titleLower.includes(t)).length;
    titleScore = Math.min(100, Math.round((matchedCount / Math.max(1, qTerms.length)) * 100));
  }

  // 4. Channel Authority Score (0 - 100)
  const views = parseInt(video.viewCount || '0', 10);
  let channelScore = 50;
  if (views > 1000000) channelScore = 100;
  else if (views > 100000) channelScore = 80;
  else if (views > 10000) channelScore = 65;

  // 5. Duration Score (0 - 100) -> prefers 3m to 45m tutorial range
  let durationScore = 70;
  const durationStr = video.duration || 'PT5M0S';
  if (durationStr.includes('M')) {
    const minutesMatch = durationStr.match(/PT(\d+)M/);
    if (minutesMatch) {
      const min = parseInt(minutesMatch[1], 10);
      if (min >= 3 && min <= 45) durationScore = 100;
      else if (min > 45) durationScore = 80;
      else durationScore = 60;
    }
  }

  // 6. Recency Score (0 - 100)
  let recencyScore = 60;
  if (video.publishedAt) {
    const pubYear = new Date(video.publishedAt).getFullYear();
    const currentYear = new Date().getFullYear();
    if (pubYear >= currentYear - 2) recencyScore = 100;
    else if (pubYear >= currentYear - 5) recencyScore = 80;
  }

  // Calculate Weighted Total Score
  const totalScore = Math.round(
    relevanceScore * weights.relevance +
    playabilityScore * weights.playability +
    titleScore * weights.titleMatch +
    channelScore * weights.channel +
    durationScore * weights.duration +
    recencyScore * weights.recency
  );

  return {
    video,
    totalScore,
    breakdown: {
      relevanceScore,
      playabilityScore,
      titleScore,
      channelScore,
      durationScore,
      recencyScore,
    },
  };
}

export function rankCandidates(
  query: string,
  candidates: Video[],
  weights: RankingWeights = DEFAULT_RANKING_WEIGHTS
): Video[] {
  return candidates
    .map(v => calculateCandidateScore(query, v, true, weights))
    .sort((a, b) => b.totalScore - a.totalScore)
    .map(sc => sc.video);
}
