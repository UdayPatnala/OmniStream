import { SceneHighlight, VideoScriptChunk } from '../../types';

/**
 * Regex for matching timestamps in descriptions:
 * Matches patterns like:
 * - 00:00 Intro
 * - 1:23 - Key Concepts
 * - [04:56] Demo
 * - 01:23:45 Full Walkthrough
 */
const TIMESTAMP_REGEX = /(?:^|\n)\s*(?:\[|\()?((?:\d{1,2}:)?\d{1,2}:\d{2})(?:\]|\))?\s*[-–—:]?\s*(.+?)(?=\n|$)/g;

/**
 * Parses timestamp string "01:23" or "1:23:45" to total seconds
 */
export function parseTimestampToSeconds(ts: string): number {
  const parts = ts.trim().split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

/**
 * Formats seconds into "mm:ss" or "hh:mm:ss"
 */
export function formatSecondsToTimestamp(seconds: number): string {
  const s = Math.floor(seconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export interface ExtractedChapter {
  id: string;
  seconds: number;
  timestamp: string;
  title: string;
}

/**
 * Extracts real chapters from a video description.
 * If no timestamps exist in description, generates logical segment markers based on video duration.
 */
export function extractChaptersFromDescription(description: string, durationSeconds?: number): ExtractedChapter[] {
  if (!description) return generateDefaultChapters(durationSeconds);

  const chapters: ExtractedChapter[] = [];
  let match: RegExpExecArray | null;

  while ((match = TIMESTAMP_REGEX.exec(description)) !== null) {
    const rawTs = match[1].trim();
    const title = match[2].trim().replace(/^[-–—:]\s*/, '');
    const seconds = parseTimestampToSeconds(rawTs);

    if (title && !chapters.some(c => c.seconds === seconds)) {
      chapters.push({
        id: `ch-${seconds}-${chapters.length}`,
        seconds,
        timestamp: rawTs,
        title,
      });
    }
  }

  chapters.sort((a, b) => a.seconds - b.seconds);

  if (chapters.length > 0) {
    return chapters;
  }

  return generateDefaultChapters(durationSeconds);
}

/**
 * Fallback chapter generation based on video duration if no description chapters exist
 */
function generateDefaultChapters(durationSeconds: number = 300): ExtractedChapter[] {
  const dur = Math.max(60, durationSeconds);
  return [
    { id: 'ch-0', seconds: 0, timestamp: '0:00', title: 'Start of Presentation' },
    { id: 'ch-1', seconds: Math.floor(dur * 0.25), timestamp: formatSecondsToTimestamp(dur * 0.25), title: 'Key Highlights' },
    { id: 'ch-2', seconds: Math.floor(dur * 0.50), timestamp: formatSecondsToTimestamp(dur * 0.50), title: 'Deep Dive & Demonstration' },
    { id: 'ch-3', seconds: Math.floor(dur * 0.75), timestamp: formatSecondsToTimestamp(dur * 0.75), title: 'Analysis & Conclusions' },
  ];
}

/**
 * Converts extracted chapters into SceneHighlight models
 */
export function chaptersToSceneHighlights(chapters: ExtractedChapter[]): SceneHighlight[] {
  return chapters.map((c, idx) => ({
    id: c.id,
    timestamp: c.seconds,
    title: c.title,
    importanceScore: idx === 0 ? 100 : 85,
    category: idx === 0 ? 'intro' : idx === chapters.length - 1 ? 'summary' : 'key-point',
  }));
}

/**
 * Converts extracted chapters into VideoScriptChunk models
 */
export function chaptersToScriptChunks(chapters: ExtractedChapter[], channelTitle: string = 'Creator'): VideoScriptChunk[] {
  return chapters.map(c => ({
    id: `script-${c.id}`,
    timestamp: c.seconds,
    timestampFormatted: c.timestamp,
    speaker: channelTitle,
    text: c.title,
    topic: c.title,
    highlighted: c.seconds === 0,
  }));
}
