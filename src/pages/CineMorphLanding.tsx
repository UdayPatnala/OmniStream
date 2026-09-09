import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, X } from 'lucide-react';
import { useAppStore } from '../store';
import { useTicketStore } from '../state/useTicketStore';
import { LocalMediaItem } from '../types';
import { mediaParser } from '../lib/cinemorph/mediaParser';
import { posterService } from '../lib/cinemorph/posterService';
import {
  requestLandscapeOrientation,
  unlockOrientation,
  isMobileTouchDevice,
  isPortraitOrientation,
} from '../lib/services/orientationService';

import { CineMorphNav } from '../components/cinemorph/landing/CineMorphNav';
import { CinemaLounge } from '../components/cinemorph/landing/CinemaLounge';

export function CineMorphLanding() {
  const [fileError, setFileError] = useState<string | null>(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Time-of-day adaptive environmental state: Morning (8 AM - 6 PM) vs Night (6 PM - 8 AM)
  const [environmentalTime, setEnvironmentalTime] = useState<'morning' | 'night'>(() => {
    const currentHour = new Date().getHours();
    return currentHour >= 8 && currentHour < 18 ? 'morning' : 'night';
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activeBlobUrlsRef = useRef<Set<string>>(new Set());
  const activeSessionIdRef = useRef<number>(0);
  const navigate = useNavigate();

  const {
    activeLocalMedia,
    setActiveLocalMedia,
    addLocalMediaToHistory,
  } = useAppStore();

  const activeTicket = useTicketStore((state) => state?.activeTicket);

  // Note: Session Blob URLs are preserved for theater playback and revoked upon exiting the theater.

  // Toggle environmental time manually via celestial dial
  const handleToggleEnvironmentalTime = useCallback(() => {
    setEnvironmentalTime((prev) => (prev === 'morning' ? 'night' : 'morning'));
  }, []);

  // Orientation tracking and automatic landscape request for mobile touch devices
  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = isMobileTouchDevice();
      const isPortrait = isPortraitOrientation();
      setIsPortraitMobile(isMobile && isPortrait);
    };

    checkOrientation();

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
      unlockOrientation();
    };
  }, []);

  const handleLocalFileSelect = async (file: File) => {
    if (isIngesting) return;
    setIsIngesting(true);
    setFileError(null);
    if (!file) {
      setIsIngesting(false);
      return;
    }

    const validExtensions = [
      'mp4', 'webm', 'mkv', 'mov', 'm4v', 'avi', 'flv', 'wmv', '3gp', 'ts', 'ogv', 'm3u8', 'mpd',
      'mp3', 'wav', 'aac', 'flac', 'm4a', 'ogg', 'opus', 'wma'
    ];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const isMediaMime = file.type.startsWith('video/') || file.type.startsWith('audio/');

    if (!isMediaMime && !validExtensions.includes(ext)) {
      setFileError(`Unsupported format (.${ext}). Please select a valid video or audio feature.`);
      setIsIngesting(false);
      return;
    }

    const sessionId = ++activeSessionIdRef.current;

    try {
      // Revoke any previous active session blob URL safely
      if (activeLocalMedia?.url && activeBlobUrlsRef.current.has(activeLocalMedia.url)) {
        try {
          URL.revokeObjectURL(activeLocalMedia.url);
          activeBlobUrlsRef.current.delete(activeLocalMedia.url);
        } catch (_) {}
      }

      const blobUrl = URL.createObjectURL(file);
      activeBlobUrlsRef.current.add(blobUrl);
      const fileId = `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const title = file.name.replace(/\.[^/.]+$/, '');

      // Baseline instant analysis — zero UI blocking
      const initialContainerAnalysis = {
        containerFormat: ext.toUpperCase(),
        mimeType: file.type || `video/${ext}`,
        durationSeconds: 0,
        fileSizeBytes: file.size,
        audioTracks: [
          {
            id: 'audio-0',
            streamIndex: 0,
            label: 'Direct Master Audio',
            language: 'Undetermined',
            languageCode: 'und',
            codec: 'Direct Audio',
            channels: 2,
            channelLayout: 'Stereo 2.0',
            isDefault: true,
            isPlayable: true,
          },
        ],
        videoStreams: [
          {
            id: 'video-0',
            streamIndex: 0,
            label: 'Primary Video Stream',
            codec: 'Direct Video',
            width: 1920,
            height: 1080,
            resolution: '1080p',
            aspectRatio: '16:9',
            isDefault: true,
            isPlayable: true,
          },
        ],
        subtitleTracks: [],
        defaultAudioTrackId: 'audio-0',
        defaultVideoStreamId: 'video-0',
        isContainerSupported: true,
        isPlaybackSupported: true,
        compatibilitySummary: 'Direct Container Source',
      };

      const mediaItem: LocalMediaItem = {
        id: fileId,
        name: title,
        size: file.size,
        type: file.type || `video/${ext}`,
        url: blobUrl,
        duration: 0,
        progress: 0,
        lastWatchedAt: Date.now(),
        aspectRatio: '16:9',
        containerAnalysis: initialContainerAnalysis,
        thumbnail: '/cinemorph_artwork.png',
      };

      // Synchronize in-memory media immediately
      addLocalMediaToHistory(mediaItem);
      setActiveLocalMedia(mediaItem);

      // Trigger the v1.5.0 physical ticket printing ritual INSTANTLY (<5ms)
      await useTicketStore.getState().trigger10sPrintAnimation({
        sessionId: fileId,
        title: title,
        source: blobUrl,
        isLocal: true,
        file: file,
        posterUrl: '/cinemorph_artwork.png',
        thumbnailUrl: '/cinemorph_artwork.png',
      });

      // Background non-blocking analysis: runs smoothly after ticket printer mounts
      setTimeout(async () => {
        try {
          const demux = await mediaParser.parseMediaFile(file, file.name);
          if (demux && activeSessionIdRef.current === sessionId) {
            const currentItem = useAppStore.getState().activeLocalMedia;
            if (currentItem && currentItem.id === fileId) {
              const updatedItem: LocalMediaItem = {
                ...currentItem,
                containerAnalysis: demux,
                aspectRatio: demux.videoStreams[0]?.aspectRatio || '16:9',
              };
              setActiveLocalMedia(updatedItem);
              addLocalMediaToHistory(updatedItem);
            }
          }
        } catch (_) {}

        try {
          const posterRes = await posterService.resolvePoster({
            id: fileId,
            sourceUrl: blobUrl,
            isLocal: true,
            file: file,
            title: title,
          });
          if (posterRes?.url && activeSessionIdRef.current === sessionId) {
            const currentItem = useAppStore.getState().activeLocalMedia;
            if (currentItem && currentItem.id === fileId) {
              setActiveLocalMedia({ ...currentItem, thumbnail: posterRes.url });
            }
            useTicketStore.setState((s) => ({
              activeTicket: s.activeTicket && s.activeTicket.ticketId === fileId
                ? { ...s.activeTicket, thumbnailDataUrl: posterRes.url }
                : s.activeTicket,
            }));
          }
        } catch (_) {}
      }, 100);
    } catch (err) {
      if (activeSessionIdRef.current === sessionId) {
        console.error('[CineMorphLanding] Ingestion error:', err);
        setFileError('The feature container could not be calibrated. Please select another file.');
      }
    } finally {
      if (activeSessionIdRef.current === sessionId) {
        setIsIngesting(false);
      }
    }
  };

  return (
    <div
      data-cinemorph-time={environmentalTime}
      className="cinemorph-spatial-root w-full h-[100dvh] relative flex flex-col justify-between overflow-hidden select-none bg-stone-950 cinemorph-env-transition"
      style={{
        backgroundColor: environmentalTime === 'morning' ? '#E8E2D7' : '#070809',
        color: environmentalTime === 'morning' ? '#25272A' : '#F4F0E8',
      }}
    >
      {/* Top Architectural Navigation & Celestial Time Dial */}
      <CineMorphNav
        environmentalTime={environmentalTime}
        onToggleTime={handleToggleEnvironmentalTime}
        activeSpace="lobby"
        hasTicketOrMedia={!!activeLocalMedia || !!activeTicket}
      />

      {/* Mobile Landscape Orientation Advisory Banner */}
      {isPortraitMobile && !bannerDismissed && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[92%] p-3 rounded-2xl border backdrop-blur-xl flex items-center justify-between gap-3 shadow-2xl transition-all animate-in fade-in slide-in-from-top-4"
          style={{
            backgroundColor: environmentalTime === 'morning' ? 'rgba(232, 226, 215, 0.92)' : 'rgba(15, 17, 21, 0.92)',
            borderColor: environmentalTime === 'morning' ? 'rgba(181, 138, 82, 0.35)' : 'rgba(232, 163, 83, 0.3)',
            color: environmentalTime === 'morning' ? '#25272A' : '#F4F0E8',
          }}
        >
          <div className="flex items-center gap-2.5 text-xs font-mono font-medium">
            <Smartphone className="w-4 h-4 shrink-0 text-amber-500 animate-pulse rotate-90" />
            <span>Rotate to landscape for optimal theater lounge view</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                requestLandscapeOrientation().catch(() => {});
              }}
              className="px-2.5 py-1 text-[11px] font-mono font-semibold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-400 transition-colors border border-amber-500/30"
            >
              Rotate
            </button>
            <button
              onClick={() => setBannerDismissed(true)}
              aria-label="Dismiss rotation prompt"
              className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors opacity-70 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Shared Native Hidden File Input (Single Entry Point) */}
      <input
        ref={fileInputRef}
        id="cinemorph-media-input"
        type="file"
        tabIndex={-1}
        className="sr-only"
        aria-hidden="true"
        accept="video/*,audio/*,.mkv,.ts,.m3u8,.avi,.mp4,.mov,.webm,.flv,.mp3,.wav,.m4a,.flac"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            e.target.value = ''; // Reset so same file can be re-selected if cancelled/retried
            handleLocalFileSelect(file);
          }
        }}
      />

      {/* Main Viewport Scene Container: Sole Scene is CinemaLounge */}
      <main className="flex-1 w-full h-full relative overflow-hidden flex flex-col justify-center">
        <CinemaLounge
          environmentalTime={environmentalTime}
          onTriggerFileInput={() => fileInputRef.current?.click()}
          fileError={fileError}
          activeMedia={activeLocalMedia || null}
        />
      </main>
    </div>
  );
}
