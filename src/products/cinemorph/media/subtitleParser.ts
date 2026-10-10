/**
 * CineMorph Subtitle & Caption Subsystem — Multi-Format Parsers
 * ==============================================================
 * Deterministic, fault-tolerant parsers for WebVTT (.vtt), SubRip (.srt),
 * and Advanced SubStation Alpha (.ass, .ssa) timed text formats.
 * 
 * Invariants:
 * - Format isolation: renderer receives only canonical SubtitleCue objects.
 * - Fault tolerance: malformed timestamps or cues are safely skipped without failing the track.
 * - Complete sanitization: strips markup and intra-cue timestamps while preserving speaker & SDH.
 * - Chronological ordering: output cues are always sorted by startTime ascending.
 */

import { SubtitleCue, parseTimecodeToSeconds, isRtlText, detectSdhCue } from './subtitleCueModel';

export type SubtitleFormat = 'vtt' | 'srt' | 'ass' | 'unknown';

/**
 * Detects the subtitle format from file content and optional filename
 */
export function detectSubtitleFormat(content: string, filename?: string): SubtitleFormat {
  if (filename) {
    const ext = filename.toLowerCase().split('.').pop();
    if (ext === 'vtt') return 'vtt';
    if (ext === 'srt') return 'srt';
    if (ext === 'ass' || ext === 'ssa') return 'ass';
  }

  if (!content || typeof content !== 'string') return 'unknown';
  const trimmed = content.trim();

  if (/^WEBVTT/i.test(trimmed)) {
    return 'vtt';
  }
  if (/\[Script Info\]|\[Events\]|Dialogue:\s*/i.test(trimmed)) {
    return 'ass';
  }
  if (/^\d+\s*\r?\n\d{2}:\d{2}:\d{2}[,\.]\d{3}\s*-->/m.test(trimmed)) {
    return 'srt';
  }

  return 'unknown';
}

/**
 * Sanitizes and strips HTML/WebVTT cue markup while preserving readable text & line breaks
 */
export function sanitizeCueText(rawText: string): string {
  if (!rawText) return '';

  return rawText
    // Replace ASS line breaks \N or \n
    .replace(/\\N/gi, '\n')
    .replace(/\\n/g, '\n')
    // Remove ASS override tags like {\an8}, {\pos(100,100)}, {\c&HFFFFFF&}
    .replace(/\{[^\}]*\}/g, '')
    // Remove WebVTT voice tags like <v Speaker> or </v>
    .replace(/<\/?[vV][^>]*>/g, '')
    // Remove standard inline formatting tags: <b>, <i>, <u>, <c.class>, <ruby>, <rt>, <lang>
    .replace(/<\/?[a-zA-Z0-9_.-]+(?:\.[a-zA-Z0-9_.-]+)*(?::[a-zA-Z0-9_.-]+)*(?: [^>]*)?>/g, '')
    // Remove WebVTT intra-cue timestamps like <00:01:23.456>
    .replace(/<\d{2}:\d{2}(?::\d{2})?(?:\.\d{1,3})?>/g, '')
    // Decode basic HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Normalize consecutive newlines and trim
    .split('\n')
    .map((line) => line.replace(/[ \t]{2,}/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n')
    .trim();
}

/**
 * Extracts speaker identifier if present in cue text or tags
 * (e.g. "<v Cooper>Hello", "John: Where are we going?", "[John] Stand back")
 */
export function extractSpeaker(rawText: string): { speaker?: string; textWithoutSpeaker: string } {
  if (!rawText) return { textWithoutSpeaker: '' };

  // 1. WebVTT voice tag <v Speaker Name>
  const voiceMatch = rawText.match(/<v ([^>]+)>/i);
  if (voiceMatch) {
    const speaker = voiceMatch[1].trim();
    const cleaned = rawText.replace(/<\/?[vV][^>]*>/g, '');
    return { speaker, textWithoutSpeaker: cleaned };
  }

  // 2. Colon-based speaker prefix e.g. "Commander: All systems nominal."
  const colonMatch = rawText.match(/^([A-Z][a-zA-Z0-9\s.-]{1,24}):\s*(.+)$/s);
  if (colonMatch) {
    const speaker = colonMatch[1].trim();
    const textWithoutSpeaker = colonMatch[2];
    return { speaker, textWithoutSpeaker };
  }

  return { textWithoutSpeaker: rawText };
}

/**
 * Parses WebVTT timed text content into canonical SubtitleCues
 */
export function parseWebVTT(content: string): SubtitleCue[] {
  if (!content || typeof content !== 'string') return [];

  const cues: SubtitleCue[] = [];
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  let i = 0;
  // Skip WEBVTT header line if present
  if (lines.length > 0 && lines[0].trim().toUpperCase().startsWith('WEBVTT')) {
    i++;
    // Skip header comments and metadata blocks until first empty line or first cue
    while (i < lines.length) {
      const cur = lines[i].trim();
      if (cur === '') {
        i++;
        break;
      }
      // If we encounter a timecode line or an identifier followed by a timecode, stop skipping header
      if (cur.includes('-->') || (i + 1 < lines.length && lines[i + 1].includes('-->'))) {
        break;
      }
      i++;
    }
  }

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }

    // Skip NOTE / STYLE / REGION blocks
    if (line.startsWith('NOTE') || line.startsWith('STYLE') || line.startsWith('REGION')) {
      while (i < lines.length && lines[i].trim() !== '') {
        i++;
      }
      continue;
    }

    let cueId: string | undefined;
    let timeLine = line;

    // Check if line is an identifier before the timecode line
    if (!timeLine.includes('-->') && i + 1 < lines.length && lines[i + 1].includes('-->')) {
      cueId = line;
      i++;
      timeLine = lines[i].trim();
    }

    if (timeLine.includes('-->')) {
      const [startStr, ...rest] = timeLine.split('-->');
      const endPartFull = rest.join('-->').trim();
      const endParts = endPartFull.split(/\s+/);
      const endStr = endParts[0];

      // Extract cue settings if any (e.g. align:center size:80%)
      const settings: Record<string, string> = {};
      for (let s = 1; s < endParts.length; s++) {
        const [k, v] = endParts[s].split(':');
        if (k && v) settings[k.trim()] = v.trim();
      }

      const startTime = parseTimecodeToSeconds(startStr);
      const endTime = parseTimecodeToSeconds(endStr);

      i++;
      const textLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== '') {
        textLines.push(lines[i]);
        i++;
      }

      if (startTime !== null && endTime !== null && endTime >= startTime) {
        const rawFullText = textLines.join('\n');
        const { speaker, textWithoutSpeaker } = extractSpeaker(rawFullText);
        const sanitized = sanitizeCueText(textWithoutSpeaker);

        if (sanitized) {
          cues.push({
            id: cueId || `vtt-${cues.length + 1}`,
            startTime,
            endTime,
            text: sanitized,
            speaker,
            isSdh: detectSdhCue(sanitized),
            isRtl: isRtlText(sanitized),
            format: 'vtt',
            settings: Object.keys(settings).length > 0 ? settings : undefined,
          });
        }
      }
    } else {
      i++;
    }
  }

  return cues.sort((a, b) => a.startTime - b.startTime);
}

/**
 * Parses SubRip (.srt) timed text content into canonical SubtitleCues
 */
export function parseSRT(content: string): SubtitleCue[] {
  if (!content || typeof content !== 'string') return [];

  const cues: SubtitleCue[] = [];
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }

    let cueId: string | undefined;
    let timeLine = line;

    // Check if line is numeric sequence index
    if (!timeLine.includes('-->') && i + 1 < lines.length && lines[i + 1].includes('-->')) {
      cueId = line;
      i++;
      timeLine = lines[i].trim();
    }

    if (timeLine.includes('-->')) {
      const [startStr, ...rest] = timeLine.split('-->');
      const endStr = rest.join('-->').trim().split(/\s+/)[0];

      const startTime = parseTimecodeToSeconds(startStr);
      const endTime = parseTimecodeToSeconds(endStr);

      i++;
      const textLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== '') {
        textLines.push(lines[i]);
        i++;
      }

      if (startTime !== null && endTime !== null && endTime >= startTime) {
        const rawFullText = textLines.join('\n');
        const { speaker, textWithoutSpeaker } = extractSpeaker(rawFullText);
        const sanitized = sanitizeCueText(textWithoutSpeaker);

        if (sanitized) {
          cues.push({
            id: cueId || `srt-${cues.length + 1}`,
            startTime,
            endTime,
            text: sanitized,
            speaker,
            isSdh: detectSdhCue(sanitized),
            isRtl: isRtlText(sanitized),
            format: 'srt',
          });
        }
      }
    } else {
      i++;
    }
  }

  return cues.sort((a, b) => a.startTime - b.startTime);
}

/**
 * Parses Advanced SubStation Alpha (.ass, .ssa) content into canonical SubtitleCues
 */
export function parseASS(content: string): SubtitleCue[] {
  if (!content || typeof content !== 'string') return [];

  const cues: SubtitleCue[] = [];
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  let inEvents = false;
  let formatFields: string[] = ['layer', 'start', 'end', 'style', 'name', 'marginl', 'marginr', 'marginv', 'effect', 'text'];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith(';')) continue;

    if (line.toLowerCase() === '[events]') {
      inEvents = true;
      continue;
    }

    if (line.startsWith('[') && line.endsWith(']')) {
      inEvents = false;
      continue;
    }

    if (inEvents) {
      if (line.toLowerCase().startsWith('format:')) {
        formatFields = line
          .substring(7)
          .split(',')
          .map((f) => f.trim().toLowerCase());
        continue;
      }

      if (line.toLowerCase().startsWith('dialogue:')) {
        const rawValues = line.substring(9);
        const startIndex = formatFields.indexOf('start');
        const endIndex = formatFields.indexOf('end');
        const nameIndex = formatFields.indexOf('name');
        const textIndex = formatFields.indexOf('text');

        // Split by comma up to the textIndex, and keep the rest as the text payload
        const parts = rawValues.split(',');
        if (parts.length > textIndex && textIndex !== -1) {
          const startStr = parts[startIndex]?.trim();
          const endStr = parts[endIndex]?.trim();
          const speakerName = nameIndex !== -1 ? parts[nameIndex]?.trim() : undefined;
          const rawText = parts.slice(textIndex).join(',').trim();

          const startTime = parseTimecodeToSeconds(startStr);
          const endTime = parseTimecodeToSeconds(endStr);

          if (startTime !== null && endTime !== null && endTime >= startTime) {
            const sanitized = sanitizeCueText(rawText);
            if (sanitized) {
              cues.push({
                id: `ass-${cues.length + 1}`,
                startTime,
                endTime,
                text: sanitized,
                speaker: speakerName || undefined,
                isSdh: detectSdhCue(sanitized),
                isRtl: isRtlText(sanitized),
                format: 'ass',
              });
            }
          }
        }
      }
    }
  }

  return cues.sort((a, b) => a.startTime - b.startTime);
}

/**
 * Universal Subtitle Parser: automatically detects format and parses into SubtitleCues
 */
export function parseSubtitleFile(content: string, filename?: string): SubtitleCue[] {
  const format = detectSubtitleFormat(content, filename);
  switch (format) {
    case 'vtt':
      return parseWebVTT(content);
    case 'srt':
      return parseSRT(content);
    case 'ass':
      return parseASS(content);
    default:
      // Try WebVTT first, then SRT, then ASS
      const vttAttempt = parseWebVTT(content);
      if (vttAttempt.length > 0) return vttAttempt;
      const srtAttempt = parseSRT(content);
      if (srtAttempt.length > 0) return srtAttempt;
      return parseASS(content);
  }
}
