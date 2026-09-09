import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { useTicketStore } from '../state/useTicketStore';
import { LocalMediaItem } from '../types';
import { mediaParser } from '../lib/cinemorph/mediaParser';
import { posterService } from '../lib/cinemorph/posterService';

import { CineMorphNav } from '../components/cinemorph/landing/CineMorphNav';
import { CinemaLounge } from '../components/cinemorph/landing/CinemaLounge';

export function CineMorphLanding() {
  const [fileError, setFileError] = useState<string | null>(null);
  const [isIngesting, setIsIngesting] = useState(false);

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

  // Revoke all created session Blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    const blobUrls = activeBlobUrlsRef.current;
    return () => {
      blobUrls.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (_) {}
      });
      blobUrls.clear();
    };
  }, []);

  // Toggle environmental time manually via celestial dial
  const handleToggleEnvironmentalTime = useCallback(() => {
    setEnvironmentalTime((prev) => (prev === 'morning' ? 'night' : 'morning'));
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

      // Background non-blocking analysis: runs smoothly while the ticket printer is animating
      (async () => {
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
      })();
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
