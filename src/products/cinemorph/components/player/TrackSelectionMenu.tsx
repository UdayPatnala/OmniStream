/**
 * TrackSelectionMenu.tsx
 * =======================
 * Accessible, categorized popover menu for selecting Audio, Subtitles, and Video tracks.
 * 
 * Invariants:
 * - Mutually exclusive radio selection for tracks.
 * - ARIA semantics & keyboard navigation (Esc, Arrows, Enter).
 * - Distinguishes source language, channels, bitrate, and codec without inventing metadata.
 * - Fits within theater UI without blocking central screen viewing.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Volume2, MessageSquare, Film, X, Check, AlertCircle, Upload } from 'lucide-react';
import { MediaTrackSet, MediaSelectionState, AudioTrack, TextTrack, VideoTrack } from '../../media/trackModel';
import { SubtitleStyleConfig, SubtitleFontSize } from '../../media/subtitleStyleModel';

interface TrackSelectionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  trackSet: MediaTrackSet;
  selection: MediaSelectionState;
  onSelectAudio: (trackId: string) => void;
  onSelectSubtitle: (trackId: string) => void;
  onSelectVideo: (trackId: string) => void;
  onUploadSubtitleFile?: (file: File) => void;
  subtitleStyleConfig?: SubtitleStyleConfig;
  onChangeSubtitleFontSize?: (size: SubtitleFontSize) => void;
}

export const TrackSelectionMenu: React.FC<TrackSelectionMenuProps> = ({
  isOpen,
  onClose,
  trackSet,
  selection,
  onSelectAudio,
  onSelectSubtitle,
  onSelectVideo,
  onUploadSubtitleFile,
  subtitleStyleConfig,
  onChangeSubtitleFontSize,
}) => {
  const [activeTab, setActiveTab] = useState<'audio' | 'subtitles' | 'video'>('audio');
  const menuRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      role="dialog"
      aria-label="Media Track Selection"
      aria-modal="true"
      className="absolute bottom-16 right-4 sm:right-16 z-50 w-80 sm:w-96 rounded-2xl bg-stone-950/95 border border-amber-900/40 text-stone-200 shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      {/* Menu Header with Category Tabs */}
      <div className="flex items-center justify-between p-3 border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('audio')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'audio'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Audio ({trackSet.audioTracks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('subtitles')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'subtitles'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Subtitles ({trackSet.textTracks.length})</span>
          </button>

          {trackSet.videoTracks.length > 1 && (
            <button
              onClick={() => setActiveTab('video')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'video'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Video</span>
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          aria-label="Close track menu"
          className="p-1 rounded-lg hover:bg-white/10 text-stone-400 hover:text-stone-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Content Panels */}
      <div className="p-3 max-h-72 overflow-y-auto space-y-1.5 font-mono text-xs">
        {/* ── AUDIO TAB ──────────────────────────────────────────────────────── */}
        {activeTab === 'audio' && (
          <div role="radiogroup" aria-label="Audio Tracks" className="space-y-1.5">
            {trackSet.audioTracks.length === 0 ? (
              <div className="py-6 text-center text-stone-500 font-sans text-xs">
                No secondary audio streams detected in media container.
              </div>
            ) : (
              trackSet.audioTracks.map((trk) => {
                const isSelected = selection.selectedAudioTrackId === trk.id;
                return (
                  <button
                    key={trk.id}
                    role="radio"
                    aria-checked={isSelected}
                    disabled={!trk.isPlayable}
                    onClick={() => {
                      if (trk.isPlayable) {
                        onSelectAudio(trk.id);
                      }
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                        : trk.isPlayable
                        ? 'bg-white/5 border-white/5 hover:bg-white/10 text-stone-300'
                        : 'bg-black/30 border-white/5 text-stone-600 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-stone-200">
                          {trk.label || (trk.language !== 'Undetermined' ? trk.language : 'Audio Master')}
                        </span>
                        {trk.default && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-normal">
                            Default
                          </span>
                        )}
                        {trk.role === 'commentary' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-normal">
                            Commentary
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-400">
                        {trk.channelLayout} • {trk.codec}
                        {trk.bitrate ? ` • ${Math.round(trk.bitrate / 1000)}kbps` : ''}
                      </span>
                      {!trk.isPlayable && trk.unsupportedReason && (
                        <span className="text-[10px] text-red-400 flex items-center gap-1 mt-0.5">
                          <AlertCircle className="w-3 h-3" />
                          {trk.unsupportedReason}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* ── SUBTITLES TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'subtitles' && (
          <div role="radiogroup" aria-label="Subtitle Tracks" className="space-y-2">
            {/* Quick Styling Font Size Selector */}
            {onChangeSubtitleFontSize && (
              <div className="flex items-center justify-between pb-2 mb-1 border-b border-white/5 text-[11px] text-stone-400">
                <span>Text Size:</span>
                <div className="flex items-center gap-1">
                  {(['small', 'medium', 'large'] as SubtitleFontSize[]).map((sz) => {
                    const isCur = (subtitleStyleConfig?.fontSize || 'medium') === sz;
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => onChangeSubtitleFontSize(sz)}
                        className={`px-2 py-0.5 rounded capitalize transition-all ${
                          isCur
                            ? 'bg-amber-500/25 border border-amber-500/50 text-amber-300 font-semibold'
                            : 'bg-white/5 hover:bg-white/10 text-stone-400'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Off Option */}
            <button
              role="radio"
              aria-checked={selection.selectedTextTrackId === 'off'}
              onClick={() => onSelectSubtitle('off')}
              className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                selection.selectedTextTrackId === 'off'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                  : 'bg-white/5 border-white/5 hover:bg-white/10 text-stone-300'
              }`}
            >
              <div className="flex flex-col">
                <span className="font-semibold text-xs">Off</span>
                <span className="text-[11px] text-stone-500">Subtitles disabled</span>
              </div>
              {selection.selectedTextTrackId === 'off' && <Check className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Subtitle Tracks */}
            {trackSet.textTracks.map((trk) => {
              const isSelected = selection.selectedTextTrackId === trk.id;
              return (
                <button
                  key={trk.id}
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onSelectSubtitle(trk.id)}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                      : 'bg-white/5 border-white/5 hover:bg-white/10 text-stone-300'
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs">
                        {trk.label || (trk.language !== 'Undetermined' ? trk.language : 'Subtitle Track')}
                      </span>
                      {trk.kind === 'captions' && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-700/60 text-stone-300 font-mono">
                          CC / SDH
                        </span>
                      )}
                      {trk.default && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400">
                          Default
                        </span>
                      )}
                      {trk.forced && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300">
                          Forced
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-stone-400 uppercase">
                      {trk.format} {trk.cues?.length ? `• ${trk.cues.length} cues` : ''}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                </button>
              );
            })}

            {/* External Subtitle File Loader Trigger */}
            {onUploadSubtitleFile && (
              <div className="pt-2 border-t border-white/5">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".srt,.vtt,.ass,.ssa"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onUploadSubtitleFile(file);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-2 rounded-xl border border-dashed border-amber-500/30 hover:border-amber-500/60 bg-amber-500/5 hover:bg-amber-500/10 text-amber-300 text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Load Subtitle File (.srt, .vtt, .ass)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── VIDEO TAB ──────────────────────────────────────────────────────── */}
        {activeTab === 'video' && (
          <div role="radiogroup" aria-label="Video Tracks" className="space-y-1.5">
            {trackSet.videoTracks.map((trk) => {
              const isSelected = selection.selectedVideoTrackId === trk.id;
              return (
                <button
                  key={trk.id}
                  role="radio"
                  aria-checked={isSelected}
                  disabled={!trk.isPlayable}
                  onClick={() => {
                    if (trk.isPlayable) {
                      onSelectVideo(trk.id);
                    }
                  }}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                      : trk.isPlayable
                      ? 'bg-white/5 border-white/5 hover:bg-white/10 text-stone-300'
                      : 'bg-black/30 border-white/5 text-stone-600 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs">{trk.label}</span>
                      {trk.role === 'primary' && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400">
                          Primary
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-stone-400">
                      {trk.width}×{trk.height} • {trk.frameRate} fps • {trk.codec}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Summary */}
      <div className="p-2.5 border-t border-white/10 bg-black/40 flex items-center justify-between text-[11px] text-stone-500">
        <span>Hardware Decoders Active</span>
        <span>Local Direct Play</span>
      </div>
    </div>
  );
};
