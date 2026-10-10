import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  validateCineMorphMedia,
  SUPPORTED_VIDEO_EXTENSIONS,
  getNonVideoErrorMessage,
  VERTICAL_VIDEO_ERROR_MESSAGE,
} from '@omnistream/cinemorph/media/mediaValidator';

describe('Tier 2: CineMorph Media Validation — Vertical & Non-Video Rejection', () => {
  let originalCreateElement: typeof document.createElement;
  let originalCreateObjectURL: typeof URL.createObjectURL;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL;

  beforeEach(() => {
    originalCreateElement = document.createElement.bind(document);
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;

    URL.createObjectURL = vi.fn(() => 'blob:mock-cinemorph-probe-url');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    document.createElement = originalCreateElement;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    vi.restoreAllMocks();
  });

  // Helper to mock video element with specific native dimensions
  function mockVideoElement(width: number, height: number, simulateError = false) {
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName.toLowerCase() === 'video') {
        const mockVideo = originalCreateElement('video') as HTMLVideoElement;
        
        Object.defineProperty(mockVideo, 'videoWidth', {
          configurable: true,
          get: () => width,
        });
        Object.defineProperty(mockVideo, 'videoHeight', {
          configurable: true,
          get: () => height,
        });

        // Trigger loadedmetadata or error on src assignment
        let srcValue = '';
        Object.defineProperty(mockVideo, 'src', {
          configurable: true,
          get: () => srcValue,
          set: (val: string) => {
            srcValue = val;
            setTimeout(() => {
              if (simulateError) {
                mockVideo.onerror?.(new Event('error'));
              } else {
                mockVideo.onloadedmetadata?.(new Event('loadedmetadata'));
              }
            }, 5);
          },
        });

        return mockVideo;
      }
      return originalCreateElement(tagName);
    });
  }

  describe('1. Non-Video Rejection', () => {
    it('rejects audio files with audio MIME types', async () => {
      const audioFiles = [
        new File(['audio data'], 'soundtrack.mp3', { type: 'audio/mp3' }),
        new File(['audio data'], 'master.wav', { type: 'audio/wav' }),
        new File(['audio data'], 'score.flac', { type: 'audio/flac' }),
        new File(['audio data'], 'voice.m4a', { type: 'audio/m4a' }),
      ];

      for (const file of audioFiles) {
        const res = await validateCineMorphMedia(file);
        expect(res.isValid).toBe(false);
        expect(res.error).toMatch(/CineMorph accepts video files only/i);
      }
    });

    it('rejects image files with image MIME types', async () => {
      const imageFiles = [
        new File(['image data'], 'poster.png', { type: 'image/png' }),
        new File(['image data'], 'still.jpg', { type: 'image/jpeg' }),
        new File(['image data'], 'backdrop.webp', { type: 'image/webp' }),
      ];

      for (const file of imageFiles) {
        const res = await validateCineMorphMedia(file);
        expect(res.isValid).toBe(false);
        expect(res.error).toMatch(/CineMorph accepts video files only/i);
      }
    });

    it('rejects documents, archives, and text files', async () => {
      const miscFiles = [
        new File(['doc data'], 'script.pdf', { type: 'application/pdf' }),
        new File(['text data'], 'subtitles.txt', { type: 'text/plain' }),
        new File(['zip data'], 'bundle.zip', { type: 'application/zip' }),
      ];

      for (const file of miscFiles) {
        const res = await validateCineMorphMedia(file);
        expect(res.isValid).toBe(false);
        expect(res.error).toMatch(/CineMorph accepts video files only/i);
      }
    });

    it('rejects files with non-video extensions even if MIME type is missing', async () => {
      const files = [
        new File(['fake'], 'recording.mp3', { type: '' }),
        new File(['fake'], 'photo.jpeg', { type: '' }),
        new File(['fake'], 'archive.tar', { type: '' }),
      ];

      for (const file of files) {
        const res = await validateCineMorphMedia(file);
        expect(res.isValid).toBe(false);
        expect(res.error).toMatch(/CineMorph accepts video files only/i);
      }
    });
  });

  describe('2. Vertical / Portrait Video Rejection', () => {
    it('rejects 9:16 vertical smartphone videos (e.g. 1080x1920)', async () => {
      mockVideoElement(1080, 1920);
      const file = new File(['dummy'], 'shorts_reel.mp4', { type: 'video/mp4' });

      const res = await validateCineMorphMedia(file);
      expect(res.isValid).toBe(false);
      expect(res.error).toBe(VERTICAL_VIDEO_ERROR_MESSAGE);
      expect(res.width).toBe(1080);
      expect(res.height).toBe(1920);
      expect(res.aspectRatio).toBeCloseTo(1080 / 1920, 3);
    });

    it('rejects 3:4 portrait videos (e.g. 720x960)', async () => {
      mockVideoElement(720, 960);
      const file = new File(['dummy'], 'portrait_clip.webm', { type: 'video/webm' });

      const res = await validateCineMorphMedia(file);
      expect(res.isValid).toBe(false);
      expect(res.error).toBe(VERTICAL_VIDEO_ERROR_MESSAGE);
    });

    it('rejects extreme vertical videos (e.g. 1:2 aspect ratio, 540x1080)', async () => {
      mockVideoElement(540, 1080);
      const file = new File(['dummy'], 'tall_story.mp4', { type: 'video/mp4' });

      const res = await validateCineMorphMedia(file);
      expect(res.isValid).toBe(false);
      expect(res.error).toBe(VERTICAL_VIDEO_ERROR_MESSAGE);
    });
  });

  describe('3. Landscape & Square Video Acceptance', () => {
    it('accepts standard 16:9 landscape videos (e.g. 1920x1080)', async () => {
      mockVideoElement(1920, 1080);
      const file = new File(['dummy'], 'cinema_feature.mp4', { type: 'video/mp4' });

      const res = await validateCineMorphMedia(file);
      expect(res.isValid).toBe(true);
      expect(res.error).toBeUndefined();
      expect(res.width).toBe(1920);
      expect(res.height).toBe(1080);
      expect(res.aspectRatio).toBeCloseTo(1920 / 1080, 3);
    });

    it('accepts IMAX 1.43:1 and 1.90:1 landscape aspect ratios', async () => {
      mockVideoElement(1430, 1000);
      const fileImax = new File(['dummy'], 'imax_70mm.mkv', { type: 'video/x-matroska' });
      const resImax = await validateCineMorphMedia(fileImax);
      expect(resImax.isValid).toBe(true);

      mockVideoElement(1900, 1000);
      const fileDigitalImax = new File(['dummy'], 'imax_laser.mp4', { type: 'video/mp4' });
      const resDigitalImax = await validateCineMorphMedia(fileDigitalImax);
      expect(resDigitalImax.isValid).toBe(true);
    });

    it('accepts 21:9 ultrawide / anamorphic cinema videos (e.g. 2560x1080)', async () => {
      mockVideoElement(2560, 1080);
      const file = new File(['dummy'], 'anamorphic_film.mov', { type: 'video/quicktime' });

      const res = await validateCineMorphMedia(file);
      expect(res.isValid).toBe(true);
    });

    it('accepts square 1:1 videos (width === height, e.g. 1080x1080)', async () => {
      mockVideoElement(1080, 1080);
      const file = new File(['dummy'], 'square_presentation.mp4', { type: 'video/mp4' });

      const res = await validateCineMorphMedia(file);
      expect(res.isValid).toBe(true);
      expect(res.aspectRatio).toBe(1);
    });
  });

  describe('4. Resource Lifecycle & Probing Cleanup', () => {
    it('revokes probe blob URL immediately after metadata analysis', async () => {
      mockVideoElement(1920, 1080);
      const file = new File(['dummy'], 'test.mp4', { type: 'video/mp4' });

      await validateCineMorphMedia(file);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-cinemorph-probe-url');
    });

    it('revokes probe blob URL even when video is rejected as vertical', async () => {
      mockVideoElement(1080, 1920);
      const file = new File(['dummy'], 'vertical.mp4', { type: 'video/mp4' });

      await validateCineMorphMedia(file);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-cinemorph-probe-url');
    });
  });
});
