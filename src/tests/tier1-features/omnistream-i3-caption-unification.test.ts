import { describe, it, expect, beforeEach } from 'vitest';
import {
  CineMorphCaptionController,
  parseSubtitleContent,
  sanitizeCueText,
  parseTimecode,
} from '../../lib/cinemorph/captionService';

describe('OMNISTREAM ISSUE FIX I3 — Caption System Repair & Visual Unification', () => {
  let controller: CineMorphCaptionController;

  const sampleVtt = `WEBVTT - Sample Caption Track

1
00:00:01.000 --> 00:00:04.000
<v Narrator>Welcome to <b>OmniStream</b> Cinema.

2
00:00:05.500 --> 00:00:09.000
Experience pristine visual clarity and immersion.

3
00:00:12.000 --> 00:00:16.000
Multi-line subtitle cue line 1.
Multi-line subtitle cue line 2.
`;

  beforeEach(() => {
    controller = new CineMorphCaptionController();
    controller.loadSubtitleFile(sampleVtt);
    controller.setEnabled(true);
  });

  describe('Part 1: Real-Time Synchronization & Zero Placeholders', () => {
    it('returns exact sanitized caption text during active playback intervals', () => {
      expect(controller.getActiveCueAtTime(2.0)).toBe('Welcome to OmniStream Cinema.');
      expect(controller.getActiveCueAtTime(6.5)).toBe('Experience pristine visual clarity and immersion.');
    });

    it('returns null during gaps between cues (Never returns "CC-title" or placeholder text)', () => {
      const gapText = controller.getActiveCueAtTime(4.5);
      expect(gapText).toBeNull();
      expect(gapText).not.toBe('CC-title');
    });

    it('immediately silences active caption output when subtitles are disabled', () => {
      expect(controller.getActiveCueAtTime(2.0)).toBe('Welcome to OmniStream Cinema.');
      controller.setEnabled(false);
      expect(controller.getActiveCueAtTime(2.0)).toBeNull();
    });
  });

  describe('Part 2: Seek & Media Change Resilience', () => {
    it('updates active cue immediately upon seeking to new timestamp', () => {
      // Seek to 14.0s (Cue 3)
      const cue = controller.getActiveCueAtTime(14.0);
      expect(cue).toBe('Multi-line subtitle cue line 1.\nMulti-line subtitle cue line 2.');
    });

    it('clears active cue state when media unloads or new empty file is loaded', () => {
      controller.loadSubtitleFile('');
      expect(controller.getActiveCueAtTime(2.0)).toBeNull();
      expect(controller.getParsedCuesCount()).toBe(0);
    });
  });

  describe('Part 3: Cue Text Sanitization & Safety', () => {
    it('strips HTML tags, WebVTT voice tags, and intra-cue timestamps safely', () => {
      const raw = '<v Commander><c.yellow>Warning:</c> Subsystem at <00:01:23.456> <b>nominal</b> state &amp; operational.';
      const clean = sanitizeCueText(raw);
      expect(clean).toBe('Warning: Subsystem at nominal state & operational.');
      expect(clean).not.toContain('<');
      expect(clean).not.toContain('>');
    });

    it('parses diverse timecode formats accurately', () => {
      expect(parseTimecode('00:01:30.500')).toBe(90.5);
      expect(parseTimecode('01:30.500')).toBe(90.5);
      expect(parseTimecode('00:01:30,500')).toBe(90.5);
      expect(parseTimecode('invalid')).toBeNull();
    });
  });
});
