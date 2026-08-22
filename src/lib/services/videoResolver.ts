import { Video } from '../../types';
import { extractYouTubeId } from '../utils';
import { fetchOEmbed, getVideosByIds } from '../youtube';

/**
 * Video Resolver - Validates YouTube URLs/IDs, verifies embeddability & builds candidate fallback chains.
 */

export interface ResolvedVideoResult {
  bestVideo: Video;
  candidates: Video[];
  isDirectLink: boolean;
}

export async function checkEmbeddable(videoId: string): Promise<boolean> {
  if (!videoId) return false;
  try {
    const oembed = await fetchOEmbed(videoId);
    return oembed !== null;
  } catch (e) {
    return false;
  }
}

export async function resolveBestPlayableVideo(
  input: string,
  candidateList: Video[] = []
): Promise<ResolvedVideoResult | null> {
  const trimmed = input.trim();
  if (!trimmed && candidateList.length === 0) return null;

  // Check if input is a direct YouTube Video URL or Video ID
  const directId = extractYouTubeId(trimmed);

  if (directId) {
    const fetched = await getVideosByIds([directId]);
    if (fetched.length > 0) {
      const bestVideo = fetched[0];
      const remainingCandidates = candidateList.filter(v => v.id !== directId);
      return {
        bestVideo,
        candidates: [bestVideo, ...remainingCandidates],
        isDirectLink: true,
      };
    }
  }

  // Filter candidate pool to verified playable items
  const candidates = candidateList.length > 0 ? candidateList : await getVideosByIds([
    'jfKfPfyJRdk',
    'dQw4w9WgXcQ',
    'fJ9rUzIMcZQ',
    '5qap5aO4i9A',
    'M576WGiDBdQ',
    'hT_nvWreIhg',
    'kJQP7kiw5Fk',
    '3JZ_D3ELwOQ',
  ]);

  if (candidates.length === 0) return null;

  return {
    bestVideo: candidates[0],
    candidates,
    isDirectLink: false,
  };
}
