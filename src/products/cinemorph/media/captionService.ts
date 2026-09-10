/**
 * captionService.ts â€” OmniStream CineMorph Real-Time Timed-Text & Caption Synchronization Engine
 * Copyright (c) Patnala Uday Kumar. All rights reserved.
 *
 * Provides real-time synchronization between media playback and caption cues.
 * Supports:
 * 1. Native HTMLVideoElement TextTrack / VTTCue events (cuechange).
 * 2. Client-side WebVTT (.vtt) and SubRip (.srt) parser with timestamp normalization.
 * 3. Sanitized text extraction with formatting tag stripping.
 * 4. Zero-DOM-overhead state updates (only triggers on cue entry/exit).
 */

export interface NormalizedCaptionCue {
  id?: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  text: string;
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
 * Parses timecode strings (HH:MM:SS.mmm, MM:SS.mmm, HH:MM:SS,mmm) into seconds
 */
export function parseTimecode(tcStr: string): number | null {
  if (!tcStr) return null;
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
 * Parses WebVTT or SRT content into normalized caption cues
 */
export function parseSubtitleContent(content: string): NormalizedCaptionCue[] {
  if (!content || typeof content !== 'string') return [];

  const cues: NormalizedCaptionCue[] = [];
  // Normalize line endings
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  let i = 0;
  // Skip WEBVTT header if present
  if (lines.length > 0 && lines[0].trim().toUpperCase().startsWith('WEBVTT')) {
    i++;
    // Skip header metadata / comments until empty line
    while (i < lines.length && lines[i].trim() !== '') {
      i++;
    }
  }

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }

    // Check for NOTE / STYLE / REGION blocks in WebVTT
    if (line.startsWith('NOTE') || line.startsWith('STYLE') || line.startsWith('REGION')) {
      while (i < lines.length && lines[i].trim() !== '') {
        i++;
      }
      continue;
    }

    // Check if line is an index or cue identifier before timestamp
    let cueId: string | undefined;
    let timeLine = line;

    if (!timeLine.includes('-->') && i + 1 < lines.length && lines[i + 1].includes('-->')) {
      cueId = line;
      i++;
      timeLine = lines[i].trim();
    }

    if (timeLine.includes('-->')) {
      const [startStr, ...rest] = timeLine.split('-->');
      const endPart = rest.join('-->').trim().split(/\s+/)[0]; // strip WebVTT cue settings like align:center

      const startTime = parseTimecode(startStr);
      const endTime = parseTimecode(endPart);

      i++;
      const textLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== '') {
        textLines.push(lines[i]);
        i++;
      }

      if (startTime !== null && endTime !== null && endTime >= startTime) {
        const sanitized = sanitizeCueText(textLines.join('\n'));
        if (sanitized) {
          cues.push({
            id: cueId,
            startTime,
            endTime,
            text: sanitized,
          });
        }
      }
    } else {
      i++;
    }
  }

  // Sort cues chronologically
  return cues.sort((a, b) => a.startTime - b.startTime);
}

/**
 * Controller managing live caption synchronization from native TextTracks or parsed cues
 */
export class CineMorphCaptionController {
  private activeCueText: string | null = null;
  private parsedCues: NormalizedCaptionCue[] = [];
  private videoEl: HTMLVideoElement | null = null;
  private changeCallback: ((text: string | null) => void) | null = null;
  private isEnabled: boolean = true;
  private activeTrackIndex: number = -1; // -1 means default/all
  private boundOnTimeUpdate: () => void;
  private boundOnCueChange: () => void;

  constructor() {
    this.boundOnTimeUpdate = this.handleTimeUpdate.bind(this);
    this.boundOnCueChange = this.handleCueChange.bind(this);
  }

  public setOnChange(callback: (text: string | null) => void): void {
    this.changeCallback = callback;
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.updateActiveText(null);
    } else {
      this.syncCurrentTime();
    }
  }

  public setActiveTrackIndex(index: number): void {
    this.activeTrackIndex = index;
    if (this.videoEl && this.videoEl.textTracks) {
      for (let i = 0; i < this.videoEl.textTracks.length; i++) {
        if (index === -1) {
          this.videoEl.textTracks[i].mode = (i === 0 && this.isEnabled) ? 'hidden' : 'disabled';
        } else {
          this.videoEl.textTracks[i].mode = (i === index && this.isEnabled) ? 'hidden' : 'disabled';
        }
      }
    }
    this.syncCurrentTime();
  }

  public attachVideo(video: HTMLVideoElement | null): void {
    this.detachVideo();
    this.videoEl = video;

    if (video) {
      video.addEventListener('timeupdate', this.boundOnTimeUpdate);
      video.addEventListener('seeking', this.boundOnTimeUpdate);
      video.addEventListener('seeked', this.boundOnTimeUpdate);
      video.addEventListener('emptied', this.boundOnTimeUpdate);

      // Listen to textTrack list changes
      if (video.textTracks) {
        for (let i = 0; i < video.textTracks.length; i++) {
          const track = video.textTracks[i];
          track.addEventListener('cuechange', this.boundOnCueChange);
          // Set active track mode to hidden so native unstyled browser cues do not overlap
          if (this.activeTrackIndex === -1) {
            track.mode = (i === 0 && this.isEnabled) ? 'hidden' : 'disabled';
          } else {
            track.mode = (i === this.activeTrackIndex && this.isEnabled) ? 'hidden' : 'disabled';
          }
        }
        video.textTracks.onaddtrack = (e) => {
          if (e.track) {
            e.track.addEventListener('cuechange', this.boundOnCueChange);
            const idx = Array.from(video.textTracks).indexOf(e.track);
            if (this.activeTrackIndex === -1) {
              e.track.mode = (idx === 0 && this.isEnabled) ? 'hidden' : 'disabled';
            } else {
              e.track.mode = (idx === this.activeTrackIndex && this.isEnabled) ? 'hidden' : 'disabled';
            }
          }
        };
      }
      this.syncCurrentTime();
    }
  }

  public detachVideo(): void {
    if (this.videoEl) {
      this.videoEl.removeEventListener('timeupdate', this.boundOnTimeUpdate);
      this.videoEl.removeEventListener('seeking', this.boundOnTimeUpdate);
      this.videoEl.removeEventListener('seeked', this.boundOnTimeUpdate);
      this.videoEl.removeEventListener('emptied', this.boundOnTimeUpdate);

      if (this.videoEl.textTracks) {
        for (let i = 0; i < this.videoEl.textTracks.length; i++) {
          this.videoEl.textTracks[i].removeEventListener('cuechange', this.boundOnCueChange);
        }
      }
      this.videoEl = null;
    }
    this.updateActiveText(null);
  }

  public loadSubtitleFile(content: string): void {
    this.parsedCues = parseSubtitleContent(content);
    this.syncCurrentTime();
  }

  public loadParsedCues(cues: NormalizedCaptionCue[]): void {
    this.parsedCues = cues || [];
    this.syncCurrentTime();
  }

  public clearSubtitles(): void {
    this.parsedCues = [];
    this.updateActiveText(null);
  }

  public getParsedCuesCount(): number {
    return this.parsedCues.length;
  }

  public getActiveCueAtTime(currentTime: number): string | null {
    if (!this.isEnabled) return null;

    // 1. Check native textTracks first
    if (this.videoEl && this.videoEl.textTracks && this.videoEl.textTracks.length > 0) {
      const targetIndices = (this.activeTrackIndex >= 0 && this.activeTrackIndex < this.videoEl.textTracks.length)
        ? [this.activeTrackIndex]
        : Array.from({ length: this.videoEl.textTracks.length }, (_, idx) => idx);

      for (const i of targetIndices) {
        const track = this.videoEl.textTracks[i];
        if (track && track.mode !== 'disabled') {
          const activeCues = track.activeCues;
          if (activeCues && activeCues.length > 0) {
            const cueTexts: string[] = [];
            for (let j = 0; j < activeCues.length; j++) {
              const cue = activeCues[j] as VTTCue;
              if (cue && cue.text) {
                const clean = sanitizeCueText(cue.text);
                if (clean) cueTexts.push(clean);
              }
            }
            if (cueTexts.length > 0) {
              return cueTexts.join('\n');
            }
          }
        }
      }
    }

    // 2. Check loaded parsed cues
    if (this.parsedCues.length > 0) {
      const active = this.parsedCues.filter(
        (c) => currentTime >= c.startTime && currentTime <= c.endTime
      );
      if (active.length > 0) {
        return active.map((c) => c.text).join('\n');
      }
    }

    return null;
  }

  private handleTimeUpdate(): void {
    this.syncCurrentTime();
  }

  private handleCueChange(): void {
    this.syncCurrentTime();
  }

  private syncCurrentTime(): void {
    if (!this.isEnabled || !this.videoEl) {
      this.updateActiveText(null);
      return;
    }
    const curTime = this.videoEl.currentTime || 0;
    const activeText = this.getActiveCueAtTime(curTime);
    this.updateActiveText(activeText);
  }

  private updateActiveText(newText: string | null): void {
    if (this.activeCueText !== newText) {
      this.activeCueText = newText;
      if (this.changeCallback) {
        this.changeCallback(newText);
      }
    }
  }

  public getActiveText(): string | null {
    return this.activeCueText;
  }
}

