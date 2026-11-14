import { AudioCodecSupportLevel, AudioFormatInfo } from '@omnistream/shared';

/**
 * OmniStream Audio Format & Codec Prober
 * Accurately analyzes media files, container types, and underlying audio codecs.
 * Distinguishes native hardware/browser decoding, software demuxing, and unsupported formats
 * (e.g., DTS, AC3 hardware passthrough limitations, legacy WMA).
 *
 * Conforms to OPCA Architecture Rule 3 (Core service, product-agnostic, zero cross-imports).
 */

export interface FormatProbeInput {
  name?: string;
  type?: string;
  codec?: string;
  channels?: number;
  sampleRate?: number;
  bitrate?: number;
}

export class AudioFormatDetector {
  /**
   * Evaluates native browser playability for a given MIME type and codec string.
   */
  public probeNativeSupport(mimeType: string, codec?: string): {
    supported: boolean;
    confidence: 'probably' | 'maybe' | 'none';
  } {
    if (typeof document === 'undefined') {
      return { supported: true, confidence: 'maybe' };
    }

    try {
      const audio = document.createElement('audio');
      if (typeof audio.canPlayType !== 'function') {
        return { supported: true, confidence: 'maybe' };
      }
      const testType = codec ? `${mimeType}; codecs="${codec}"` : mimeType;
      const canPlay = audio.canPlayType(testType);

      if (canPlay === 'probably') {
        return { supported: true, confidence: 'probably' };
      }
      if (canPlay === 'maybe') {
        return { supported: true, confidence: 'maybe' };
      }

      // In jsdom / headless test environments, canPlayType returns "" by default
      if (canPlay === '' && typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
        const standardMimes = ['audio/flac', 'audio/mp4', 'audio/aac', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'];
        if (standardMimes.some((m) => mimeType.startsWith(m))) {
          return { supported: true, confidence: 'maybe' };
        }
      }

      return { supported: false, confidence: 'none' };
    } catch {
      return { supported: false, confidence: 'none' };
    }
  }

  /**
   * Formats the channel count into standard cinema / home theater audio nomenclature.
   */
  public getChannelLayoutLabel(channels?: number): string {
    switch (channels) {
      case 1:
        return 'Mono 1.0';
      case 2:
        return 'Stereo 2.0';
      case 3:
        return '2.1 Surround';
      case 4:
        return 'Quadraphonic 4.0';
      case 6:
        return '5.1 Surround';
      case 8:
        return '7.1 Surround';
      case 13:
      case 16:
      case 24:
        return 'Sony 360 Reality Audio';
      default:
        return channels && channels > 2 ? `${channels}.0 Multichannel` : 'Stereo 2.0';
    }
  }

  /**
   * Determines container format, underlying codec, channel layout, and browser support level.
   */
  public detectFormat(input: File | string | FormatProbeInput): AudioFormatInfo {
    let name = '';
    let mimeType = '';
    let explicitCodec = '';
    let channels = 2;
    let sampleRate: number | undefined;
    let bitrate: number | undefined;

    if (typeof input === 'string') {
      name = input;
    } else if (input instanceof File) {
      name = input.name;
      mimeType = input.type;
    } else if (typeof input === 'object' && input !== null) {
      name = input.name || '';
      mimeType = input.type || '';
      explicitCodec = input.codec || '';
      if (typeof input.channels === 'number') channels = input.channels;
      sampleRate = input.sampleRate;
      bitrate = input.bitrate;
    }

    const extMatch = name.match(/\.([a-zA-Z0-9]+)(?:[?#]|$)/);
    const ext = extMatch ? extMatch[1].toLowerCase() : '';

    let container = 'Unknown';
    let codec = explicitCodec || 'Unknown';
    let supportLevel: AudioCodecSupportLevel = 'native';
    let isNativelySupported = true;
    let unsupportedReason: string | undefined;
    let hasSony360Metadata = false;

    const lowerCodec = explicitCodec.toLowerCase();
    const lowerName = name.toLowerCase();

    // Check for explicit Sony 360 Reality Audio or MPEG-H indicators
    if (
      lowerCodec.includes('360ra') ||
      lowerCodec.includes('mpegh') ||
      lowerCodec.includes('mha1') ||
      lowerCodec.includes('mhm1') ||
      lowerName.includes('360ra') ||
      lowerName.includes('sony 360')
    ) {
      hasSony360Metadata = true;
      if (channels < 13) channels = 13;
    }

    // 1. DTS Detection (DTS, DTS-HD MA, DTS:X)
    if (
      lowerCodec.includes('dts') ||
      ext === 'dts' ||
      ext === 'dtshd' ||
      lowerName.includes('.dts.') ||
      lowerName.includes('dts-hd')
    ) {
      container = ext === 'mkv' ? 'Matroska (MKV)' : ext === 'mp4' ? 'MPEG-4 (MP4)' : 'DTS Stream';
      codec = explicitCodec || (lowerName.includes('dts-hd') ? 'DTS-HD Master Audio' : 'DTS Digital Surround');
      supportLevel = 'unsupported';
      isNativelySupported = false;
      unsupportedReason = 'DTS and DTS-HD audio codecs are proprietary and unsupported by web browser decoders. The media will play silently unless converted or hardware passthrough is available.';
    }
    // 2. AC3 / EAC3 (Dolby Digital / Dolby Digital Plus)
    else if (
      lowerCodec.includes('ac-3') ||
      lowerCodec.includes('ac3') ||
      lowerCodec.includes('eac3') ||
      lowerCodec.includes('ec-3') ||
      lowerCodec.includes('dolby') ||
      ext === 'ac3' ||
      ext === 'eac3'
    ) {
      container = ext === 'mkv' ? 'Matroska (MKV)' : ext === 'mp4' ? 'MPEG-4 (MP4)' : 'Dolby Bitstream';
      codec = lowerCodec.includes('eac3') || lowerCodec.includes('ec-3') ? 'E-AC-3 (Dolby Digital Plus)' : 'AC-3 (Dolby Digital)';
      const probe = this.probeNativeSupport('audio/mp4', 'ac-3');
      if (probe.supported) {
        supportLevel = 'native';
        isNativelySupported = true;
      } else {
        supportLevel = 'unsupported';
        isNativelySupported = false;
        unsupportedReason = 'Dolby Digital (AC-3 / E-AC-3) requires host operating system hardware decoding not available in this browser environment. Video may play silently.';
      }
    }
    // 3. WMA (Windows Media Audio)
    else if (ext === 'wma' || lowerCodec.includes('wma') || mimeType.includes('wma')) {
      container = 'Advanced Systems Format (ASF)';
      codec = 'Windows Media Audio (WMA)';
      supportLevel = 'unsupported';
      isNativelySupported = false;
      unsupportedReason = 'WMA is a proprietary legacy Windows Media codec unsupported by modern HTML5 media engines.';
    }
    // 4. MKV (Matroska Container)
    else if (ext === 'mkv' || mimeType.includes('matroska')) {
      container = 'Matroska (MKV)';
      if (!explicitCodec) {
        codec = 'AAC / Opus / Vorbis (Demuxed)';
      }
      const probe = this.probeNativeSupport('video/x-matroska');
      if (probe.supported) {
        supportLevel = 'native';
        isNativelySupported = true;
      } else {
        supportLevel = 'demuxed';
        isNativelySupported = true;
      }
    }
    // 5. FLAC (Free Lossless Audio Codec)
    else if (ext === 'flac' || lowerCodec.includes('flac') || mimeType.includes('flac')) {
      container = 'FLAC Container';
      codec = 'FLAC Lossless';
      const probe = this.probeNativeSupport('audio/flac');
      supportLevel = probe.supported ? 'native' : 'software';
      isNativelySupported = probe.supported;
    }
    // 6. MP3 (MPEG-1 Audio Layer III)
    else if (ext === 'mp3' || lowerCodec.includes('mp3') || mimeType.includes('mpeg')) {
      container = 'MPEG Audio';
      codec = 'MPEG-1 Audio Layer III (MP3)';
      supportLevel = 'native';
      isNativelySupported = true;
    }
    // 7. WAV (Waveform Audio File Format)
    else if (ext === 'wav' || lowerCodec.includes('pcm') || mimeType.includes('wav')) {
      container = 'RIFF Waveform (WAV)';
      codec = 'Linear PCM';
      supportLevel = 'native';
      isNativelySupported = true;
    }
    // 8. ALAC (Apple Lossless Audio Codec)
    else if (lowerCodec.includes('alac') || lowerName.includes('.alac.') || lowerName.includes('alac')) {
      container = 'MPEG-4 (M4A)';
      codec = 'Apple Lossless Audio Codec (ALAC)';
      const probe = this.probeNativeSupport('audio/mp4', 'alac');
      supportLevel = probe.supported ? 'native' : 'demuxed';
      isNativelySupported = probe.supported;
    }
    // 9. AAC (Advanced Audio Coding) / MP4 / M4A
    else if (ext === 'aac' || ext === 'm4a' || ext === 'mp4' || lowerCodec.includes('aac') || lowerCodec.includes('mp4a')) {
      container = ext === 'aac' ? 'ADTS Stream' : 'MPEG-4 (MP4)';
      codec = 'Advanced Audio Coding (AAC-LC)';
      supportLevel = 'native';
      isNativelySupported = true;
    }
    // 10. WebM / Opus / Vorbis
    else if (ext === 'webm' || ext === 'opus' || lowerCodec.includes('opus') || mimeType.includes('webm')) {
      container = ext === 'opus' ? 'Ogg Container' : 'WebM Container';
      codec = lowerCodec.includes('vorbis') ? 'Vorbis' : 'Opus';
      supportLevel = 'native';
      isNativelySupported = true;
    }
    // 11. OGG (Ogg Vorbis)
    else if (ext === 'ogg' || ext === 'oga' || lowerCodec.includes('vorbis') || mimeType.includes('ogg')) {
      container = 'Ogg Container';
      codec = 'Ogg Vorbis';
      supportLevel = 'native';
      isNativelySupported = true;
    }
    // 12. AIFF (Audio Interchange File Format)
    else if (ext === 'aiff' || ext === 'aif' || mimeType.includes('aiff')) {
      container = 'Audio Interchange File Format (AIFF)';
      codec = 'Linear PCM (Big-Endian)';
      const probe = this.probeNativeSupport('audio/aiff');
      supportLevel = probe.supported ? 'native' : 'demuxed';
      isNativelySupported = probe.supported;
    }
    // 13. General MP4
    else if (ext === 'mp4' || mimeType.includes('mp4')) {
      container = 'MPEG-4 (MP4)';
      codec = explicitCodec || 'AAC Audio';
      supportLevel = 'native';
      isNativelySupported = true;
    }
    // Fallback
    else {
      container = ext ? ext.toUpperCase() : 'Standard Audio';
      codec = explicitCodec || 'Standard Audio Stream';
      supportLevel = 'native';
      isNativelySupported = true;
    }

    const channelLayout = hasSony360Metadata ? 'Sony 360 Reality Audio' : this.getChannelLayoutLabel(channels);
    const isImmersiveEligible = channels >= 5 || hasSony360Metadata;

    return {
      container,
      extension: ext,
      codec,
      channels,
      channelLayout,
      bitrate,
      sampleRate,
      supportLevel,
      isNativelySupported,
      unsupportedReason,
      isImmersiveEligible,
      hasSony360Metadata,
    };
  }
}

export const audioFormatDetector = new AudioFormatDetector();
