import { describe, it, expect, beforeEach } from 'vitest';
import {
  CineMorphCaptionController,
  SubtitleCue,
  findActiveCues,
} from '@omnistream/cinemorph/media';

describe('CineMorph Subtitle Subsystem & CaptionController Integration', () => {
  let controller: CineMorphCaptionController;

  const sampleTrackContent = `WEBVTT - Interstellar Master

1
00:00:01.000 --> 00:00:04.000
[dramatic organ music swelling]

2
00:00:04.500 --> 00:00:08.000
<v Cooper>We used to look up at the sky and wonder at our place in the stars.

3
00:00:10.000 --> 00:00:14.000
<v Brand>Mankind was born on Earth. It was never meant to die here.
`;

  beforeEach(() => {
    controller = new CineMorphCaptionController();
    controller.loadSubtitleFile(sampleTrackContent, 'interstellar.vtt');
    controller.setEnabled(true);
  });

  describe('Media Time Synchronization & Structured Cues', () => {
    it('returns structured SubtitleCue objects during active intervals', () => {
      const cues = controller.getActiveSubtitleCuesAtTime(2.0);
      expect(cues.length).toBe(1);
      expect(cues[0].text).toBe('[dramatic organ music swelling]');
      expect(cues[0].isSdh).toBe(true);
    });

    it('extracts speaker metadata and text accurately during dialogue cues', () => {
      const cues = controller.getActiveSubtitleCuesAtTime(6.0);
      expect(cues.length).toBe(1);
      expect(cues[0].speaker).toBe('Cooper');
      expect(cues[0].text).toBe('We used to look up at the sky and wonder at our place in the stars.');

      // Backward-compatible string accessor
      const text = controller.getActiveCueAtTime(6.0);
      expect(text).toBe('We used to look up at the sky and wonder at our place in the stars.');
    });

    it('returns empty array and null text during timecode gaps', () => {
      expect(controller.getActiveSubtitleCuesAtTime(8.5)).toEqual([]);
      expect(controller.getActiveCueAtTime(8.5)).toBeNull();
    });
  });

  describe('Seeking & State Continuity', () => {
    it('instantly flushes obsolete cues when seeking to a gap', () => {
      // Simulate playback at 6.0s (Cue 2 active)
      controller.handleTimeUpdate(6.0);
      expect(controller.getActiveText()).toBe('We used to look up at the sky and wonder at our place in the stars.');

      // User seeks to 8.5s (gap)
      controller.handleTimeUpdate(8.5);
      expect(controller.getActiveText()).toBeNull();
      expect(controller.getActiveCues()).toEqual([]);
    });

    it('instantly resolves the target cue when seeking forward or backward', () => {
      // Seek forward to 12.0s (Cue 3)
      controller.handleTimeUpdate(12.0);
      expect(controller.getActiveText()).toBe('Mankind was born on Earth. It was never meant to die here.');

      // Seek backward to 2.5s (Cue 1)
      controller.handleTimeUpdate(2.5);
      expect(controller.getActiveText()).toBe('[dramatic organ music swelling]');
    });

    it('silences active subtitles immediately when setEnabled(false) is called', () => {
      controller.handleTimeUpdate(6.0);
      expect(controller.getActiveText()).not.toBeNull();

      controller.setEnabled(false);
      expect(controller.getActiveText()).toBeNull();
      expect(controller.getActiveCues()).toEqual([]);
    });
  });

  describe('External File & Multi-Format Ingest', () => {
    it('loads and parses external SubRip (.srt) file seamlessly', () => {
      const srtContent = `1
00:00:01,000 --> 00:00:03,500
Dune: Arrakis desert.
`;
      controller.loadSubtitleFile(srtContent, 'dune.srt');
      expect(controller.getParsedCuesCount()).toBe(1);

      const active = controller.getActiveSubtitleCuesAtTime(2.0);
      expect(active.length).toBe(1);
      expect(active[0].speaker).toBe('Dune');
      expect(active[0].text).toBe('Arrakis desert.');
      expect(active[0].format).toBe('srt');
    });

    it('loads and parses external ASS file seamlessly', () => {
      const assContent = `[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:02.00,0:00:05.00,Default,Hero,0,0,0,,{\\b1}Fight on!{\\b0}
`;
      controller.loadSubtitleFile(assContent, 'anime.ass');
      expect(controller.getParsedCuesCount()).toBe(1);

      const active = controller.getActiveSubtitleCuesAtTime(3.0);
      expect(active.length).toBe(1);
      expect(active[0].speaker).toBe('Hero');
      expect(active[0].text).toBe('Fight on!');
      expect(active[0].format).toBe('ass');
    });

    it('clears subtitles and resets state cleanly on clearSubtitles()', () => {
      controller.handleTimeUpdate(2.0);
      controller.clearSubtitles();
      expect(controller.getParsedCuesCount()).toBe(0);
      expect(controller.getActiveText()).toBeNull();
      expect(controller.getActiveCues()).toEqual([]);
    });
  });
});
