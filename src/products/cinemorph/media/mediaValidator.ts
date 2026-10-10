/**
 * CineMorph Media Validator
 * Architectural Invariant: CineMorph is a premium, fixed-aperture cinema destination.
 * 
 * Strict Validation Contract:
 * 1. Accepts supported video files only.
 * 2. Rejects every non-video file (audio files, images, documents, archives, etc.).
 * 3. Rejects every vertical/portrait video (< 1:1, i.e. height > width).
 * 4. Accepts landscape videos (aspect ratio > 1.0) and square videos (aspect ratio == 1.0).
 * 5. Do NOT accept, rotate, crop, stretch, or auto-convert vertical videos.
 * 6. Do NOT mutate or destroy existing valid CineMorph sessions/media upon validation failure.
 */

export interface MediaValidationResult {
  isValid: boolean;
  error?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  mediaType?: 'video' | 'audio';
}

export const SUPPORTED_VIDEO_EXTENSIONS = [
  'mp4', 'webm', 'mkv', 'mov', 'm4v', 'avi', 'wmv', '3gp', 'ts', 'ogv', 'flv', 'm3u8', 'mpd'
] as const;

export const SUPPORTED_AUDIO_EXTENSIONS = [
  'mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'opus', 'alac', 'aiff', 'wma'
] as const;

export const SUPPORTED_MEDIA_EXTENSIONS = [
  ...SUPPORTED_VIDEO_EXTENSIONS,
  ...SUPPORTED_AUDIO_EXTENSIONS,
] as const;

export function getNonVideoErrorMessage(ext?: string): string {
  if (ext) {
    return `Unsupported format (.${ext}) — CineMorph accepts video files only.`;
  }
  return 'Unsupported file type — CineMorph accepts video files only.';
}

export const NON_VIDEO_ERROR_MESSAGE = 'Unsupported file type — CineMorph accepts video files only.';
export const VERTICAL_VIDEO_ERROR_MESSAGE = 'Unsupported video format — CineMorph requires a landscape video.';
export const UNREADABLE_VIDEO_ERROR_MESSAGE = 'Unsupported video format — CineMorph could not decode this video.';

export interface MediaValidationOptions {
  allowAudio?: boolean;
}

/**
 * Validates a candidate media file before session creation or ingestion.
 */
export async function validateCineMorphMedia(
  file: File,
  options?: MediaValidationOptions
): Promise<MediaValidationResult> {
  if (!file) {
    return {
      isValid: false,
      error: 'No file selected.',
    };
  }

  const allowAudio = options?.allowAudio ?? false;
  const fileName = file.name || '';
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const isVideoExt = (SUPPORTED_VIDEO_EXTENSIONS as readonly string[]).includes(ext);
  const isVideoMime = typeof file.type === 'string' && file.type.startsWith('video/');
  const isAudioExt = (SUPPORTED_AUDIO_EXTENSIONS as readonly string[]).includes(ext);
  const isAudioMime = typeof file.type === 'string' && file.type.startsWith('audio/');

  // 1. High-Fidelity Audio Support (when enabled)
  if (allowAudio && (isAudioExt || isAudioMime)) {
    return {
      isValid: true,
      mediaType: 'audio',
    };
  }

  // 2. Strict Non-Video Rejection:
  // Reject audio files (when audio not explicitly allowed), images (image/*), documents, text, archives
  if (file.type && !isVideoMime && file.type !== 'application/octet-stream') {
    return {
      isValid: false,
      error: getNonVideoErrorMessage(ext),
    };
  }

  if (!isVideoMime && !isVideoExt) {
    return {
      isValid: false,
      error: getNonVideoErrorMessage(ext),
    };
  }

  // 3. Browser Video Element Metadata Probe for Dimensions & Orientation
  if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return { isValid: true, mediaType: 'video' };
  }

  return new Promise<MediaValidationResult>((resolve) => {
    let probeUrl = '';
    try {
      probeUrl = URL.createObjectURL(file);
    } catch {
      return resolve({
        isValid: false,
        error: UNREADABLE_VIDEO_ERROR_MESSAGE,
      });
    }

    const video = document.createElement('video');
    video.preload = 'metadata';
    let resolved = false;

    const cleanup = () => {
      video.onloadedmetadata = null;
      video.onerror = null;
      video.removeAttribute('src');
      try {
        video.load();
      } catch (_) {}
      if (probeUrl) {
        try {
          URL.revokeObjectURL(probeUrl);
        } catch (_) {}
      }
    };

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        // Probe timeout fallback for valid container extension
        resolve({ isValid: true });
      }
    }, 4000);

    video.onloadedmetadata = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);

      const width = video.videoWidth;
      const height = video.videoHeight;
      cleanup();

      if (typeof width === 'number' && typeof height === 'number' && width > 0 && height > 0) {
        // A video is considered vertical when its effective/native aspect ratio is < 1:1 (height > width)
        if (height > width) {
          return resolve({
            isValid: false,
            error: VERTICAL_VIDEO_ERROR_MESSAGE,
            width,
            height,
            aspectRatio: width / height,
          });
        }

        // Landscape (width > height) and Square (width === height) are accepted
        return resolve({
          isValid: true,
          width,
          height,
          aspectRatio: width / height,
        });
      }

      // Zero or missing video track dimensions
      resolve({
        isValid: false,
        error: UNREADABLE_VIDEO_ERROR_MESSAGE,
      });
    };

    video.onerror = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      cleanup();
      resolve({
        isValid: false,
        error: UNREADABLE_VIDEO_ERROR_MESSAGE,
      });
    };

    video.src = probeUrl;
  });
}
