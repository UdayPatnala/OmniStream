/**
 * OMS Contextual Transition Service
 * Copyright (c) Patnala Uday Kumar. All rights reserved.
 *
 * Implements the official OMS Cross-Experience Transition Contract.
 * Governs the intentional handoff of active playback context from U-Tube to the
 * OmniStream Gateway and into CineMorph (and vice-versa) without losing timestamps
 * or forcing automatic unwanted navigation jumps.
 */

import { Video } from '../types';
import { useTicketStore } from '../state/useTicketStore';
import { useCineMorphStore } from '../state/useCineMorphStore';
import { useAppStore } from '../store';

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

class OMSTransitionService {
  private activeContext: OMSTransitionContext | null = null;

  /**
   * Capture active viewing context and transition to OmniStream Gateway
   * allowing the user to intentionally choose their next destination.
   */
  public captureAndHandoffToGateway(
    params: {
      video: Video;
      currentTime: number;
      duration?: number;
      isPlaying?: boolean;
    },
    navigate: (path: string, options?: { state?: any }) => void
  ): OMSTransitionContext {
    const { video, currentTime, duration = 0, isPlaying = true } = params;

    const thumbnail =
      video.thumbnails?.high ||
      video.thumbnails?.medium ||
      video.thumbnails?.default ||
      `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;

    const context: OMSTransitionContext = {
      contentId: video.id,
      sourceType: 'youtube',
      sourceUrl: video.id,
      title: video.title,
      thumbnailUrl: thumbnail,
      durationSeconds: Number.isFinite(duration) && duration > 0 ? duration : 600,
      currentTimestampSeconds: Number.isFinite(currentTime) ? Math.max(0, Math.floor(currentTime)) : 0,
      playbackState: isPlaying ? 'playing' : 'paused',
      aspectRatioPreference: '1.90:1',
      transferredAt: Date.now(),
    };

    this.activeContext = context;

    // Save watch position in App Store
    useAppStore.getState().saveWatchPosition(video.id, context.currentTimestampSeconds, context.durationSeconds);

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
    // Clear any stale local media to prevent media identity collision
    useAppStore.getState().setActiveLocalMedia(null);

    // Populate active session ticket immediately with carried context metadata
    useTicketStore.setState({
      activeTicket: {
        ticketId: `ticket-${context.contentId}`,
        movieTitle: context.title,
        aspectRatio: context.aspectRatioPreference || '1.90:1',
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
