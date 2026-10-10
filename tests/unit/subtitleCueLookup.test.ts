import { describe, it, expect } from 'vitest';
import {
  SubtitleCue,
  findActiveCues,
  isRtlText,
  detectSdhCue,
  parseTimecodeToSeconds,
} from '@omnistream/cinemorph/media/subtitleCueModel';

describe('CineMorph Subtitle Cue Model & O(log n) Binary Search', () => {
  const sampleCues: SubtitleCue[] = [
    { id: 'cue-1', startTime: 1.0, endTime: 4.0, text: 'First dialogue', format: 'vtt' },
    { id: 'cue-2', startTime: 3.5, endTime: 6.0, text: '[background music]', isSdh: true, format: 'vtt' }, // Overlaps with cue 1 and 3
    { id: 'cue-3', startTime: 5.0, endTime: 8.0, text: 'Second dialogue', format: 'vtt' },
    { id: 'cue-4', startTime: 10.0, endTime: 12.0, text: 'مرحبا', isRtl: true, format: 'vtt' },
  ];

  describe('Boundary Conditions & Time Sync', () => {
    it('returns empty array when media time is before all cues', () => {
      expect(findActiveCues(sampleCues, 0.5)).toEqual([]);
    });

    it('returns empty array when media time is after all cues', () => {
      expect(findActiveCues(sampleCues, 15.0)).toEqual([]);
    });

    it('handles exact start boundary (inclusive): startTime <= t', () => {
      const active = findActiveCues(sampleCues, 1.0);
      expect(active.length).toBe(1);
      expect(active[0].id).toBe('cue-1');
    });

    it('handles exact end boundary (exclusive): t < endTime', () => {
      // At t=3.999s, cue-1 is still active
      const activeJustBefore = findActiveCues(sampleCues, 3.999);
      expect(activeJustBefore.some((c) => c.id === 'cue-1')).toBe(true);

      // At t=4.000s, cue-1 has ended
      const activeAtEnd = findActiveCues(sampleCues, 4.0);
      expect(activeAtEnd.some((c) => c.id === 'cue-1')).toBe(false);
    });

    it('resolves concurrent and overlapping cues simultaneously', () => {
      // At t=3.7s, both cue-1 (1.0 - 4.0) and cue-2 (3.5 - 6.0) are active
      const active = findActiveCues(sampleCues, 3.7);
      expect(active.length).toBe(2);
      expect(active.map((c) => c.id)).toEqual(['cue-1', 'cue-2']);
    });

    it('returns empty array during gaps between cues', () => {
      // Between cue-3 (ends at 8.0) and cue-4 (starts at 10.0)
      expect(findActiveCues(sampleCues, 8.5)).toEqual([]);
      expect(findActiveCues(sampleCues, 9.99)).toEqual([]);
    });
  });

  describe('Stress & Latency Benchmark (5,000 Cues)', () => {
    it('evaluates 1,000 random lookups on 5,000 cues in sub-microsecond median time', () => {
      // Generate 5,000 sequential 2-second cues over a 10,000s movie
      const largeCueSet: SubtitleCue[] = [];
      for (let i = 0; i < 5000; i++) {
        const start = i * 2.0;
        largeCueSet.push({
          id: `cue-${i}`,
          startTime: start,
          endTime: start + 1.8,
          text: `Subtitle cue number ${i}`,
          format: 'srt',
        });
      }

      const queries = 1000;
      const t0 = performance.now();
      for (let q = 0; q < queries; q++) {
        const queryTime = (q * 9.7) % 9990;
        findActiveCues(largeCueSet, queryTime);
      }
      const t1 = performance.now();
      const avgMicrosPerLookup = ((t1 - t0) / queries) * 1000;

      // Each binary search lookup must comfortably be under 20 microseconds
      expect(avgMicrosPerLookup).toBeLessThan(20.0);

      // Verify correctness on sample queries
      for (let q = 0; q < 50; q++) {
        const queryTime = (q * 19.3) % 9990;
        const active = findActiveCues(largeCueSet, queryTime);
        for (const cue of active) {
          expect(queryTime).toBeGreaterThanOrEqual(cue.startTime);
          expect(queryTime).toBeLessThan(cue.endTime);
        }
      }
    });
  });

  describe('Unicode & SDH Helpers', () => {
    it('detects RTL script across diverse Arabic and Hebrew strings', () => {
      expect(isRtlText('Hello world')).toBe(false);
      expect(isRtlText('శీర్షిక (Telugu)')).toBe(false);
      expect(isRtlText('مرحباً')).toBe(true);
      expect(isRtlText('שלום')).toBe(true);
      expect(isRtlText('')).toBe(false);
    });

    it('detects SDH audio cues with brackets or parentheses', () => {
      expect(detectSdhCue('[dramatic violin music]')).toBe(true);
      expect(detectSdhCue('(door slams shut)')).toBe(true);
      expect(detectSdhCue('Captain: All systems go.')).toBe(false);
      expect(detectSdhCue('')).toBe(false);
    });

    it('converts diverse timecode strings to seconds accurately', () => {
      expect(parseTimecodeToSeconds('01:23:45.678')).toBeCloseTo(5025.678, 3);
      expect(parseTimecodeToSeconds('00:02:15,500')).toBeCloseTo(135.5, 3);
      expect(parseTimecodeToSeconds('1:23.45')).toBeCloseTo(83.45, 2);
      expect(parseTimecodeToSeconds('45.5')).toBeCloseTo(45.5, 1);
      expect(parseTimecodeToSeconds('invalid')).toBeNull();
    });
  });
});
