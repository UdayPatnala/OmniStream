import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseSubtitleContent,
  parseTimecode,
  sanitizeCueText,
  CineMorphCaptionController,
} from '../../lib/cinemorph/captionService';

describe('CineMorph Real-Time Timed Captions & Subtitles Engine', () => {
  describe('Timecode and Text Parsing', () => {
    it('accurately parses standard WebVTT and SRT timecodes', () => {
      expect(parseTimecode('00:01:23.456')).toBeCloseTo(83.456, 3);
      expect(parseTimecode('01:23.456')).toBeCloseTo(83.456, 3);
      expect(parseTimecode('00:01:23,456')).toBeCloseTo(83.456, 3); // SRT comma
      expect(parseTimecode('02:10:05.100')).toBeCloseTo(7805.1, 3);
      expect(parseTimecode('')).toBeNull();
      expect(parseTimecode('invalid')).toBeNull();
    });

    it('sanitizes WebVTT and HTML tags while preserving text and line breaks', () => {
      const rawVtt = '<v Speaker>Hello <b>world</b>!</v>\n<c.yellow>Second line</c>';
      const sanitized = sanitizeCueText(rawVtt);
      expect(sanitized).toBe('Hello world!\nSecond line');

      const entityText = 'Tom &amp; Jerry &lt;3 &quot;Cinema&quot;';
      expect(sanitizeCueText(entityText)).toBe('Tom & Jerry <3 "Cinema"');
    });

    it('parses multi-cue WebVTT content with headers and settings', () => {
      const vtt = `WEBVTT - Cinema Sample

1
00:00:01.000 --> 00:00:03.500 align:center size:80%
Welcome to the cinema.

2
00:00:04.000 --> 00:00:07.000
Experience the story in 1.43:1.
Featuring pristine audio.
`;
      const cues = parseSubtitleContent(vtt);
      expect(cues.length).toBe(2);
      expect(cues[0].startTime).toBe(1.0);
      expect(cues[0].endTime).toBe(3.5);
      expect(cues[0].text).toBe('Welcome to the cinema.');

      expect(cues[1].startTime).toBe(4.0);
      expect(cues[1].endTime).toBe(7.0);
      expect(cues[1].text).toBe('Experience the story in 1.43:1.\nFeaturing pristine audio.');
    });

    it('parses SubRip (.srt) format with commas and numeric indexes', () => {
      const srt = `1
00:00:02,500 --> 00:00:05,000
First spoken dialogue line.

2
00:00:06,000 --> 00:00:09,500
Second dialogue response.
`;
      const cues = parseSubtitleContent(srt);
      expect(cues.length).toBe(2);
      expect(cues[0].startTime).toBe(2.5);
      expect(cues[0].endTime).toBe(5.0);
      expect(cues[0].text).toBe('First spoken dialogue line.');
      expect(cues[1].startTime).toBe(6.0);
      expect(cues[1].endTime).toBe(9.5);
    });
  });

  describe('CineMorphCaptionController Runtime Synchronization', () => {
    let controller: CineMorphCaptionController;

    beforeEach(() => {
      controller = new CineMorphCaptionController();
      controller.loadSubtitleFile(`
00:00:02.000 --> 00:00:05.000
First cinematic caption.

00:00:06.000 --> 00:00:08.500
Second synchronized line.
`);
    });

    it('Test 1 & 2: returns actual timed caption during active intervals and transitions smoothly', () => {
      // At t=0.5s -> no cue active
      expect(controller.getActiveCueAtTime(0.5)).toBeNull();

      // At t=2.5s -> first cue active
      expect(controller.getActiveCueAtTime(2.5)).toBe('First cinematic caption.');

      // At t=5.5s -> gap between cues -> no cue active
      expect(controller.getActiveCueAtTime(5.5)).toBeNull();

      // At t=7.0s -> second cue active
      expect(controller.getActiveCueAtTime(7.0)).toBe('Second synchronized line.');
    });

    it('Test 3: returns null when no cue is active (Never returns CC-title or placeholders)', () => {
      const textAtGap = controller.getActiveCueAtTime(1.0);
      expect(textAtGap).toBeNull();
      expect(textAtGap).not.toBe('CC-title');
      expect(textAtGap).not.toBe('[CC] Playing: Video');
    });

    it('Test 4: handles seeking backward and forward immediately', () => {
      // Seek forward into cue 2
      expect(controller.getActiveCueAtTime(6.5)).toBe('Second synchronized line.');
      // Seek backward into cue 1
      expect(controller.getActiveCueAtTime(3.0)).toBe('First cinematic caption.');
      // Seek out of bounds
      expect(controller.getActiveCueAtTime(10.0)).toBeNull();
    });

    it('Test 5: clearing subtitles resets active text to null', () => {
      expect(controller.getActiveCueAtTime(2.5)).toBe('First cinematic caption.');
      controller.clearSubtitles();
      expect(controller.getActiveCueAtTime(2.5)).toBeNull();
    });

    it('Test 6: disabling subtitles immediately silences active caption output', () => {
      expect(controller.getActiveCueAtTime(2.5)).toBe('First cinematic caption.');
      controller.setEnabled(false);
      expect(controller.getActiveCueAtTime(2.5)).toBeNull();
    });

    it('Test 7: change callback triggers only when caption content actually changes', () => {
      const callback = vi.fn();
      controller.setOnChange(callback);

      // Attach fake video
      const fakeVideo = {
        currentTime: 2.5,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        textTracks: [],
      } as unknown as HTMLVideoElement;

      controller.attachVideo(fakeVideo);
      expect(callback).toHaveBeenCalledWith('First cinematic caption.');

      // Update to same time / same cue -> callback should not fire again
      callback.mockClear();
      (controller as any).handleTimeUpdate();
      expect(callback).not.toHaveBeenCalled();

      // Advance to gap
      (fakeVideo as any).currentTime = 5.5;
      (controller as any).handleTimeUpdate();
      expect(callback).toHaveBeenCalledWith(null);
    });
  });
});
