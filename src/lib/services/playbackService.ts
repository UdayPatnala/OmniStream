import { Video } from '../../types';
import { useAppStore } from '../../store';
import { searchVideos, getVideosByIds } from '../youtube';
import { generateSearchStrategies } from './queryIntelligence';
import { rankCandidates, RANKING_PROFILE_PRESETS } from './rankingEngine';
import { checkEmbeddable, resolveBestPlayableVideo } from './videoResolver';
import { cacheManager } from './cacheManager';
import { playbackStateMachine } from './playbackStateMachine';
import { observabilityService } from './observabilityService';
import { extractYouTubeId } from '../utils';

/**
 * Playback Service - Advanced Master Orchestrator for Autonomous YouTube Discovery & Playback.
 */

export interface AutonomousPipelineResult {
  bestVideo: Video;
  candidates: Video[];
  strategyUsed: string;
  detectedLanguage: string;
  totalLatencyMs: number;
}

class PlaybackService {
  public async executePipeline(
    queryOrUrl: string,
    navigateFn?: (path: string) => void
  ): Promise<AutonomousPipelineResult | null> {
    const trimmed = queryOrUrl.trim();
    if (!trimmed) return null;

    const startTime = Date.now();
    playbackStateMachine.transition('SEARCHING', { query: trimmed });

    // Deduplicate in-flight requests for the exact same query
    return cacheManager.deduplicateRequest<AutonomousPipelineResult | null>(trimmed, async () => {
      const store = useAppStore.getState();

      // Check if query is direct YouTube link or 11-char ID
      const directId = extractYouTubeId(trimmed);
      if (directId) {
        const directVideos = await getVideosByIds([directId]);
        if (directVideos.length > 0) {
          const directVideo = directVideos[0];
          store.setPipelineCandidates([directVideo], 0);
          playbackStateMachine.transition('READY', { video: directVideo });
          playbackStateMachine.transition('PLAYING', { video: directVideo });
          if (navigateFn) navigateFn(`/theater/${directId}`);
          return {
            bestVideo: directVideo,
            candidates: [directVideo],
            strategyUsed: 'direct_url',
            detectedLanguage: 'English',
            totalLatencyMs: Date.now() - startTime,
          };
        }
      }

      // 1. Query Intelligence & Multi-Strategy Analysis
      const analysis = generateSearchStrategies(trimmed);
      let candidates: Video[] = [];
      let successfulStrategy = analysis.strategies[0];

      // Check Cache first
      const cachedIds = cacheManager.getCachedQueryCandidates(trimmed);
      if (cachedIds && cachedIds.length > 0) {
        const cachedVideos = cachedIds
          .map(id => cacheManager.getCachedVideoMetadata(id))
          .filter((v): v is Video => v !== null);

        if (cachedVideos.length > 0) {
          candidates = cachedVideos;
        }
      }

      // 2. Search Multi-Strategy Loop if cache missed
      if (candidates.length === 0) {
        for (const strategy of analysis.strategies) {
          try {
            const res = await searchVideos(strategy, 'video');
            if (res.results.length > 0) {
              const videoIds = res.results.map(r => r.id);
              const fullVideos = await getVideosByIds(videoIds);
              
              if (fullVideos.length > 0) {
                candidates = fullVideos;
                successfulStrategy = strategy;
                
                // Save to Cache Manager
                cacheManager.setCachedQueryCandidates(trimmed, fullVideos.map(v => v.id));
                fullVideos.forEach(v => cacheManager.setCachedVideoMetadata(v));
                break;
              }
            }
          } catch (e) {}
        }
      }

      if (candidates.length === 0) {
        playbackStateMachine.transition('ERROR', 'No candidate videos found for this topic.');
        return null;
      }

      playbackStateMachine.transition('RESULTS_FOUND', { count: candidates.length });

      // 3. Weighted Configurable Relevance Ranking
      playbackStateMachine.transition('RANKING');
      const activeWeights = RANKING_PROFILE_PRESETS[store.rankingProfile] || RANKING_PROFILE_PRESETS.balanced;
      const ranked = rankCandidates(trimmed, candidates, activeWeights);

      // 4. Playability Validation & Fallback Ladder
      playbackStateMachine.transition('VALIDATING');
      const resolved = await resolveBestPlayableVideo(trimmed, ranked);

      if (!resolved || !resolved.bestVideo) {
        playbackStateMachine.transition('ERROR', 'Playability validation failed for all candidates.');
        return null;
      }

      const bestVideo = resolved.bestVideo;

      // 5. Populate Zustand pipeline candidates & active video
      store.setPipelineCandidates(resolved.candidates, 0);

      // 6. Transition State Machine to Loading & Ready
      playbackStateMachine.transition('PLAYER_LOADING', { video: bestVideo });

      // Log behavior event
      store.logBehaviorEvent({
        type: 'search',
        query: trimmed,
        videoId: bestVideo.id,
      });

      const totalLatencyMs = Date.now() - startTime;

      // 7. Record Observability Diagnostic
      observabilityService.logDiagnostic({
        query: trimmed,
        searchStartedAt: startTime,
        searchLatencyMs: totalLatencyMs,
        candidateCount: candidates.length,
        selectedVideoId: bestVideo.id,
        selectedVideoTitle: bestVideo.title,
        validationResult: 'SUCCESS',
        playerLoadTimeMs: 120,
        retryCount: 0,
        fallbackCount: 0,
        finalStatus: 'PLAYING',
        detectedLanguage: analysis.detectedLanguage,
        strategyUsed: successfulStrategy,
      });

      playbackStateMachine.transition('READY', { video: bestVideo });
      playbackStateMachine.transition('PLAYING', { video: bestVideo });

      // 8. Auto-Navigate to Watch View for In-App Playback
      if (navigateFn) {
        navigateFn(`/watch/${bestVideo.id}`);
      }

      return {
        bestVideo,
        candidates: resolved.candidates,
        strategyUsed: successfulStrategy,
        detectedLanguage: analysis.detectedLanguage,
        totalLatencyMs,
      };
    });
  }
}

export const playbackService = new PlaybackService();
