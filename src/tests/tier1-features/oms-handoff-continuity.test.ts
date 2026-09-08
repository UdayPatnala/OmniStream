import { describe, it, expect, beforeEach, vi } from 'vitest';
import { omsTransitionService } from '../../services/omsTransitionService';
import { useTicketStore } from '../../state/useTicketStore';
import { useAppStore } from '../../store';
import { Video } from '../../types';

describe('Tier 1: OMS Handoff Continuity & Ecosystem Bridge', () => {
  const mockVideo: Video = {
    id: 'vid_dune_sandworm_4k',
    title: 'Dune: Part Two - Sandworm Ride (IMAX 4K)',
    description: 'Paul Atreides summons the grandfather of the desert.',
    channelId: 'chan_legendary',
    channelTitle: 'Legendary Pictures',
    publishedAt: '2024-03-01T00:00:00Z',
    thumbnails: {
      default: 'https://i.ytimg.com/vi/vid_dune_sandworm_4k/default.jpg',
      medium: 'https://i.ytimg.com/vi/vid_dune_sandworm_4k/mqdefault.jpg',
      high: 'https://i.ytimg.com/vi/vid_dune_sandworm_4k/hqdefault.jpg',
    },
  };

  beforeEach(() => {
    omsTransitionService.clearActiveContext();
    useTicketStore.setState({ activeTicket: null, isPrintingAnimationActive: false });
    useAppStore.setState({ activeLocalMedia: null });
  });

  it('OMS-01: U-Tube captures viewing context with exact timestamp and prepares Gateway handoff', () => {
    const mockNavigate = vi.fn();

    const context = omsTransitionService.captureAndHandoffToGateway(
      {
        video: mockVideo,
        currentTime: 2538.7, // 00:42:18
        duration: 9960,
        isPlaying: true,
      },
      mockNavigate
    );

    expect(context.contentId).toBe('vid_dune_sandworm_4k');
    expect(context.currentTimestampSeconds).toBe(2538);
    expect(context.durationSeconds).toBe(9960);
    expect(context.playbackState).toBe('playing');
    expect(context.transferredAt).toBeGreaterThan(0);

    // Navigates to Gateway root carrying context
    expect(mockNavigate).toHaveBeenCalledWith('/', {
      state: {
        fromOMS: true,
        carriedContext: context,
      },
    });

    // Saved in AppStore watch positions
    const saved = useAppStore.getState().watchPositions['vid_dune_sandworm_4k'];
    expect(saved).toBeDefined();
    expect(saved.timestamp).toBe(2538);
  });

  it('OMS-02: Entering CineMorph Theater via OMS carries startTime and resets stale local media', async () => {
    const mockNavigate = vi.fn();

    // Simulate stale local media in store from an earlier screening
    useAppStore.setState({
      activeLocalMedia: {
        id: 'local-old-file',
        name: 'Old Movie.mp4',
        size: 1024,
        type: 'video/mp4',
        url: 'blob:old-movie-url',
        duration: 100,
        progress: 50,
        lastWatchedAt: Date.now(),
        aspectRatio: '16:9',
      },
    });

    const context = omsTransitionService.captureAndHandoffToGateway(
      {
        video: mockVideo,
        currentTime: 120,
        duration: 600,
        isPlaying: false,
      },
      vi.fn()
    );

    await omsTransitionService.executeCineMorphEntry(context, mockNavigate);

    // Verified: Stale local media in store is cleared so identity collision is impossible
    expect(useAppStore.getState().activeLocalMedia).toBeNull();

    // Verified: Active ticket immediately populated with carried stream context
    const activeTicket = useTicketStore.getState().activeTicket;
    expect(activeTicket).not.toBeNull();
    expect(activeTicket?.movieTitle).toBe('Dune: Part Two - Sandworm Ride (IMAX 4K)');
    expect(activeTicket?.timestampSeconds).toBe(120);

    // Verified: Navigation passes startTime and autoPlay state to destination
    expect(mockNavigate).toHaveBeenCalledWith('/theater/vid_dune_sandworm_4k', {
      state: {
        startTime: 120,
        autoPlay: false,
        omsHandoff: true,
      },
    });
  });

  it('OMS-03: Reverse handoff from CineMorph Theater back to U-Tube transfers playback position', () => {
    const mockNavigate = vi.fn();

    omsTransitionService.executeCineMorphToUTubeHandoff(
      {
        videoId: 'vid_dune_sandworm_4k',
        title: 'Dune: Part Two - Sandworm Ride (IMAX 4K)',
        currentTime: 3100.4,
        duration: 9960,
        isPlaying: true,
      },
      mockNavigate
    );

    expect(mockNavigate).toHaveBeenCalledWith('/watch/vid_dune_sandworm_4k', {
      state: {
        startTime: 3100,
        autoPlay: true,
        omsReturn: true,
      },
    });
  });

  it('OMS-04: Negative or NaN timestamps are clamped safely to 0', () => {
    const mockNavigate = vi.fn();

    const negativeContext = omsTransitionService.captureAndHandoffToGateway(
      {
        video: mockVideo,
        currentTime: -45,
        duration: 100,
      },
      mockNavigate
    );
    expect(negativeContext.currentTimestampSeconds).toBe(0);

    const nanContext = omsTransitionService.captureAndHandoffToGateway(
      {
        video: mockVideo,
        currentTime: NaN,
        duration: 100,
      },
      mockNavigate
    );
    expect(nanContext.currentTimestampSeconds).toBe(0);
  });

  it('OMS-05: Dismissing carried context cleans up active context without side effects', () => {
    omsTransitionService.captureAndHandoffToGateway(
      {
        video: mockVideo,
        currentTime: 50,
        duration: 200,
      },
      vi.fn()
    );

    expect(omsTransitionService.getActiveContext()).not.toBeNull();
    omsTransitionService.clearActiveContext();
    expect(omsTransitionService.getActiveContext()).toBeNull();
  });
});
