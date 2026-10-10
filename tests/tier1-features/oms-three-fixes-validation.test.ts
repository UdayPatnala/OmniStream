import { describe, it, expect, beforeEach } from 'vitest';
import { omsTransitionService } from '@omnistream/core/oms/omsTransitionService';
import { useCineMorphStore } from '@omnistream/cinemorph/state/useCineMorphStore';
import { useTicketStore } from '@omnistream/cinemorph/ticketing/useTicketStore';
import { useAppStore } from '@/src/store';
import { calculateTheaterProjectionLayout } from '@omnistream/cinemorph/pages/CineMorphTheater';
import { CineMorphCaptionController, parseSubtitleContent } from '@omnistream/cinemorph/media/captionService';
import { Video } from '@/src/types';

describe('Tier 1: OMS Three Fixes Validation (Original Selection, Screen/Seat Sightline, Captions)', () => {
  const dummyVideo: Video = {
    id: 'vid-test-original',
    title: 'Original Aspect Ratio Test Video',
    description: 'A test video for OMS aspect ratio validation',
    channelTitle: 'Test Channel',
    channelId: 'ch-test',
    publishedAt: new Date().toISOString(),
    viewCount: '1000',
    duration: '10:00',
    thumbnails: {
      default: 'https://i.ytimg.com/vi/vid-test-original/default.jpg',
      medium: 'https://i.ytimg.com/vi/vid-test-original/mqdefault.jpg',
      high: 'https://i.ytimg.com/vi/vid-test-original/hqdefault.jpg',
    },
  };

  beforeEach(() => {
    useAppStore.setState({
      frameAspectRatio: 'original',
    });
    useCineMorphStore.setState({
      aspectRatio: 'original',
      activeSession: null,
    });
    useTicketStore.setState({
      activeTicket: null,
    });
  });

  describe('Fix 1: Original Selection Tracking and State Cohesion', () => {
    it('Preserves original aspect ratio when initiating OMS gateway transition', () => {
      // Set user preference to original
      useAppStore.getState().setFrameAspectRatio('original');
      useCineMorphStore.getState().setAspectRatio('original');

      let navigatedPath = '';
      let navigatedState: any = null;
      const mockNavigate = (path: string, options?: any) => {
        navigatedPath = path;
        navigatedState = options?.state;
      };

      const transitionCtx = omsTransitionService.captureAndHandoffToGateway(
        {
          video: dummyVideo,
          currentTime: 120,
          duration: 600,
          isPlaying: true,
        },
        mockNavigate
      );

      expect(navigatedPath).toBe('/');
      expect(transitionCtx.aspectRatioPreference).toBe('original');
      expect(navigatedState?.carriedContext?.aspectRatioPreference).toBe('original');
    });

    it('Preserves custom aspect ratios (e.g. 1.43:1) when explicitly selected by user', () => {
      useAppStore.getState().setFrameAspectRatio('1.43:1');
      useCineMorphStore.getState().setAspectRatio('1.43:1');

      const transitionCtx = omsTransitionService.captureAndHandoffToGateway(
        {
          video: dummyVideo,
          currentTime: 60,
          duration: 300,
          isPlaying: true,
        },
        () => {}
      );

      expect(transitionCtx.aspectRatioPreference).toBe('1.43:1');
    });

    it('Preserves aspect ratio preference when executing CineMorph theater entry into active ticket', async () => {
      useAppStore.getState().setFrameAspectRatio('original');
      useCineMorphStore.getState().setAspectRatio('original');

      let navigatedPath = '';
      const mockNavigate = (path: string) => {
        navigatedPath = path;
      };

      await omsTransitionService.executeCineMorphEntry(
        {
          contentId: dummyVideo.id,
          sourceType: 'youtube',
          sourceUrl: dummyVideo.id,
          title: dummyVideo.title,
          thumbnailUrl: dummyVideo.thumbnails.high,
          durationSeconds: 600,
          currentTimestampSeconds: 45,
          playbackState: 'playing',
          aspectRatioPreference: 'original',
        },
        mockNavigate
      );

      expect(navigatedPath).toBe(`/theater/${dummyVideo.id}`);
      const ticket = useTicketStore.getState().activeTicket;
      expect(ticket).not.toBeNull();
      expect(ticket?.aspectRatio).toBe('original');
    });

    it('Synchronizes activeSession aspect ratio atomically when setAspectRatio is called', () => {
      // Start session
      useCineMorphStore.getState().setActiveSession({
        id: 'session-123',
        sourceType: 'local',
        aspectRatio: 'original',
        masteringPreset: 'theatrical',
        eqPreset: 'balanced',
        audioTracks: [],
        subtitleTracks: [],
      } as any);

      expect(useCineMorphStore.getState().activeSession?.aspectRatio).toBe('original');

      // Update to 1.90:1
      useCineMorphStore.getState().setAspectRatio('1.90:1');
      expect(useCineMorphStore.getState().aspectRatio).toBe('1.90:1');
      expect(useCineMorphStore.getState().activeSession?.aspectRatio).toBe('1.90:1');

      // Update back to original
      useCineMorphStore.getState().setAspectRatio('original');
      expect(useCineMorphStore.getState().aspectRatio).toBe('original');
      expect(useCineMorphStore.getState().activeSession?.aspectRatio).toBe('original');
    });
  });

  describe('Fix 2: Theater Screen and Seat Layout Sightline Clearance', () => {
    it('Allocates vertical clearance when theater seating is enabled to prevent screen/seat collision', () => {
      const windowedWithSeating = calculateTheaterProjectionLayout({
        isFullscreen: false,
        isOriginalMode: false,
        frameAspectRatio: '1.90:1',
        frameStyleAspectRatio: '1.90 / 1',
        nativeAspectRatio: null,
        theaterSeatingEnabled: true,
      });

      // Max height is constrained to 82vh / calc(100dvh - 5.5rem) to ensure clearance above seats
      expect(windowedWithSeating.maxHeight).toBe('min(82vh, calc(100dvh - 5.5rem))');
      expect(windowedWithSeating.maxWidth).toBe('min(98vw, calc(min(82vh, calc(100dvh - 5.5rem)) * (1.90 / 1)))');

      const fullscreenWithSeating = calculateTheaterProjectionLayout({
        isFullscreen: true,
        isOriginalMode: false,
        frameAspectRatio: '1.90:1',
        frameStyleAspectRatio: '1.90 / 1',
        nativeAspectRatio: null,
        theaterSeatingEnabled: true,
      });

      // Fullscreen with seating also allocates clearance
      expect(fullscreenWithSeating.maxHeight).toBe('min(88vh, calc(100dvh - 5rem))');
      expect(fullscreenWithSeating.maxWidth).toBe('min(99vw, calc(min(88vh, calc(100dvh - 5rem)) * (1.90 / 1)))');
    });

    it('Preserves full aperture dimensions when theater seating is disabled', () => {
      const windowedNoSeating = calculateTheaterProjectionLayout({
        isFullscreen: false,
        isOriginalMode: false,
        frameAspectRatio: '1.90:1',
        frameStyleAspectRatio: '1.90 / 1',
        nativeAspectRatio: null,
        theaterSeatingEnabled: false,
      });

      expect(windowedNoSeating.maxHeight).toBe('92vh');
      expect(windowedNoSeating.maxWidth).toBe('min(98vw, calc(92vh * (1.90 / 1)))');
    });

    it('Maintains backward compatibility when theaterSeatingEnabled parameter is omitted', () => {
      const legacyCall = calculateTheaterProjectionLayout({
        isFullscreen: false,
        isOriginalMode: false,
        frameAspectRatio: '1.43:1',
        frameStyleAspectRatio: '1.43 / 1',
        nativeAspectRatio: null,
      });

      expect(legacyCall.maxHeight).toBe('94vh');
      expect(legacyCall.maxWidth).toBe('min(98vw, calc(94vh * (1.43 / 1)))');
    });
  });

  describe('Fix 3: Closed Captions & Subtitle Engine', () => {
    it('Parses WebVTT subtitle files correctly into timed cues', () => {
      const vttContent = `WEBVTT

00:00:01.000 --> 00:00:04.000
Welcome to OmniStream Theater.

00:00:05.000 --> 00:00:08.500
Enjoy your cinematic experience.`;

      const cues = parseSubtitleContent(vttContent);
      expect(cues.length).toBe(2);
      expect(cues[0].text).toBe('Welcome to OmniStream Theater.');
      expect(cues[0].startTime).toBe(1);
      expect(cues[0].endTime).toBe(4);
      expect(cues[1].text).toBe('Enjoy your cinematic experience.');
      expect(cues[1].startTime).toBe(5);
      expect(cues[1].endTime).toBe(8.5);
    });

    it('Parses SubRip (SRT) subtitle files correctly into timed cues', () => {
      const srtContent = `1
00:00:02,000 --> 00:00:05,000
First line of dialogue

2
00:00:06,500 --> 00:00:09,000
Second line of dialogue`;

      const cues = parseSubtitleContent(srtContent);
      expect(cues.length).toBe(2);
      expect(cues[0].text).toBe('First line of dialogue');
      expect(cues[0].startTime).toBe(2);
      expect(cues[0].endTime).toBe(5);
      expect(cues[1].text).toBe('Second line of dialogue');
      expect(cues[1].startTime).toBe(6.5);
      expect(cues[1].endTime).toBe(9);
    });

    it('Matches active cue dynamically based on playback time update', () => {
      const controller = new CineMorphCaptionController();
      let renderedCue: string | null = null;
      controller.setOnChange((cue) => {
        renderedCue = cue;
      });

      controller.loadParsedCues([
        { id: '1', startTime: 2.0, endTime: 5.0, text: 'Active Dialogue Segment' },
        { id: '2', startTime: 6.0, endTime: 9.0, text: 'Second Dialogue Segment' },
      ]);
      controller.setEnabled(true);

      // Before first cue
      controller.handleTimeUpdate(1.0);
      expect(renderedCue).toBeNull();

      // Inside first cue
      controller.handleTimeUpdate(3.5);
      expect(renderedCue).toBe('Active Dialogue Segment');

      // Between cues
      controller.handleTimeUpdate(5.5);
      expect(renderedCue).toBeNull();

      // Inside second cue
      controller.handleTimeUpdate(7.2);
      expect(renderedCue).toBe('Second Dialogue Segment');

      // When subtitles disabled, rendered cue becomes null
      controller.setEnabled(false);
      expect(renderedCue).toBeNull();
    });

    it('Allows forcedTime updates for synchronized external/YouTube streams', () => {
      const controller = new CineMorphCaptionController();
      let renderedCue: string | null = null;
      controller.setOnChange((cue) => {
        renderedCue = cue;
      });

      controller.loadParsedCues([
        { id: '1', startTime: 10.0, endTime: 14.0, text: 'Synchronized Cue' },
      ]);
      controller.setEnabled(true);

      // Call handleTimeUpdate without native video element using forcedTime parameter
      controller.handleTimeUpdate(12.0);
      expect(renderedCue).toBe('Synchronized Cue');
    });
  });
});
