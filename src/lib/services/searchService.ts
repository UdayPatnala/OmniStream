import { Video } from '../../types';
import { searchVideos, getVideosByIds } from '../youtube';
import { cacheService } from './cacheService';

/**
 * Search Service - Intelligent relevance ranking and candidate discovery engine.
 */

export interface RankedVideoCandidate {
  video: Video;
  relevanceScore: number;
}

export function computeRelevanceScore(query: string, video: Video): number {
  const qTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
  if (qTerms.length === 0) return 50;

  const titleLower = video.title.toLowerCase();
  const descLower = (video.description || '').toLowerCase();
  const channelLower = (video.channelTitle || '').toLowerCase();

  let score = 0;

  // Title term match (highest weight)
  qTerms.forEach(term => {
    if (titleLower.includes(term)) score += 35;
    if (descLower.includes(term)) score += 15;
    if (channelLower.includes(term)) score += 20;
  });

  // Exact full query title match bonus
  if (titleLower.includes(query.toLowerCase())) {
    score += 50;
  }

  // View count popularity bonus
  const views = parseInt(video.viewCount || '0', 10);
  if (views > 1000000) score += 15;
  else if (views > 100000) score += 10;

  return score;
}

export async function searchAndRankVideos(query: string): Promise<Video[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Check fast cache
  const cached = cacheService.get(trimmed);
  if (cached && cached.length > 0) {
    return cached;
  }

  // Fetch search candidates
  const response = await searchVideos(trimmed, 'video');
  const candidateResults = response.results;

  if (candidateResults.length === 0) return [];

  const videoIds = candidateResults.map(r => r.id);
  const fullVideos = await getVideosByIds(videoIds);

  // Compute relevance score & sort
  const ranked = fullVideos
    .map(video => ({
      video,
      relevanceScore: computeRelevanceScore(trimmed, video)
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .map(r => r.video);

  // Cache sorted results
  cacheService.set(trimmed, ranked);

  return ranked;
}
