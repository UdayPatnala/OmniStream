/**
 * OMS Contextual Transition Service (Core Infrastructure)
 * Copyright (c) Patnala Uday Kumar. All rights reserved.
 *
 * Implements the official OMS Cross-Experience Transition Contract.
 * Governs the intentional handoff of active playback context from U-Tube to the
 * OmniStream Gateway and into CineMorph (and vice-versa) without losing timestamps
 * or forcing automatic unwanted navigation jumps.
 */

import { Video } from '../../types';
import { useTicketStore, useCineMorphStore, useAppStore } from '../../store';

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
      video?: { id?: string; title?: string; thumbnails?: { high?: string; medium?: string; default?: string } } | Video;
      currentTime: number;
      duration?: number;
      isPlaying?: boolean;
      aspectRatioPreference?: 'original' | '1.90:1' | '1.43:1';
    },
    navigate: (path: string, options?: { state?: any }) => void
  ): OMSTransitionContext {
    const video = (params.video as any) || {};
    const videoId = params.contentId || video.id || '';
    const title = video.title || `Media Presentation: ${videoId}`;
    const duration = params.duration ?? 0;
    const currentTime = params.currentTime;
    const isPlaying = params.isPlaying !== false;

    const thumbnail =
      video.thumbnails?.high ||
      video.thumbnails?.medium ||
      video.thumbnails?.default ||
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    const activeAppRatio = useAppStore.getState().frameAspectRatio;
    const activeCineRatio = useCineMorphStore.getState().aspectRatio;
    const resolvedRatio: 'original' | '1.90:1' | '1.43:1' =
      (params as any).aspectRatioPreference ||
      (activeAppRatio === 'original' || activeAppRatio === '1.90:1' || activeAppRatio === '1.43:1' ? activeAppRatio : undefined) ||
      (activeCineRatio === 'original' || activeCineRatio === '1.90:1' || activeCineRatio === '1.43:1' ? activeCineRatio : undefined) ||
      'original';

    const context: OMSTransitionContext = {
      contentId: videoId,
      sourceType: 'youtube',
      sourceUrl: videoId,
      title,
      thumbnailUrl: thumbnail,
      durationSeconds: Number.isFinite(duration) && duration > 0 ? duration : 600,
      currentTimestampSeconds: Number.isFinite(currentTime) ? Math.max(0, Math.floor(currentTime)) : 0,
      playbackState: isPlaying ? 'playing' : 'paused',
      aspectRatioPreference: resolvedRatio,
      transferredAt: Date.now(),
    };

    this.activeContext = context;
    this.onHandoffListeners.forEach(fn => fn(context));

    // Save watch position in App Store
    if (typeof useAppStore.getState().saveWatchPosition === 'function') {
      useAppStore.getState().saveWatchPosition(videoId, context.currentTimestampSeconds, context.durationSeconds);
    }

    // Update CineMorph Store
    useCineMorphStore.setState({
      playbackTimestamp: context.currentTimestampSeconds,
      isPlaying: context.playbackState === 'playing',
    });

    // Navigate to OmniStream Gateway carrying context
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

    // Clear any stale local media to prevent media identity collision
    useAppStore.getState().setActiveLocalMedia(null);

    const resolvedRatio = context.aspectRatioPreference || useAppStore.getState().frameAspectRatio || 'original';

    // Populate active session ticket immediately with carried context metadata
    useTicketStore.setState({
      activeTicket: {
        ticketId: `ticket-${context.contentId}`,
        movieTitle: context.title,
        aspectRatio: resolvedRatio === '1.43:1' ? '1.43:1' : resolvedRatio === '1.90:1' ? '1.90:1' : 'original',
        framingRule: 'auto',
        seatAssignment: 'ROW A • SWEETSPOT',
        sourceUrl: context.sourceUrl,
        timestampSeconds: context.currentTimestampSeconds,
        durationSeconds: context.durationSeconds,
        thumbnailDataUrl: context.thumbnailUrl,
        isLocal: false,
        printedAt: Date.now(),
      },
      isPrintingAnimationActive: false,
    });

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
    const { videoId, currentTime, isPlaying } = params;

    // Return safely to standard U-Tube watch player
    navigate(`/watch/${videoId}`, {
      state: {
        startTime: Number.isFinite(currentTime) ? Math.max(0, Math.floor(currentTime)) : 0,
        autoPlay: isPlaying,
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
