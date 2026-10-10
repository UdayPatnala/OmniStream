/**
 * CineMorph Subtitle & Caption Subsystem — Canonical Cue & Lookup Model
 * ======================================================================
 * Defines the authoritative SubtitleCue data contract, RTL/SDH detection,
 * timecode conversion, and O(log n) binary search active cue resolution.
 * 
 * Invariants:
 * - Authoritative media clock: cues are queried against HTMLVideoElement.currentTime.
 * - SubtitleCue is format-agnostic: normalized from WebVTT, SRT, ASS, or native TextTracks.
 * - Binary search lookup: worst-case O(log n) candidate search + local interval scan.
 * - Zero frame stutter: never performs linear full-array scans on large cue tracks.
 */

export interface SubtitleCue {
  readonly id: string;
  readonly startTime: number; // in seconds
  readonly endTime: number;   // in seconds
  readonly text: string;
  readonly speaker?: string;
  readonly isSdh?: boolean;
  readonly isRtl?: boolean;
  readonly format?: 'vtt' | 'srt' | 'ass' | 'native';
  readonly settings?: Record<string, string>;
}

/**
 * Checks whether text contains characters from Right-to-Left writing systems
 * (Arabic, Hebrew, Syriac, Thaana, Samaritan, Mandaic, etc.)
 */
export function isRtlText(text: string): boolean {
  if (!text) return false;
  // Unicode ranges for RTL scripts
  const rtlRegex = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  return rtlRegex.test(text);
}

/**
 * Detects whether a cue represents non-dialogue accessibility / SDH audio cues
 * (e.g. "[door creaks]", "(orchestral music)", "[whispering]")
 */
export function detectSdhCue(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  return (
    (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
    (trimmed.startsWith('(') && trimmed.endsWith(')')) ||
    /\[.+\]|\(.+\)/.test(trimmed)
  );
}

/**
 * Parses diverse timecode strings into fractional seconds.
 * Supports:
 * - HH:MM:SS.mmm (WebVTT)
 * - HH:MM:SS,mmm (SRT)
 * - H:MM:SS.cs (ASS / SSA centiseconds)
 * - MM:SS.mmm
 * - SSS.mmm (Seconds only)
 */
export function parseTimecodeToSeconds(tcStr: string): number | null {
  if (!tcStr || typeof tcStr !== 'string') return null;
  const cleaned = tcStr.trim().replace(',', '.');
  const parts = cleaned.split(':');

  if (parts.length === 3) {
    const hours = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    const seconds = parseFloat(parts[2]);
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return null;
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const minutes = parseFloat(parts[0]);
    const seconds = parseFloat(parts[1]);
    if (isNaN(minutes) || isNaN(seconds)) return null;
    return minutes * 60 + seconds;
  }

  const secOnly = parseFloat(cleaned);
  return isNaN(secOnly) ? null : secOnly;
}

/**
 * High-performance O(log n) Binary Search Active Cue Lookup.
 * 
 * Given an array of chronologically sorted SubtitleCues and the current media time,
 * finds all cues currently active: startTime <= currentTime < endTime.
 * 
 * Handles concurrent and overlapping cues (e.g. background music SDH + spoken dialogue).
 * 
 * @param cues Chronologically sorted array of SubtitleCues (by startTime)
 * @param currentTime Authoritative media time in seconds
 * @returns Array of active SubtitleCues
 */
export function findActiveCues(cues: SubtitleCue[], currentTime: number): SubtitleCue[] {
  if (!cues || cues.length === 0 || currentTime < 0) {
    return [];
  }

  // 1. Binary search to find the first candidate cue whose endTime > currentTime
  let low = 0;
  let high = cues.length - 1;
  let firstCandidate = -1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    if (cues[mid].endTime > currentTime) {
      firstCandidate = mid;
      high = mid - 1; // Seek earlier candidates
    } else {
      low = mid + 1;
    }
  }

  if (firstCandidate === -1) {
    return []; // All cues ended prior to currentTime
  }

  // 2. Scan forward from firstCandidate as long as startTime <= currentTime
  const active: SubtitleCue[] = [];
  for (let i = firstCandidate; i < cues.length; i++) {
    const cue = cues[i];
    // Since cues are sorted by startTime, once startTime exceeds currentTime,
    // subsequent cues cannot be active.
    if (cue.startTime > currentTime) {
      break;
    }
    // Verify valid interval: startTime <= currentTime < endTime
    if (currentTime >= cue.startTime && currentTime < cue.endTime) {
      active.push(cue);
    }
  }

  return active;
}
