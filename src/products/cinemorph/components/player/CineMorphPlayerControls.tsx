/**
 * CineMorphPlayerControls.tsx
 * ============================
 * Layered, accessible theater bottom player control bar for CineMorph.
 * 
 * Invariants:
 * - Persistent primary actions: Play/Pause, Timeline, Timecode, Volume, Tracks, Captions, Fullscreen.
 * - CineMorph theater actions: Seats toggle, 3-tier Aspect Ratio (Original, 1.90:1, 1.43:1), Studio EQ.
 * - Zero React state pollution during high-frequency video playback (timeline updates local ref or throttled state).
 * - Full keyboard accessibility (Space/K, M, F, C) & touch/mobile friendly.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Languages, Captions, Armchair, Sliders, Settings
} from 'lucide-react';
import { AspectRatioMode } from '../../state/useCineMorphStore';
import { MediaTrackSet, MediaSelectionState } from '../../media/trackModel';
import { TrackSelectionMenu } from './TrackSelectionMenu';

interface CineMorphPlayerControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  volume: number;
  isMuted: boolean;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  // Track system
  trackSet: MediaTrackSet;
  selection: MediaSelectionState;
  onSelectAudio: (trackId: string) => void;
  onSelectSubtitle: (trackId: string) => void;
  onSelectVideo: (trackId: string) => void;
  subtitlesOn: boolean;
  onToggleSubtitles: () => void;
  onUploadSubtitleFile?: (file: File) => void;
  subtitleStyleConfig?: import('../../media/subtitleStyleModel').SubtitleStyleConfig;
  onChangeSubtitleFontSize?: (size: import('../../media/subtitleStyleModel').SubtitleFontSize) => void;
  // CineMorph theater presentation
  aspectRatio: AspectRatioMode;
  onSelectAspectRatio: (ratio: AspectRatioMode) => void;
  seatingEnabled: boolean;
  onToggleSeating: () => void;
  isStudioOpen: boolean;
  onToggleStudio: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  className?: string;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const CineMorphPlayerControls: React.FC<CineMorphPlayerControlsProps> = ({
  isPlaying,
  onTogglePlay,
  currentTime,
  duration,
  onSeek,
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  trackSet,
  selection,
  onSelectAudio,
  onSelectSubtitle,
  onSelectVideo,
  subtitlesOn,
  onToggleSubtitles,
  onUploadSubtitleFile,
  subtitleStyleConfig,
  onChangeSubtitleFontSize,
  aspectRatio,
  onSelectAspectRatio,
  seatingEnabled,
  onToggleSeating,
  isStudioOpen,
  onToggleStudio,
  isFullscreen,
  onToggleFullscreen,
  className = '',
}) => {
  const [isTrackMenuOpen, setIsTrackMenuOpen] = useState(false);
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  const selectedAudio = trackSet.audioTracks.find((a) => a.id === selection.selectedAudioTrackId);
  const audioBadgeLabel = selectedAudio
    ? selectedAudio.language !== 'Undetermined'
      ? selectedAudio.language
      : selectedAudio.label
    : 'Audio';

  // Timeline scrub calculation
  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!timelineRef.current || duration <= 0) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const targetTime = (clickX / rect.width) * duration;
      onSeek(targetTime);
    },
    [duration, onSeek]
  );

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <div
      className={`relative w-full px-3 sm:px-6 py-2.5 bg-gradient-to-t from-black/90 via-stone-950/80 to-transparent backdrop-blur-md border-t border-amber-950/30 text-stone-200 select-none transition-opacity duration-300 ${className}`}
    >
      {/* ── 1. PROGRESS / TIMELINE BAR ────────────────────────────────────── */}
      <div
        ref={timelineRef}
        role="slider"
        aria-label="Seek Video Timeline"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        onClick={handleTimelineClick}
        className="group relative w-full h-2 mb-2 rounded-full bg-white/10 hover:h-3 transition-all cursor-pointer flex items-center"
      >
        {/* Buffered / Played Track */}
        <div
          className="h-full rounded-full bg-amber-500 group-hover:bg-amber-400 transition-colors relative"
          style={{ width: `${progressPercent}%` }}
        >
          {/* Thumb handle */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* ── 2. BOTTOM CONTROL BAR ROW ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 font-mono text-xs">
        
        {/* Left: Play/Pause, Volume, Timecode */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause movie (Space or K)' : 'Play movie (Space or K)'}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors focus:ring-2 focus:ring-amber-500/50 outline-none"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          </button>

          {/* Volume Control */}
          <div
            className="relative flex items-center gap-1.5"
            onMouseEnter={() => setIsVolumeHovered(true)}
            onMouseLeave={() => setIsVolumeHovered(false)}
          >
            <button
              onClick={onToggleMute}
              aria-label={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              className="p-1.5 rounded-lg hover:bg-white/10 text-stone-300 transition-colors focus:ring-2 focus:ring-amber-500/50 outline-none"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Slider on hover/touch */}
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              aria-label="Volume Slider"
              className={`w-14 sm:w-20 h-1 rounded-lg accent-amber-500 cursor-pointer transition-all ${
                isVolumeHovered ? 'opacity-100 scale-100' : 'opacity-70 sm:opacity-90'
              }`}
            />
          </div>

          {/* Time Display */}
          <span className="text-[11px] text-stone-400 hidden sm:inline-block">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Right: Audio Tracks, Captions, Seats, Aspect Ratio, Studio, Fullscreen */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* Audio / Tracks Selection Button */}
          <div className="relative">
            <button
              onClick={() => setIsTrackMenuOpen(!isTrackMenuOpen)}
              aria-label="Select Audio and Subtitle Tracks"
              title="Media Tracks (Audio & Subtitles)"
              className={`px-2 py-1 rounded-xl text-xs font-sans font-medium flex items-center gap-1.5 transition-all focus:ring-2 focus:ring-amber-500/50 outline-none ${
                isTrackMenuOpen || trackSet.audioTracks.length > 1
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-stone-300 border border-white/5'
              }`}
            >
              <Languages className="w-3.5 h-3.5 shrink-0" />
              <span className="max-w-[70px] sm:max-w-[100px] truncate text-[11px]">{audioBadgeLabel}</span>
              {trackSet.audioTracks.length > 1 && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              )}
            </button>

            {/* Track Popover Menu */}
            <TrackSelectionMenu
              isOpen={isTrackMenuOpen}
              onClose={() => setIsTrackMenuOpen(false)}
              trackSet={trackSet}
              selection={selection}
              onSelectAudio={onSelectAudio}
              onSelectSubtitle={onSelectSubtitle}
              onSelectVideo={onSelectVideo}
              onUploadSubtitleFile={onUploadSubtitleFile}
              subtitleStyleConfig={subtitleStyleConfig}
              onChangeSubtitleFontSize={onChangeSubtitleFontSize}
            />
          </div>

          {/* Captions Toggle */}
          <button
            onClick={onToggleSubtitles}
            aria-label={subtitlesOn ? 'Disable Closed Captions (C)' : 'Enable Closed Captions (C)'}
            title={subtitlesOn ? 'Captions On (C)' : 'Captions Off (C)'}
            className={`p-1.5 rounded-xl transition-colors focus:ring-2 focus:ring-amber-500/50 outline-none ${
              subtitlesOn
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'hover:bg-white/10 text-stone-400'
            }`}
          >
            <Captions className="w-4 h-4" />
          </button>

          {/* Theater Seating Toggle */}
          <button
            onClick={onToggleSeating}
            aria-label={seatingEnabled ? 'Hide Auditorium Seats' : 'Show Auditorium Seats'}
            title={seatingEnabled ? 'Seating On' : 'Seating Off'}
            className={`p-1.5 rounded-xl transition-colors focus:ring-2 focus:ring-amber-500/50 outline-none ${
              seatingEnabled
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'hover:bg-white/10 text-stone-400'
            }`}
          >
            <Armchair className="w-4 h-4" />
          </button>

          {/* Aspect Ratio 3-Tier Selector (Original, 1.90:1, 1.43:1) */}
          <div className="flex items-center rounded-xl bg-black/40 border border-white/10 p-0.5 text-[10px]">
            {(['original', '1.90:1', '1.43:1'] as AspectRatioMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onSelectAspectRatio(mode)}
                className={`px-1.5 sm:px-2 py-0.5 rounded-lg transition-colors ${
                  aspectRatio === mode
                    ? 'bg-amber-500/25 text-amber-300 font-semibold shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {mode === 'original' ? 'ORIG' : mode}
              </button>
            ))}
          </div>

          {/* Studio Audio EQ / Mastering Console Toggle */}
          <button
            onClick={onToggleStudio}
            aria-label="Toggle Studio Audio Mastering Console"
            title="Studio Mastering Console"
            className={`p-1.5 rounded-xl transition-colors focus:ring-2 focus:ring-amber-500/50 outline-none ${
              isStudioOpen
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'hover:bg-white/10 text-stone-400'
            }`}
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? 'Exit Fullscreen (F)' : 'Enter Fullscreen (F)'}
            title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
            className="p-1.5 rounded-xl hover:bg-white/10 text-stone-300 transition-colors focus:ring-2 focus:ring-amber-500/50 outline-none"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>

      </div>
    </div>
  );
};
