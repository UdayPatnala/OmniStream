import { describe, it, expect, beforeEach, vi } from 'vitest';
import { omsTransitionService } from '../services/omsTransitionService';
import { useTicketStore } from '../state/useTicketStore';
import { useAppStore } from '../store';
import { Video } from '../types';

describe('OMS Intentional Transition & Ecosystem Context Handoff', () => {
  const mockVideo: Video = {
    id: 'vid_test_intentional_123',
    title: 'Interstellar - Docking Scene 4K HDR',
    description: 'Directorial masterpiece',
    channelId: 'chan_sci_fi',
    channelTitle: 'Warner Bros. Entertainment',
    publishedAt: '2024-01-01T00:00:00Z',
    thumbnails: {
      default: 'https://i.ytimg.com/vi/vid_test_intentional_123/default.jpg',
      medium: 'https://i.ytimg.com/vi/vid_test_intentional_123/mqdefault.jpg',
      high: 'https://i.ytimg.com/vi/vid_test_intentional_123/hqdefault.jpg',
    },
  };

  beforeEach(() => {
    omsTransitionService.clearActiveContext();
    useTicketStore.setState({ tickets: [] });
  });

  it('captures active viewing context and navigates to OmniStream Gateway (not directly to CineMorph)', () => {
    const mockNavigate = vi.fn();

    const context = omsTransitionService.captureAndHandoffToGateway(
      {
        video: mockVideo,
        currentTime: 142.5,
        duration: 320,
        isPlaying: true,
      },
      mockNavigate
    );

    expect(context.contentId).toBe('vid_test_intentional_123');
    expect(context.currentTimestampSeconds).toBe(142);
    expect(context.durationSeconds).toBe(320);
    expect(context.title).toBe('Interstellar - Docking Scene 4K HDR');

    // Verified: navigates to OmniStream Gateway '/' carrying context, NOT directly to CineMorph
    expect(mockNavigate).toHaveBeenCalledWith('/', {
      state: {
        fromOMS: true,
        carriedContext: context,
      },
    });

    // Verified: stored in active context
    expect(omsTransitionService.getActiveContext()).toEqual(context);

    // Verified: watch position saved in AppStore
    const savedPos = useAppStore.getState().watchPositions['vid_test_intentional_123'];
    expect(savedPos).toBeDefined();
    expect(savedPos.timestamp).toBe(142);
  });

  it('allows user to intentionally execute CineMorph entry from carried context', async () => {
    const mockNavigate = vi.fn();
    const context = omsTransitionService.captureAndHandoffToGateway(
      {
        video: mockVideo,
        currentTime: 75,
        duration: 200,
        isPlaying: true,
      },
      vi.fn()
    );

    await omsTransitionService.executeCineMorphEntry(context, mockNavigate);

    expect(mockNavigate).toHaveBeenCalledWith('/theater/vid_test_intentional_123', {
      state: {
        startTime: 75,
        autoPlay: true,
        omsHandoff: true,
      },
    });
  });

  it('allows user to intentionally resume in U-Tube standard player from carried context', () => {
    const mockNavigate = vi.fn();
    const context = omsTransitionService.captureAndHandoffToGateway(
      {
        video: mockVideo,
        currentTime: 90,
        duration: 180,
        isPlaying: true,
      },
      vi.fn()
    );

    omsTransitionService.executeUTubeResume(context, mockNavigate);

    expect(mockNavigate).toHaveBeenCalledWith('/watch/vid_test_intentional_123', {
      state: {
        startTime: 90,
        autoPlay: true,
        omsReturn: true,
      },
    });
  });

  it('clears active context on demand', () => {
    omsTransitionService.captureAndHandoffToGateway(
      {
        video: mockVideo,
        currentTime: 10,
        duration: 100,
      },
      vi.fn()
    );

    expect(omsTransitionService.getActiveContext()).not.toBeNull();
    omsTransitionService.clearActiveContext();
    expect(omsTransitionService.getActiveContext()).toBeNull();
  });
});
