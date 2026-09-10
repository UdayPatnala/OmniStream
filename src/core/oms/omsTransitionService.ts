/**
 * OMS Contextual Transition Service (Core Infrastructure)
 * Copyright (c) Patnala Uday Kumar. All rights reserved.
 *
 * Implements the official OMS Cross-Experience Transition Contract.
 * Governs the intentional handoff of active playback context from U-Tube to the
 * OmniStream Gateway and into CineMorph (and vice-versa) without losing timestamps
 * or forcing automatic unwanted navigation jumps.
 *
 * Zero product dependencies — pure core event and context contract.
 */

export interface OMSTransitionContext {
  contentId: string;
  sourceType: 'youtube' | 'local';
  sourceUrl: string;
  title: string;
  thumbnailUrl: string;
  posterUrl?: string;
  durationSeconds: number;
  currentTimestampSeconds: number;
  playbackState: 'playing' | 'paused';
  aspectRatioPreference?: 'original' | '1.90:1' | '1.43:1';
  transferredAt?: number;
}

export type HandoffListener = (context: OMSTransitionContext) => void;

export class OMSTransitionService {
  private activeContext: OMSTransitionContext | null = null;
  private onHandoffListeners: HandoffListener[] = [];
  private onEntryListeners: HandoffListener[] = [];

  public registerHandoffListener(fn: HandoffListener): () => void {
    this.onHandoffListeners.push(fn);
    return () => {
      this.onHandoffListeners = this.onHandoffListeners.filter(l => l !== fn);
    };
  }

  public registerCineMorphEntryListener(fn: HandoffListener): () => void {
    this.onEntryListeners.push(fn);
    return () => {
      this.onEntryListeners = this.onEntryListeners.filter(l => l !== fn);
    };
  }

  /**
   * Capture active viewing context and transition to OmniStream Gateway
   * allowing the user to intentionally choose their next destination.
   */
  public captureAndHandoffToGateway(
    params: {
      contentId?: string;
      video?: { id: string; title: string; thumbnails?: { high?: string; medium?: string; default?: string } };
      currentTime: number;
      duration?: number;
      isPlaying?: boolean;
    },
    navigate: (path: string, options?: { state?: any }) => void
  ): OMSTransitionContext {
    const videoId = params.contentId || params.video?.id || '';
    const title = params.video?.title || `Media Presentation: ${videoId}`;
    const thumbnail =
      params.video?.thumbnails?.high ||
      params.video?.thumbnails?.medium ||
      params.video?.thumbnails?.default ||
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    const context: OMSTransitionContext = {
      contentId: videoId,
      sourceType: 'youtube',
      sourceUrl: videoId,
      title,
      thumbnailUrl: thumbnail,
      durationSeconds: Number.isFinite(params.duration) && (params.duration || 0) > 0 ? (params.duration || 0) : 600,
      currentTimestampSeconds: Number.isFinite(params.currentTime) ? Math.max(0, Math.floor(params.currentTime)) : 0,
      playbackState: params.isPlaying !== false ? 'playing' : 'paused',
      aspectRatioPreference: '1.90:1',
      transferredAt: Date.now(),
    };

    this.activeContext = context;
    this.onHandoffListeners.forEach(fn => fn(context));

    navigate('/', {
      state: {
        fromOMS: true,
        carriedContext: context,
      },
    });

    return context;
  }

  /**
   * Intentionally enter CineMorph Theater with active carried context
   */
  public async executeCineMorphEntry(
    context: OMSTransitionContext,
    navigate: (path: string, options?: { state?: any }) => void
  ): Promise<void> {
    this.onEntryListeners.forEach(fn => fn(context));

    navigate(`/theater/${context.contentId}`, {
      state: {
        startTime: context.currentTimestampSeconds,
        autoPlay: context.playbackState === 'playing',
        omsHandoff: true,
      },
    });
  }

  /**
   * Intentionally resume in U-Tube Standard Player with active carried context
   */
  public executeUTubeResume(
    context: OMSTransitionContext,
    navigate: (path: string, options?: { state?: any }) => void
  ): void {
    navigate(`/watch/${context.contentId}`, {
      state: {
        startTime: context.currentTimestampSeconds,
        autoPlay: context.playbackState === 'playing',
        omsReturn: true,
      },
    });
  }

  /**
   * Package and initiate reverse handoff from CineMorph Theater back to U-Tube Player
   */
  public executeCineMorphToUTubeHandoff(
    params: {
      videoId: string;
      title: string;
      currentTime: number;
      duration: number;
      isPlaying: boolean;
    },
    navigate: (path: string, options?: { state?: any }) => void
  ): void {
    navigate(`/watch/${params.videoId}`, {
      state: {
        startTime: Number.isFinite(params.currentTime) ? Math.max(0, Math.floor(params.currentTime)) : 0,
        autoPlay: params.isPlaying,
        omsReturn: true,
      },
    });
  }

  /**
   * Retrieve active handoff context if available
   */
  public getActiveContext(): OMSTransitionContext | null {
    return this.activeContext;
  }

  /**
   * Clear active handoff context
   */
  public clearActiveContext(): void {
    this.activeContext = null;
  }
}

export const omsTransitionService = new OMSTransitionService();
