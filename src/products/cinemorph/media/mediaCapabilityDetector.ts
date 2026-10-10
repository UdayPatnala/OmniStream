/**
 * CineMorph Media Capability Detector
 * =====================================
 * Runtime browser media capability and hardware decoding probing.
 * 
 * Invariants:
 * - Separates container detection from codec capability detection.
 * - Uses HTMLMediaElement.canPlayType() and MediaCapabilities API.
 * - Zero external cloud/server dependencies; strictly client-side local-first.
 * - Node/JSDOM test environment resilient with graceful fallbacks.
 */

import { MediaContainerAnalysis, MediaAudioTrack, MediaVideoStream } from '../types';

export interface CodecSupportResult {
  isSupported: boolean;
  canPlayConfidence: 'probably' | 'maybe' | 'none';
  isHardwareAccelerated?: boolean;
  smooth?: boolean;
  reason?: string;
}

export interface ContainerSupportResult {
  isRecognized: boolean;
  isNativelyPlayable: boolean;
  mimeType: string;
  containerFormat: string;
  notes?: string;
}

const CONTAINER_MIME_MAP: Record<string, { mime: string; native: boolean; format: string }> = {
  mp4: { mime: 'video/mp4', native: true, format: 'MP4' },
  m4v: { mime: 'video/mp4', native: true, format: 'MP4' },
  webm: { mime: 'video/webm', native: true, format: 'WebM' },
  mkv: { mime: 'video/webm', native: true, format: 'Matroska' }, // Modern browsers play Matroska container with VP9/H.264/Opus
  mov: { mime: 'video/quicktime', native: true, format: 'QuickTime' },
  ogg: { mime: 'video/ogg', native: true, format: 'Ogg' },
  ogv: { mime: 'video/ogg', native: true, format: 'Ogg' },
  avi: { mime: 'video/x-msvideo', native: false, format: 'AVI' },
  ts: { mime: 'video/mp2t', native: false, format: 'MPEG-TS' },
  flv: { mime: 'video/x-flv', native: false, format: 'Flash Video' },
  '3gp': { mime: 'video/3gpp', native: false, format: '3GPP' },
};

export class MediaCapabilityDetector {
  private videoEl: HTMLVideoElement | null = null;

  private getVideoElement(): HTMLVideoElement | null {
    if (typeof document === 'undefined') return null;
    if (!this.videoEl) {
      try {
        this.videoEl = document.createElement('video');
      } catch (_) {
        this.videoEl = null;
      }
    }
    return this.videoEl;
  }

  /**
   * Probe container support from file extension or MIME string
   */
  public probeContainer(extensionOrMime: string): ContainerSupportResult {
    const clean = extensionOrMime.toLowerCase().replace(/^\./, '').trim();
    const entry = CONTAINER_MIME_MAP[clean];

    if (entry) {
      const el = this.getVideoElement();
      let nativePlayable = entry.native;
      if (el && typeof el.canPlayType === 'function') {
        const testMime = entry.mime;
        const confidence = el.canPlayType(testMime);
        if (confidence === 'probably' || confidence === 'maybe') {
          nativePlayable = true;
        } else if (clean === 'avi' || clean === 'flv') {
          nativePlayable = false;
        }
      }

      return {
        isRecognized: true,
        isNativelyPlayable: nativePlayable,
        mimeType: entry.mime,
        containerFormat: entry.format,
      };
    }

    // Direct MIME query
    if (clean.includes('/')) {
      const el = this.getVideoElement();
      const confidence = el ? el.canPlayType(clean) : '';
      const isPlayable = confidence === 'probably' || confidence === 'maybe';
      return {
        isRecognized: true,
        isNativelyPlayable: isPlayable,
        mimeType: clean,
        containerFormat: clean.split('/')[1]?.toUpperCase() || 'UNKNOWN',
      };
    }

    return {
      isRecognized: false,
      isNativelyPlayable: false,
      mimeType: 'application/octet-stream',
      containerFormat: clean.toUpperCase(),
      notes: 'Unrecognized container format',
    };
  }

  /**
   * Probe audio codec support using HTMLMediaElement.canPlayType
   */
  public probeAudioCodec(codec: string, channels: number = 2): CodecSupportResult {
    const el = this.getVideoElement();
    const normalized = codec.trim().toLowerCase();

    // Map common human audio codec strings to RFC 6381 MIME types
    let mimeQuery = `audio/mp4; codecs="mp4a.40.2"`; // Default AAC-LC
    if (normalized.includes('opus')) {
      mimeQuery = `audio/webm; codecs="opus"`;
    } else if (normalized.includes('vorbis')) {
      mimeQuery = `audio/webm; codecs="vorbis"`;
    } else if (normalized.includes('flac')) {
      mimeQuery = `audio/flac`;
    } else if (normalized.includes('ac-3') || normalized.includes('ac3') || normalized.includes('dolby digital')) {
      mimeQuery = `audio/mp4; codecs="ac-3"`;
    } else if (normalized.includes('ec-3') || normalized.includes('eac3') || normalized.includes('dolby digital plus')) {
      mimeQuery = `audio/mp4; codecs="ec-3"`;
    } else if (normalized.includes('alac')) {
      mimeQuery = `audio/mp4; codecs="alac"`;
    } else if (normalized.includes('mp3') || normalized.includes('mpeg')) {
      mimeQuery = `audio/mpeg`;
    } else if (normalized.includes('pcm') || normalized.includes('wav')) {
      mimeQuery = `audio/wav`;
    }

    if (!el || typeof el.canPlayType !== 'function') {
      // Conservative fallback for test/node environments
      const isGenerallySupported = !normalized.includes('ac-3') && !normalized.includes('dts');
      return {
        isSupported: isGenerallySupported,
        canPlayConfidence: isGenerallySupported ? 'maybe' : 'none',
        reason: isGenerallySupported ? undefined : `Codec ${codec} requires proprietary decoder`,
      };
    }

    const confidence = el.canPlayType(mimeQuery);
    if (confidence === 'probably') {
      return { isSupported: true, canPlayConfidence: 'probably' };
    }
    if (confidence === 'maybe') {
      return { isSupported: true, canPlayConfidence: 'maybe' };
    }

    // Direct codec checks for AC-3 / proprietary codecs
    if (normalized.includes('ac-3') || normalized.includes('dts') || normalized.includes('truehd')) {
      return {
        isSupported: false,
        canPlayConfidence: 'none',
        reason: `Browser decoders do not natively support proprietary ${codec.toUpperCase()} without OS passthrough`,
      };
    }

    // Standard web audio codecs supported across modern browsers
    const isStandardAudio =
      normalized.includes('aac') ||
      normalized.includes('opus') ||
      normalized.includes('vorbis') ||
      normalized.includes('flac') ||
      normalized.includes('pcm') ||
      normalized.includes('mp3') ||
      normalized.includes('wav') ||
      normalized.includes('direct audio');

    if (isStandardAudio) {
      return { isSupported: true, canPlayConfidence: (confidence as any) || 'maybe' };
    }

    return {
      isSupported: false,
      canPlayConfidence: 'none',
      reason: `Unsupported audio codec: ${codec}`,
    };
  }

  /**
   * Probe video codec support using HTMLMediaElement and MediaCapabilities API
   */
  public async probeVideoCodec(
    codec: string,
    width: number = 1920,
    height: number = 1080,
    frameRate: number = 24
  ): Promise<CodecSupportResult> {
    const el = this.getVideoElement();
    const normalized = codec.trim().toLowerCase();

    // Map common video codec strings to test MIME queries
    let mimeQuery = `video/mp4; codecs="avc1.42E01E"`; // Default H.264
    let contentType = 'video/mp4; codecs="avc1.640028"';

    if (normalized.includes('hevc') || normalized.includes('h.265') || normalized.includes('hvc1') || normalized.includes('hev1')) {
      mimeQuery = `video/mp4; codecs="hvc1.1.6.L93.B0"`;
      contentType = `video/mp4; codecs="hvc1.1.6.L93.B0"`;
    } else if (normalized.includes('vp9')) {
      mimeQuery = `video/webm; codecs="vp9"`;
      contentType = `video/webm; codecs="vp09.00.41.08"`;
    } else if (normalized.includes('vp8')) {
      mimeQuery = `video/webm; codecs="vp8"`;
      contentType = `video/webm; codecs="vp8"`;
    } else if (normalized.includes('av1') || normalized.includes('av01')) {
      mimeQuery = `video/mp4; codecs="av01.0.08M.08"`;
      contentType = `video/mp4; codecs="av01.0.08M.08"`;
    }

    // Attempt modern asynchronous MediaCapabilities API
    if (typeof navigator !== 'undefined' && navigator.mediaCapabilities && typeof navigator.mediaCapabilities.decodingInfo === 'function') {
      try {
        const info = await navigator.mediaCapabilities.decodingInfo({
          type: 'file',
          video: {
            contentType,
            width,
            height,
            bitrate: width * height * 4,
            framerate: frameRate,
          },
        });

        if (info.supported) {
          return {
            isSupported: true,
            canPlayConfidence: 'probably',
            isHardwareAccelerated: Boolean((info as any).powerEfficient),
            smooth: Boolean(info.smooth),
          };
        }
      } catch (_) {
        // Fallback to canPlayType
      }
    }

    const confidence = el && typeof el.canPlayType === 'function' ? el.canPlayType(mimeQuery) : '';
    if (confidence === 'probably') {
      return { isSupported: true, canPlayConfidence: 'probably' };
    }
    if (confidence === 'maybe') {
      return { isSupported: true, canPlayConfidence: 'maybe' };
    }

    if (normalized.includes('hevc') || normalized.includes('h.265')) {
      return {
        isSupported: false,
        canPlayConfidence: 'none',
        reason: `HEVC / H.265 hardware decoding is unavailable in this browser environment`,
      };
    }

    const isStandardVideo =
      normalized.includes('h.264') ||
      normalized.includes('avc') ||
      normalized.includes('vp9') ||
      normalized.includes('vp8') ||
      normalized.includes('av1') ||
      normalized.includes('direct video');

    if (isStandardVideo) {
      return { isSupported: true, canPlayConfidence: (confidence as any) || 'maybe' };
    }

    return {
      isSupported: false,
      canPlayConfidence: 'none',
      reason: `Unsupported video codec: ${codec}`,
    };
  }

  /**
   * Annotate a container analysis object with validated capability flags
   */
  public async validateContainerAnalysis(
    analysis: MediaContainerAnalysis
  ): Promise<MediaContainerAnalysis> {
    const containerResult = this.probeContainer(analysis.containerFormat);

    const validatedAudio: MediaAudioTrack[] = analysis.audioTracks.map((trk) => {
      const probe = this.probeAudioCodec(trk.codec, trk.channels);
      return {
        ...trk,
        isPlayable: probe.isSupported,
        unsupportedReason: probe.reason,
      };
    });

    const validatedVideo: MediaVideoStream[] = await Promise.all(
      analysis.videoStreams.map(async (v) => {
        const probe = await this.probeVideoCodec(v.codec, v.width, v.height, v.frameRate || 24);
        return {
          ...v,
          isPlayable: probe.isSupported,
          unsupportedReason: probe.reason,
        };
      })
    );

    const hasPlayableAudio = validatedAudio.some((a) => a.isPlayable);
    const hasPlayableVideo = validatedVideo.some((v) => v.isPlayable);

    const isPlaybackSupported = containerResult.isNativelyPlayable && (hasPlayableVideo || validatedVideo.length === 0);

    return {
      ...analysis,
      audioTracks: validatedAudio,
      videoStreams: validatedVideo,
      isContainerSupported: containerResult.isRecognized,
      isPlaybackSupported,
      compatibilitySummary: isPlaybackSupported
        ? 'Direct Native Playback Supported'
        : !containerResult.isNativelyPlayable
        ? `Container (${analysis.containerFormat}) is not natively playable by this browser.`
        : !hasPlayableVideo
        ? `Video codec is not supported by native browser decoders.`
        : 'Media stream compatibility limited.',
    };
  }
}

export const mediaCapabilityDetector = new MediaCapabilityDetector();
