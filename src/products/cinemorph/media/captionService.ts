/**
 * captionService.ts — OmniStream CineMorph Real-Time Timed-Text & Caption Synchronization Engine
 * Copyright (c) Patnala Uday Kumar. All rights reserved.
 *
 * Provides real-time synchronization between media playback and caption cues.
 * Supports:
 * 1. Native HTMLVideoElement TextTrack / VTTCue events (cuechange).
 * 2. Client-side WebVTT (.vtt), SubRip (.srt), and ASS/SSA (.ass) parser with timestamp normalization.
 * 3. Sanitized text extraction with formatting tag stripping and speaker extraction.
 * 4. High-performance O(log n) binary search cue lookup for zero-stutter 4K playback.
 * 5. Full backward compatibility with existing tests and integration points.
 */

import { SubtitleCue, findActiveCues, parseTimecodeToSeconds } from './subtitleCueModel';
import { parseSubtitleFile, sanitizeCueText } from './subtitleParser';

export type { SubtitleCue } from './subtitleCueModel';
export { findActiveCues, parseTimecodeToSeconds } from './subtitleCueModel';
export { parseSubtitleFile, sanitizeCueText } from './subtitleParser';

export interface NormalizedCaptionCue {
  id?: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  text: string;
}

/**
 * Backward-compatible timecode parser
 */
export function parseTimecode(tcStr: string): number | null {
  return parseTimecodeToSeconds(tcStr);
}

/**
 * Backward-compatible subtitle content parser
 */
export function parseSubtitleContent(content: string): NormalizedCaptionCue[] {
  const cues = parseSubtitleFile(content);
  return cues.map((c) => ({
    id: c.id,
    startTime: c.startTime,
    endTime: c.endTime,
    text: c.text,
  }));
}

/**
 * Controller managing live caption synchronization from native TextTracks or parsed cues
 */
export class CineMorphCaptionController {
  private activeCueText: string | null = null;
  private activeCues: SubtitleCue[] = [];
  private parsedCues: SubtitleCue[] = [];
  private videoEl: HTMLVideoElement | null = null;
  private changeCallback: ((text: string | null) => void) | null = null;
  private cuesChangeCallback: ((cues: SubtitleCue[]) => void) | null = null;
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

  public setOnCuesChange(callback: (cues: SubtitleCue[]) => void): void {
    this.cuesChangeCallback = callback;
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.updateActiveText(null, []);
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
      video.addEventListener('ratechange', this.boundOnTimeUpdate);
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
      this.videoEl.removeEventListener('ratechange', this.boundOnTimeUpdate);
      this.videoEl.removeEventListener('emptied', this.boundOnTimeUpdate);

      if (this.videoEl.textTracks) {
        for (let i = 0; i < this.videoEl.textTracks.length; i++) {
          this.videoEl.textTracks[i].removeEventListener('cuechange', this.boundOnCueChange);
        }
      }
      this.videoEl = null;
    }
    this.updateActiveText(null, []);
  }

  public loadSubtitleFile(content: string, filename?: string): void {
    this.parsedCues = parseSubtitleFile(content, filename);
    this.syncCurrentTime();
  }

  public loadParsedCues(cues: (SubtitleCue | NormalizedCaptionCue)[]): void {
    this.parsedCues = (cues || []).map((c, i) => ({
      id: c.id || `cue-${i + 1}`,
      startTime: c.startTime,
      endTime: c.endTime,
      text: c.text,
      format: (c as SubtitleCue).format || 'native',
      speaker: (c as SubtitleCue).speaker,
      isSdh: (c as SubtitleCue).isSdh,
      isRtl: (c as SubtitleCue).isRtl,
    }));
    this.syncCurrentTime();
  }

  public clearSubtitles(): void {
    this.parsedCues = [];
    this.updateActiveText(null, []);
  }

  public getParsedCuesCount(): number {
    return this.parsedCues.length;
  }

  /**
   * Retrieves active SubtitleCue objects at authoritative media time
   */
  public getActiveSubtitleCuesAtTime(currentTime: number): SubtitleCue[] {
    if (!this.isEnabled) return [];

    // 1. Check native textTracks first
    if (this.videoEl && this.videoEl.textTracks && this.videoEl.textTracks.length > 0) {
      const targetIndices = (this.activeTrackIndex >= 0 && this.activeTrackIndex < this.videoEl.textTracks.length)
        ? [this.activeTrackIndex]
        : Array.from({ length: this.videoEl.textTracks.length }, (_, idx) => idx);

      const nativeCues: SubtitleCue[] = [];
      for (const i of targetIndices) {
        const track = this.videoEl.textTracks[i];
        if (track && track.mode !== 'disabled') {
          const active = track.activeCues;
          if (active && active.length > 0) {
            for (let j = 0; j < active.length; j++) {
              const cue = active[j] as VTTCue;
              if (cue && cue.text) {
                const clean = sanitizeCueText(cue.text);
                if (clean) {
                  nativeCues.push({
                    id: cue.id || `native-${i}-${j}`,
                    startTime: cue.startTime,
                    endTime: cue.endTime,
                    text: clean,
                    format: 'native',
                  });
                }
              }
            }
          }
        }
      }
      if (nativeCues.length > 0) {
        return nativeCues;
      }
    }

    // 2. High-performance O(log n) binary search on parsed cues
    if (this.parsedCues.length > 0) {
      return findActiveCues(this.parsedCues, currentTime);
    }

    return [];
  }

  /**
   * Backward-compatible method returning concatenated string of active text
   */
  public getActiveCueAtTime(currentTime: number): string | null {
    const active = this.getActiveSubtitleCuesAtTime(currentTime);
    if (active.length > 0) {
      return active.map((c) => c.text).join('\n');
    }
    return null;
  }

  public handleTimeUpdate(forcedTime?: number): void {
    this.syncCurrentTime(forcedTime);
  }

  private handleCueChange(): void {
    this.syncCurrentTime();
  }

  public syncCurrentTime(forcedTime?: number): void {
    if (!this.isEnabled) {
      this.updateActiveText(null, []);
      return;
    }
    const curTime = forcedTime !== undefined 
      ? forcedTime 
      : (this.videoEl ? (this.videoEl.currentTime || 0) : null);

    if (curTime === null) {
      this.updateActiveText(null, []);
      return;
    }
    const activeCues = this.getActiveSubtitleCuesAtTime(curTime);
    const activeText = activeCues.length > 0 ? activeCues.map((c) => c.text).join('\n') : null;
    this.updateActiveText(activeText, activeCues);
  }

  private updateActiveText(newText: string | null, cues: SubtitleCue[]): void {
    const textChanged = this.activeCueText !== newText;
    this.activeCueText = newText;
    this.activeCues = cues;

    if (textChanged && this.changeCallback) {
      this.changeCallback(newText);
    }
    if (this.cuesChangeCallback) {
      this.cuesChangeCallback(cues);
    }
  }

  public getActiveText(): string | null {
    return this.activeCueText;
  }

  public getActiveCues(): SubtitleCue[] {
    return this.activeCues;
  }
}
