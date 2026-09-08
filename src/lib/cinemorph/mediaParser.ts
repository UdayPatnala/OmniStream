import {
  MediaAudioTrack,
  MediaVideoStream,
  MediaSubtitleTrack,
  MediaContainerAnalysis,
} from '../../types';

/**
 * ISO 639-1 / ISO 639-2 / BCP-47 Natural Language Map
 */
const LANGUAGE_MAP: Record<string, string> = {
  eng: 'English',
  en: 'English',
  jpn: 'Japanese',
  ja: 'Japanese',
  hin: 'Hindi',
  hi: 'Hindi',
  tel: 'Telugu',
  te: 'Telugu',
  tam: 'Tamil',
  ta: 'Tamil',
  spa: 'Spanish',
  es: 'Spanish',
  fra: 'French',
  fre: 'French',
  fr: 'French',
  deu: 'German',
  ger: 'German',
  de: 'German',
  ita: 'Italian',
  it: 'Italian',
  kor: 'Korean',
  ko: 'Korean',
  zho: 'Chinese',
  chi: 'Chinese',
  zh: 'Chinese',
  rus: 'Russian',
  ru: 'Russian',
  ara: 'Arabic',
  ar: 'Arabic',
  por: 'Portuguese',
  pt: 'Portuguese',
  ben: 'Bengali',
  bn: 'Bengali',
  kan: 'Kannada',
  kn: 'Kannada',
  mal: 'Malayalam',
  ml: 'Malayalam',
  mar: 'Marathi',
  mr: 'Marathi',
  pan: 'Punjabi',
  pa: 'Punjabi',
  guj: 'Gujarati',
  gu: 'Gujarati',
  urd: 'Urdu',
  ur: 'Urdu',
  pol: 'Polish',
  pl: 'Polish',
  nld: 'Dutch',
  dut: 'Dutch',
  nl: 'Dutch',
  swe: 'Swedish',
  sv: 'Swedish',
  nor: 'Norwegian',
  no: 'Norwegian',
  dan: 'Danish',
  da: 'Danish',
  fin: 'Finnish',
  fi: 'Finnish',
  und: 'Undetermined',
  mis: 'Uncoded Language',
  mul: 'Multiple Languages',
  zxx: 'No Linguistic Content',
};

/**
 * Convert ISO language code into clear natural label
 * Returns 'Undetermined' when language is unlabelled (Zero fake language assumptions)
 */
export function resolveLanguageName(code?: string): string {
  if (!code) return 'Undetermined';
  const clean = code.trim().toLowerCase().split('-')[0];
  return LANGUAGE_MAP[clean] || (clean === 'und' ? 'Undetermined' : code.toUpperCase());
}

/**
 * Formats channel numbers to recognizable sound layouts
 */
export function formatChannelLayout(channels?: number): string {
  if (!channels || channels <= 0) return 'Stereo 2.0';
  switch (channels) {
    case 1:
      return 'Mono 1.0';
    case 2:
      return 'Stereo 2.0';
    case 3:
      return '2.1 Surround';
    case 4:
      return '4.0 Quad';
    case 6:
      return '5.1 Surround';
    case 8:
      return '7.1 Surround';
    default:
      return `${channels}-Channel`;
  }
}

/**
 * Tests browser playback support for audio codecs
 */
export function probeAudioCodecPlayability(codec: string, channels = 2): { isPlayable: boolean; unsupportedReason?: string } {
  const norm = codec.toUpperCase();
  
  if (norm.includes('AAC') || norm === 'MP4A') {
    return { isPlayable: true };
  }
  if (norm.includes('MP3') || norm === 'MPEG') {
    return { isPlayable: true };
  }
  if (norm.includes('OPUS') || norm.includes('VORBIS')) {
    return { isPlayable: true };
  }
  if (norm.includes('FLAC') || norm.includes('PCM') || norm.includes('WAV')) {
    return { isPlayable: true };
  }
  if (norm.includes('ALAC')) {
    return { isPlayable: true };
  }
  if (norm.includes('AC-3') || norm.includes('AC3') || norm.includes('E-AC-3') || norm.includes('EAC3') || norm.includes('DOLBY')) {
    // Probe browser Dolby capability
    if (typeof document !== 'undefined') {
      const audioEl = document.createElement('audio');
      const canAC3 = audioEl.canPlayType('audio/mp4; codecs="ac-3"') || audioEl.canPlayType('audio/mp4; codecs="ec-3"');
      if (canAC3 === 'probably' || canAC3 === 'maybe') {
        return { isPlayable: true };
      }
    }
    return {
      isPlayable: false,
      unsupportedReason: 'Dolby Digital AC-3/E-AC-3 requires browser hardware decoder not present in this environment',
    };
  }
  if (norm.includes('DTS') || norm.includes('TRUEHD')) {
    return {
      isPlayable: false,
      unsupportedReason: 'DTS / TrueHD multi-channel audio is unsupported by browser audio decoders',
    };
  }

  return { isPlayable: true };
}

/**
 * Tests browser playback support for video codecs
 */
export function probeVideoCodecPlayability(codec: string): { isPlayable: boolean; unsupportedReason?: string } {
  const norm = codec.toUpperCase();

  if (norm.includes('AVC') || norm.includes('H.264') || norm.includes('H264') || norm.includes('AVC1')) {
    return { isPlayable: true };
  }
  if (norm.includes('VP8') || norm.includes('VP9') || norm.includes('AV1')) {
    return { isPlayable: true };
  }
  if (norm.includes('HEVC') || norm.includes('H.265') || norm.includes('H265') || norm.includes('HVC1') || norm.includes('HEV1')) {
    if (typeof document !== 'undefined') {
      const videoEl = document.createElement('video');
      const canHEVC = videoEl.canPlayType('video/mp4; codecs="hvc1.1.6.L93.B0"') || videoEl.canPlayType('video/mp4; codecs="hev1.1.6.L93.B0"');
      if (canHEVC === 'probably' || canHEVC === 'maybe') {
        return { isPlayable: true };
      }
    }
    return {
      isPlayable: true,
      unsupportedReason: 'H.265 / HEVC requires hardware video acceleration on host OS',
    };
  }

  return { isPlayable: true };
}

/**
 * CineMorph Client-Side Media Demuxer
 */
export class CineMorphMediaParser {
  /**
   * Fast asynchronous parse of a local personal media file
   */
  public async parseMediaFile(file: File | Blob, fileName = 'media'): Promise<MediaContainerAnalysis> {
    const fileSizeBytes = file.size;
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    // Direct Audio files (WAV, MP3, FLAC, AAC, OGG, OPUS)
    if (['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'opus'].includes(ext)) {
      return this.parseDirectAudioFile(file, fileName, ext);
    }

    try {
      // Step 1: Read the first 4MB for header analysis
      const headerChunk = await this.readChunk(file, 0, Math.min(4 * 1024 * 1024, fileSizeBytes));
      const dataView = new DataView(headerChunk);

      // Check for Matroska / WebM (EBML) signature (0x1A45DFA3)
      if (this.isEBML(dataView)) {
        return await this.parseMatroskaOrWebM(file, headerChunk, fileName, fileSizeBytes);
      }

      // Check for ISOBMFF / MP4 / MOV / M4V box structure
      if (this.isISOBMFF(dataView)) {
        return await this.parseISOBMFF(file, headerChunk, fileName, fileSizeBytes);
      }

      // Generic Fallback
      return this.generateGenericAnalysis(file, fileName, ext, fileSizeBytes);
    } catch (err) {
      console.warn('[CineMorphMediaParser] Fast demux failed, using robust fallback:', err);
      return this.generateGenericAnalysis(file, fileName, ext, fileSizeBytes);
    }
  }

  private isEBML(view: DataView): boolean {
    if (view.byteLength < 4) return false;
    if (view.getUint32(0) === 0x1a45dfa3) return true;
    const len = Math.min(view.byteLength - 4, 128);
    for (let i = 0; i <= len; i++) {
      if (view.getUint32(i) === 0x1a45dfa3) return true;
    }
    return false;
  }

  private isISOBMFF(view: DataView): boolean {
    if (view.byteLength < 8) return false;
    const type = this.readFourCC(view, 4);
    if (['ftyp', 'moov', 'mdat', 'free', 'wide'].includes(type)) return true;
    const len = Math.min(view.byteLength - 8, 128);
    for (let i = 0; i <= len; i++) {
      const t = this.readFourCC(view, i + 4);
      if (['ftyp', 'moov', 'mdat', 'free', 'wide'].includes(t)) return true;
    }
    return false;
  }

  private readFourCC(view: DataView, offset: number): string {
    if (offset + 4 > view.byteLength) return '';
    return String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3)
    );
  }

  private async readChunk(file: File | Blob, start: number, length: number): Promise<ArrayBuffer> {
    const slice = file.slice(start, start + length);
    return await slice.arrayBuffer();
  }

  /**
   * Parse MP4 / QuickTime MOV / M4V container structures
   */
  private async parseISOBMFF(
    file: File | Blob,
    initialChunk: ArrayBuffer,
    fileName: string,
    fileSizeBytes: number
  ): Promise<MediaContainerAnalysis> {
    const audioTracks: MediaAudioTrack[] = [];
    const videoStreams: MediaVideoStream[] = [];
    const subtitleTracks: MediaSubtitleTrack[] = [];

    let view = new DataView(initialChunk);
    let moovBuffer: ArrayBuffer | null = null;

    // Scan top-level boxes to locate 'moov'
    let offset = 0;
    while (offset + 8 <= view.byteLength) {
      const boxSize = view.getUint32(offset);
      const boxType = this.readFourCC(view, offset + 4);

      if (boxSize === 0) break; // Extends to EOF

      if (boxType === 'moov') {
        const actualBoxSize = boxSize === 1 ? Number(view.getBigUint64(offset + 8)) : boxSize;
        if (offset + actualBoxSize <= view.byteLength) {
          moovBuffer = initialChunk.slice(offset, offset + actualBoxSize);
        } else {
          // moov is larger than initial slice, read exact moov slice
          moovBuffer = await this.readChunk(file, offset, Math.min(actualBoxSize, 8 * 1024 * 1024));
        }
        break;
      }

      const step = boxSize === 1 ? Number(view.getBigUint64(offset + 8)) : boxSize;
      if (step <= 0) break;
      offset += step;
    }

    // If moov is at the end of the file (common in non-faststart MP4 exports)
    if (!moovBuffer && fileSizeBytes > initialChunk.byteLength) {
      const tailSize = Math.min(4 * 1024 * 1024, fileSizeBytes);
      const tailChunk = await this.readChunk(file, fileSizeBytes - tailSize, tailSize);
      const tailView = new DataView(tailChunk);

      // Try box traversal first
      let tOffset = 0;
      while (tOffset + 8 <= tailView.byteLength) {
        const bSize = tailView.getUint32(tOffset);
        const bType = this.readFourCC(tailView, tOffset + 4);
        if (bType === 'moov') {
          moovBuffer = tailChunk.slice(tOffset);
          break;
        }
        if (bSize <= 0) break;
        tOffset += bSize;
      }

      // If box traversal didn't align, perform byte-level scan for 'moov' tag
      if (!moovBuffer) {
        const uint8Tail = new Uint8Array(tailChunk);
        for (let i = 0; i <= uint8Tail.length - 8; i++) {
          if (
            uint8Tail[i + 4] === 0x6d && // 'm'
            uint8Tail[i + 5] === 0x6f && // 'o'
            uint8Tail[i + 6] === 0x6f && // 'o'
            uint8Tail[i + 7] === 0x76    // 'v'
          ) {
            moovBuffer = tailChunk.slice(i);
            break;
          }
        }
      }
    }

    if (moovBuffer) {
      this.parseMoovBox(new DataView(moovBuffer), audioTracks, videoStreams, subtitleTracks);
    }

    // If no tracks found through box parsing, create clean baseline
    if (audioTracks.length === 0) {
      audioTracks.push({
        id: 'audio-0',
        streamIndex: 0,
        label: 'Audio Stream #1 (Direct Source)',
        originalTitle: undefined,
        language: 'Undetermined',
        languageCode: 'und',
        codec: 'Source Audio',
        channels: 2,
        channelLayout: 'Stereo 2.0',
        sampleRate: 48000,
        isDefault: true,
        isPlayable: true,
      });
    }

    if (videoStreams.length === 0) {
      videoStreams.push({
        id: 'video-0',
        streamIndex: 0,
        label: 'Video Stream #1 (Direct Source)',
        codec: 'Source Video',
        width: 1920,
        height: 1080,
        resolution: 'Source Resolution',
        aspectRatio: '16:9',
        isDefault: true,
        isPlayable: true,
      });
    }

    if (!audioTracks.some((t) => t.isDefault) && audioTracks.length > 0) {
      const firstPlayable = audioTracks.find((t) => t.isPlayable) || audioTracks[0];
      if (firstPlayable) firstPlayable.isDefault = true;
    }
    if (!videoStreams.some((v) => v.isDefault) && videoStreams.length > 0) {
      const firstPlayable = videoStreams.find((v) => v.isPlayable) || videoStreams[0];
      if (firstPlayable) firstPlayable.isDefault = true;
    }
    if (!subtitleTracks.some((s) => s.isDefault) && subtitleTracks.length > 0) {
      subtitleTracks[0].isDefault = true;
    }

    const defaultAudio = audioTracks.find((t) => t.isDefault && t.isPlayable)?.id || audioTracks[0]?.id || '';
    const defaultVideo = videoStreams.find((v) => v.isDefault && v.isPlayable)?.id || videoStreams[0]?.id || '';

    return {
      containerFormat: 'MP4 / QuickTime (ISOBMFF)',
      mimeType: file.type || 'video/mp4',
      durationSeconds: 0,
      fileSizeBytes,
      audioTracks,
      videoStreams,
      subtitleTracks,
      defaultAudioTrackId: defaultAudio,
      defaultVideoStreamId: defaultVideo,
      isContainerSupported: true,
      isPlaybackSupported: (audioTracks.length === 0 || audioTracks.some((t) => t.isPlayable)) && (videoStreams.length === 0 || videoStreams.some((v) => v.isPlayable)),
      compatibilitySummary: `${audioTracks.length} Audio Track${audioTracks.length > 1 ? 's' : ''}, ${videoStreams.length} Video Stream`,
    };
  }

  private parseMoovBox(
    view: DataView,
    audioTracks: MediaAudioTrack[],
    videoStreams: MediaVideoStream[],
    subtitleTracks: MediaSubtitleTrack[]
  ) {
    let offset = 8; // skip moov header (size + 'moov')
    let trackIndex = 0;

    while (offset + 8 <= view.byteLength) {
      const boxSize = view.getUint32(offset);
      const boxType = this.readFourCC(view, offset + 4);

      if (boxSize <= 0) break;

      if (boxType === 'trak') {
        const trakView = new DataView(view.buffer, view.byteOffset + offset, Math.min(boxSize, view.byteLength - offset));
        this.parseTrakBox(trakView, trackIndex, audioTracks, videoStreams, subtitleTracks);
        trackIndex++;
      }

      offset += boxSize;
    }
  }

  private parseTrakBox(
    trakView: DataView,
    trackIndex: number,
    audioTracks: MediaAudioTrack[],
    videoStreams: MediaVideoStream[],
    subtitleTracks: MediaSubtitleTrack[]
  ) {
    let handlerType = '';
    let languageCode = 'und';
    let trackTitle = '';
    let codec = '';
    let channels = 2;
    let sampleRate = 48000;
    let width = 1920;
    let height = 1080;
    const isDefault = trackIndex === 0;

    // Scan inside trak box
    let offset = 8;
    while (offset + 8 <= trakView.byteLength) {
      const boxSize = trakView.getUint32(offset);
      const boxType = this.readFourCC(trakView, offset + 4);
      if (boxSize <= 0 || offset + boxSize > trakView.byteLength) break;

      // User data title: 'udta' -> 'name' or 'titl'
      if (boxType === 'udta') {
        const title = this.extractTitleFromUdta(trakView, offset, boxSize);
        if (title) trackTitle = title;
      }

      // Media box: 'mdia'
      if (boxType === 'mdia') {
        let mOffset = offset + 8;
        while (mOffset + 8 <= offset + boxSize && mOffset + 8 <= trakView.byteLength) {
          const mSize = trakView.getUint32(mOffset);
          const mType = this.readFourCC(trakView, mOffset + 4);
          if (mSize <= 0) break;

          if (mType === 'mdhd') {
            // Unpack 16-bit packed ISO-639-2/T language code at byte 20 or 32
            const version = trakView.getUint8(mOffset + 8);
            const langOffset = version === 1 ? mOffset + 36 : mOffset + 28;
            if (langOffset + 2 <= trakView.byteLength) {
              const packedLang = trakView.getUint16(langOffset);
              languageCode = this.unpackIsoLanguage(packedLang);
            }
          }

          if (mType === 'hdlr') {
            // Handler type at offset 16
            handlerType = this.readFourCC(trakView, mOffset + 16);
            if (!trackTitle && mOffset + 32 < mOffset + mSize && mOffset + 32 < trakView.byteLength) {
              const nameLen = Math.min(mSize - 32, trakView.byteLength - (mOffset + 32));
              if (nameLen > 0) {
                const nameBytes = new Uint8Array(trakView.buffer, trakView.byteOffset + mOffset + 32, nameLen);
                let rawStr = new TextDecoder('utf-8').decode(nameBytes).replace(/\0+$/, '').trim();
                if (rawStr.charCodeAt(0) === rawStr.length - 1) {
                  rawStr = rawStr.slice(1).trim();
                }
                if (rawStr && !/^(sound|video|subtitle|meta|hint|core media)\s*(handler)?$/i.test(rawStr)) {
                  trackTitle = rawStr;
                }
              }
            }
          }

          if (mType === 'minf') {
            // Sample table description
            const stsdInfo = this.extractStsdInfo(trakView, mOffset, mSize);
            if (stsdInfo.codec) codec = stsdInfo.codec;
            if (stsdInfo.channels) channels = stsdInfo.channels;
            if (stsdInfo.sampleRate) sampleRate = stsdInfo.sampleRate;
            if (stsdInfo.width) width = stsdInfo.width;
            if (stsdInfo.height) height = stsdInfo.height;
          }

          mOffset += mSize;
        }
      }

      offset += boxSize;
    }

    const languageName = resolveLanguageName(languageCode);

    if (handlerType === 'soun') {
      const displayCodec = codec || 'AAC';
      const channelLayout = formatChannelLayout(channels);
      const probe = probeAudioCodecPlayability(displayCodec, channels);
      const streamIdx = audioTracks.length;

      // Prioritize genuine original embedded title, fallback to honest descriptive label
      const label = trackTitle 
        ? trackTitle 
        : languageName !== 'Undetermined'
        ? `${languageName} • ${displayCodec} (${channelLayout})`
        : `Audio Track #${streamIdx + 1} • ${displayCodec} (${channelLayout})`;

      audioTracks.push({
        id: `audio-${streamIdx}`,
        streamIndex: streamIdx,
        label,
        originalTitle: trackTitle || undefined,
        language: languageName,
        languageCode,
        codec: displayCodec,
        channels,
        channelLayout,
        sampleRate,
        isDefault,
        isPlayable: probe.isPlayable,
        unsupportedReason: probe.unsupportedReason,
      });
    } else if (handlerType === 'vide') {
      const displayCodec = codec || 'H.264 / AVC';
      const probe = probeVideoCodecPlayability(displayCodec);
      const streamIdx = videoStreams.length;
      const aspectRatio = this.calculateAspectRatio(width, height);

      const label = trackTitle
        ? trackTitle
        : `Video Stream #${streamIdx + 1} • ${displayCodec} (${width}x${height})`;

      videoStreams.push({
        id: `video-${streamIdx}`,
        streamIndex: streamIdx,
        label,
        codec: displayCodec,
        width,
        height,
        resolution: `${width}x${height}`,
        aspectRatio,
        isDefault: streamIdx === 0,
        isPlayable: probe.isPlayable,
        unsupportedReason: probe.unsupportedReason,
      });
    } else if (handlerType === 'sbtl' || handlerType === 'text' || handlerType === 'subt') {
      const streamIdx = subtitleTracks.length;
      const label = trackTitle
        ? trackTitle
        : languageName !== 'Undetermined'
        ? `${languageName} Subtitles`
        : `Subtitle Track #${streamIdx + 1}`;

      subtitleTracks.push({
        id: `sub-${streamIdx}`,
        streamIndex: streamIdx,
        label,
        language: languageName,
        languageCode,
        format: 'Embedded Timed Text',
        isDefault: false,
        isForced: false,
      });
    }
  }

  private unpackIsoLanguage(packed: number): string {
    const c1 = String.fromCharCode(((packed >> 10) & 0x1f) + 0x60);
    const c2 = String.fromCharCode(((packed >> 5) & 0x1f) + 0x60);
    const c3 = String.fromCharCode((packed & 0x1f) + 0x60);
    const lang = (c1 + c2 + c3).toLowerCase();
    return lang.match(/^[a-z]{3}$/) ? lang : 'und';
  }

  private extractTitleFromUdta(view: DataView, offset: number, size: number): string | null {
    let cur = offset + 8;
    while (cur + 8 <= offset + size && cur + 8 <= view.byteLength) {
      const bSize = view.getUint32(cur);
      const bType = this.readFourCC(view, cur + 4);
      if (bSize <= 0) break;
      if (bType === 'name' || bType === 'titl' || bType === '\u00A9nam') {
        let textStart = cur + 8;
        let textLen = bSize - 8;
        // Check for nested 'data' atom (common in iTunes/Apple metadata: size(4), 'data'(4), flags(4), locale(4))
        if (textLen >= 16 && this.readFourCC(view, textStart + 4) === 'data') {
          textStart += 16;
          textLen -= 16;
        }
        if (textLen > 0 && textStart + textLen <= view.byteLength) {
          const textBytes = new Uint8Array(view.buffer, view.byteOffset + textStart, textLen);
          const rawText = new TextDecoder('utf-8').decode(textBytes);
          const cleanText = rawText.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();
          if (cleanText.length > 0) {
            return cleanText;
          }
        }
      }
      cur += bSize;
    }
    return null;
  }

  private extractStsdInfo(view: DataView, minfOffset: number, minfSize: number): {
    codec?: string;
    channels?: number;
    sampleRate?: number;
    width?: number;
    height?: number;
  } {
    let cur = minfOffset + 8;
    const result: any = {};

    while (cur + 8 <= minfOffset + minfSize && cur + 8 <= view.byteLength) {
      const bSize = view.getUint32(cur);
      const bType = this.readFourCC(view, cur + 4);
      if (bSize <= 0) break;

      if (bType === 'stbl') {
        let sCur = cur + 8;
        while (sCur + 8 <= cur + bSize && sCur + 8 <= view.byteLength) {
          const sSize = view.getUint32(sCur);
          const sType = this.readFourCC(view, sCur + 4);
          if (sSize <= 0) break;

          // stsd box: size(4), 'stsd'(4), version+flags(4), entry_count(4) -> 16 bytes
          // Sample Entry 1 begins at sCur + 16:
          // entry_size (4 bytes) at sCur + 16
          // entry_format / FourCC (4 bytes) at sCur + 20
          if (sType === 'stsd' && sCur + 24 <= view.byteLength) {
            const entryCodec = this.readFourCC(view, sCur + 20);
            result.codec = this.formatCodecFourCC(entryCodec);

            // Audio sample entry:
            // channels is at sCur + 16 + 24 = sCur + 40 (Uint16)
            // samplerate is at sCur + 16 + 32 = sCur + 48 (Uint16 integer part of 16.16)
            if (sCur + 50 <= view.byteLength) {
              const ch = view.getUint16(sCur + 40);
              const sr = view.getUint16(sCur + 48);
              if (ch > 0 && ch <= 8) result.channels = ch;
              if (sr > 0) result.sampleRate = sr;
            }

            // Video sample entry:
            // width is at sCur + 16 + 32 = sCur + 48 (Uint16)
            // height is at sCur + 16 + 34 = sCur + 50 (Uint16)
            if (sCur + 52 <= view.byteLength) {
              const w = view.getUint16(sCur + 48);
              const h = view.getUint16(sCur + 50);
              if (w > 0) result.width = w;
              if (h > 0) result.height = h;
            }
          }
          sCur += sSize;
        }
      }
      cur += bSize;
    }
    return result;
  }

  private formatCodecFourCC(fourcc: string): string {
    switch (fourcc.toLowerCase()) {
      case 'mp4a':
        return 'AAC';
      case 'ac-3':
      case 'ac3 ':
        return 'AC-3';
      case 'ec-3':
        return 'E-AC-3';
      case 'dtsh':
      case 'dts ':
        return 'DTS';
      case 'flac':
        return 'FLAC';
      case 'opus':
        return 'Opus';
      case 'alac':
        return 'ALAC';
      case 'avc1':
      case 'avc3':
        return 'H.264 / AVC';
      case 'hvc1':
      case 'hev1':
        return 'H.265 / HEVC';
      case 'vp09':
        return 'VP9';
      case 'av01':
        return 'AV1';
      default:
        return fourcc.toUpperCase();
    }
  }

  /**
   * Parse Matroska (.mkv) and WebM (.webm) containers using EBML stream scanner
   */
  private async parseMatroskaOrWebM(
    file: File | Blob,
    initialChunk: ArrayBuffer,
    fileName: string,
    fileSizeBytes: number
  ): Promise<MediaContainerAnalysis> {
    const audioTracks: MediaAudioTrack[] = [];
    const videoStreams: MediaVideoStream[] = [];
    const subtitleTracks: MediaSubtitleTrack[] = [];

    let uint8 = new Uint8Array(initialChunk);
    let tracksPos = this.findEbmlId(uint8, [0x16, 0x54, 0xae, 0x6b]);

    // If Tracks element not found in first 4MB, check SeekHead (0x114D9B74)
    if (tracksPos === -1 && fileSizeBytes > initialChunk.byteLength) {
      const seekHeadPos = this.findEbmlId(uint8, [0x11, 0x4d, 0x9b, 0x74]);
      if (seekHeadPos !== -1) {
        const segPos = this.findEbmlId(uint8, [0x18, 0x53, 0x80, 0x67]);
        const segVint = segPos !== -1 ? this.readEbmlVint(uint8, segPos + 4) : { length: 0, bytesRead: 0 };
        const segDataStart = segPos !== -1 ? segPos + 4 + segVint.bytesRead : 0;

        const tracksSeekOffset = this.findTracksOffsetFromSeekHead(uint8, seekHeadPos);
        if (tracksSeekOffset > 0) {
          const targetPos = segDataStart + tracksSeekOffset;
          if (targetPos < fileSizeBytes) {
            const tracksChunk = await this.readChunk(file, targetPos, Math.min(4 * 1024 * 1024, fileSizeBytes - targetPos));
            uint8 = new Uint8Array(tracksChunk);
            tracksPos = this.findEbmlId(uint8, [0x16, 0x54, 0xae, 0x6b]);
          }
        }
      }

      // Fallback expanded chunk scan up to 8MB
      if (tracksPos === -1) {
        const expandedSize = Math.min(8 * 1024 * 1024, fileSizeBytes);
        const expandedChunk = await this.readChunk(file, 0, expandedSize);
        uint8 = new Uint8Array(expandedChunk);
        tracksPos = this.findEbmlId(uint8, [0x16, 0x54, 0xae, 0x6b]);
      }
    }

    const subtitleTrackMap = new Map<number, MediaSubtitleTrack>();

    if (tracksPos !== -1) {
      let pos = tracksPos + 4;
      const { length: tracksLength, bytesRead } = this.readEbmlVint(uint8, pos);
      pos += bytesRead;

      const tracksEnd = (tracksLength > 0 && pos + tracksLength <= uint8.length) 
        ? pos + tracksLength 
        : uint8.length;

      while (pos < tracksEnd) {
        const { id, bytesRead: idBytes } = this.readEbmlElementId(uint8, pos);
        if (idBytes === 0) break;
        pos += idBytes;

        const { length: entryLength, bytesRead: entryBytes } = this.readEbmlVint(uint8, pos);
        if (entryBytes === 0) break;
        pos += entryBytes;

        const entryEnd = Math.min(pos + entryLength, uint8.length);
        if (id === 0xae) { // TrackEntry (0xAE)
          this.parseMatroskaTrackEntry(uint8, pos, entryEnd, audioTracks, videoStreams, subtitleTracks, subtitleTrackMap);
        }
        pos = entryEnd;
      }
    }

    if (subtitleTracks.length > 0) {
      this.scanMatroskaSubtitleCues(uint8, subtitleTrackMap);
      for (const sub of subtitleTracks) {
        if (sub.cues && sub.cues.length > 0) {
          sub.cues.sort((a, b) => a.startTime - b.startTime);
        }
      }
    }

    if (audioTracks.length === 0) {
      audioTracks.push({
        id: 'audio-0',
        streamIndex: 0,
        label: 'Audio Stream #1 (Direct Source)',
        originalTitle: undefined,
        language: 'Undetermined',
        languageCode: 'und',
        codec: 'Source Audio',
        channels: 2,
        channelLayout: 'Stereo 2.0',
        sampleRate: 48000,
        isDefault: true,
        isPlayable: true,
      });
    }

    if (videoStreams.length === 0) {
      videoStreams.push({
        id: 'video-0',
        streamIndex: 0,
        label: 'Video Stream #1 (Direct Source)',
        codec: 'Source Video',
        width: 1920,
        height: 1080,
        resolution: 'Source Resolution',
        aspectRatio: '16:9',
        isDefault: true,
        isPlayable: true,
      });
    }

    if (!audioTracks.some((t) => t.isDefault) && audioTracks.length > 0) {
      const firstPlayable = audioTracks.find((t) => t.isPlayable) || audioTracks[0];
      if (firstPlayable) firstPlayable.isDefault = true;
    }
    if (!videoStreams.some((v) => v.isDefault) && videoStreams.length > 0) {
      const firstPlayable = videoStreams.find((v) => v.isPlayable) || videoStreams[0];
      if (firstPlayable) firstPlayable.isDefault = true;
    }
    if (!subtitleTracks.some((s) => s.isDefault) && subtitleTracks.length > 0) {
      subtitleTracks[0].isDefault = true;
    }

    const defaultAudio = audioTracks.find((t) => t.isDefault && t.isPlayable)?.id || audioTracks[0]?.id || '';
    const defaultVideo = videoStreams.find((v) => v.isDefault && v.isPlayable)?.id || videoStreams[0]?.id || '';

    return {
      containerFormat: 'Matroska / WebM (EBML)',
      mimeType: file.type || 'video/x-matroska',
      durationSeconds: 0,
      fileSizeBytes,
      audioTracks,
      videoStreams,
      subtitleTracks,
      defaultAudioTrackId: defaultAudio,
      defaultVideoStreamId: defaultVideo,
      isContainerSupported: true,
      isPlaybackSupported: (audioTracks.length === 0 || audioTracks.some((t) => t.isPlayable)) && (videoStreams.length === 0 || videoStreams.some((v) => v.isPlayable)),
      compatibilitySummary: `${audioTracks.length} Audio Track${audioTracks.length > 1 ? 's' : ''}, ${videoStreams.length} Video Stream`,
    };
  }

  private findTracksOffsetFromSeekHead(bytes: Uint8Array, seekHeadOffset: number): number {
    let p = seekHeadOffset + 4;
    const { length: shLen, bytesRead: shBr } = this.readEbmlVint(bytes, p);
    if (shBr === 0) return 0;
    p += shBr;
    const shEnd = Math.min(p + shLen, bytes.length);

    while (p < shEnd) {
      const { id, bytesRead: idBytes } = this.readEbmlElementId(bytes, p);
      if (idBytes === 0) break;
      p += idBytes;
      const { length: len, bytesRead: lenBytes } = this.readEbmlVint(bytes, p);
      if (lenBytes === 0) break;
      p += lenBytes;
      const entryEnd = Math.min(p + len, shEnd);

      if (id === 0x4dbb) { // Seek element (0x4DBB)
        let sPos = p;
        let isTracks = false;
        let seekPosition = 0;

        while (sPos < entryEnd) {
          const { id: sId, bytesRead: sIdBytes } = this.readEbmlElementId(bytes, sPos);
          if (sIdBytes === 0) break;
          sPos += sIdBytes;
          const { length: sLen, bytesRead: sLenBytes } = this.readEbmlVint(bytes, sPos);
          if (sLenBytes === 0) break;
          sPos += sLenBytes;
          const sDataEnd = Math.min(sPos + sLen, entryEnd);

          if (sId === 0x53ab) { // SeekID (0x53AB)
            // Look for 0x1654AE6B (Tracks)
            if (sLen === 4 &&
                bytes[sPos] === 0x16 &&
                bytes[sPos + 1] === 0x54 &&
                bytes[sPos + 2] === 0xae &&
                bytes[sPos + 3] === 0x6b) {
              isTracks = true;
            }
          } else if (sId === 0x53ac) { // SeekPosition (0x53AC)
            seekPosition = this.readEbmlUint(bytes, sPos, sLen);
          }
          sPos = sDataEnd;
        }

        if (isTracks && seekPosition > 0) {
          return seekPosition;
        }
      }
      p = entryEnd;
    }
    return 0;
  }

  private parseMatroskaTrackEntry(
    bytes: Uint8Array,
    start: number,
    end: number,
    audioTracks: MediaAudioTrack[],
    videoStreams: MediaVideoStream[],
    subtitleTracks: MediaSubtitleTrack[],
    subtitleTrackMap?: Map<number, MediaSubtitleTrack>
  ) {
    let trackType = 0; // 1 = video, 2 = audio, 17 = subtitle
    let trackNumber = 1;
    let trackName = '';
    let languageCode = 'und';
    let codecId = '';
    let channels = 2;
    let sampleRate = 48000;
    let width = 1920;
    let height = 1080;
    let isDefault = false;

    let p = start;
    while (p < end) {
      const { id, bytesRead: idBytes } = this.readEbmlElementId(bytes, p);
      if (idBytes === 0) break;
      p += idBytes;

      const { length: len, bytesRead: lenBytes } = this.readEbmlVint(bytes, p);
      if (lenBytes === 0) break;
      p += lenBytes;

      const dataEnd = Math.min(p + len, end);

      if (id === 0xd7) { // TrackNumber (0xD7)
        trackNumber = this.readEbmlUint(bytes, p, len) || 1;
      } else if (id === 0x83) { // TrackType (0x83)
        trackType = bytes[p];
      } else if (id === 0x86) { // CodecID (0x86)
        codecId = new TextDecoder('utf-8').decode(bytes.subarray(p, dataEnd));
      } else if (id === 0x536e) { // Name (0x536E)
        trackName = new TextDecoder('utf-8').decode(bytes.subarray(p, dataEnd)).trim();
      } else if (id === 0x22b59c || id === 0x22b59d) { // Language (0x22B59C) or LanguageBCP47 (0x22B59D)
        languageCode = new TextDecoder('utf-8').decode(bytes.subarray(p, dataEnd)).trim();
      } else if (id === 0x88) { // FlagDefault (0x88)
        isDefault = bytes[p] === 1;
      } else if (id === 0xe1) { // Audio settings (0xE1)
        let aPos = p;
        while (aPos < dataEnd) {
          const { id: aId, bytesRead: aIdBytes } = this.readEbmlElementId(bytes, aPos);
          if (aIdBytes === 0) break;
          aPos += aIdBytes;
          const { length: aLen, bytesRead: aLenBytes } = this.readEbmlVint(bytes, aPos);
          if (aLenBytes === 0) break;
          aPos += aLenBytes;
          const aDataEnd = Math.min(aPos + aLen, dataEnd);

          if (aId === 0x9f) { // Channels (0x9F)
            channels = this.readEbmlUint(bytes, aPos, aLen) || 2;
          } else if (aId === 0xb5) { // SamplingFrequency (0xB5)
            const freq = this.readEbmlFloat(bytes, aPos, aLen);
            if (freq > 0) sampleRate = Math.round(freq);
          }
          aPos = aDataEnd;
        }
      } else if (id === 0xe0) { // Video settings (0xE0)
        let vPos = p;
        while (vPos < dataEnd) {
          const { id: vId, bytesRead: vIdBytes } = this.readEbmlElementId(bytes, vPos);
          if (vIdBytes === 0) break;
          vPos += vIdBytes;
          const { length: vLen, bytesRead: vLenBytes } = this.readEbmlVint(bytes, vPos);
          if (vLenBytes === 0) break;
          vPos += vLenBytes;
          const vDataEnd = Math.min(vPos + vLen, dataEnd);

          if (vId === 0xb0) { // PixelWidth (0xB0)
            width = this.readEbmlUint(bytes, vPos, vLen) || 1920;
          } else if (vId === 0xba) { // PixelHeight (0xBA)
            height = this.readEbmlUint(bytes, vPos, vLen) || 1080;
          }
          vPos = vDataEnd;
        }
      }

      p = dataEnd;
    }

    const languageName = resolveLanguageName(languageCode);
    const displayCodec = this.formatMatroskaCodec(codecId);

    if (trackType === 2) { // Audio Track
      const streamIdx = audioTracks.length;
      const channelLayout = formatChannelLayout(channels);
      const probe = probeAudioCodecPlayability(displayCodec, channels);

      const label = trackName
        ? trackName
        : languageName !== 'Undetermined'
        ? `${languageName} • ${displayCodec} (${channelLayout})`
        : `Audio Track #${streamIdx + 1} • ${displayCodec} (${channelLayout})`;

      audioTracks.push({
        id: `audio-${streamIdx}`,
        streamIndex: streamIdx,
        label,
        originalTitle: trackName || undefined,
        language: languageName,
        languageCode,
        codec: displayCodec,
        channels,
        channelLayout,
        sampleRate,
        isDefault,
        isPlayable: probe.isPlayable,
        unsupportedReason: probe.unsupportedReason,
      });
    } else if (trackType === 1) { // Video Track
      const streamIdx = videoStreams.length;
      const probe = probeVideoCodecPlayability(displayCodec);
      const aspectRatio = this.calculateAspectRatio(width, height);

      const label = trackName
        ? trackName
        : `Video Stream #${streamIdx + 1} • ${displayCodec} (${width}x${height})`;

      videoStreams.push({
        id: `video-${streamIdx}`,
        streamIndex: streamIdx,
        label,
        codec: displayCodec,
        width,
        height,
        resolution: `${width}x${height}`,
        aspectRatio,
        isDefault,
        isPlayable: probe.isPlayable,
        unsupportedReason: probe.unsupportedReason,
      });
    } else if (trackType === 17) { // Subtitle Track
      const streamIdx = subtitleTracks.length;
      const label = trackName
        ? trackName
        : languageName !== 'Undetermined'
        ? `${languageName} Subtitles`
        : `Subtitle Track #${streamIdx + 1}`;

      const subTrack: MediaSubtitleTrack = {
        id: `sub-${streamIdx}`,
        streamIndex: streamIdx,
        label,
        language: languageName,
        languageCode,
        format: displayCodec || 'SubRip (SRT)',
        isDefault,
        isForced: false,
        cues: [],
      };
      subtitleTracks.push(subTrack);
      if (subtitleTrackMap) {
        subtitleTrackMap.set(trackNumber, subTrack);
      }
    }
  }

  private scanMatroskaSubtitleCues(
    bytes: Uint8Array,
    subtitleTrackMap: Map<number, MediaSubtitleTrack>,
    timecodeScaleNs: number = 1000000
  ) {
    let p = 0;
    while (p + 4 < bytes.length) {
      // Look for Cluster element ID: 0x1F43B675
      if (bytes[p] === 0x1f && bytes[p + 1] === 0x43 && bytes[p + 2] === 0xb6 && bytes[p + 3] === 0x75) {
        p += 4;
        const { length: clusterLen, bytesRead: cBr } = this.readEbmlVint(bytes, p);
        if (cBr === 0) break;
        p += cBr;
        const clusterEnd = clusterLen > 0 ? Math.min(p + clusterLen, bytes.length) : bytes.length;

        let clusterTimecode = 0;

        while (p < clusterEnd) {
          const { id, bytesRead: idBytes } = this.readEbmlElementId(bytes, p);
          if (idBytes === 0) break;
          p += idBytes;
          const { length: elLen, bytesRead: elBr } = this.readEbmlVint(bytes, p);
          if (elBr === 0) break;
          p += elBr;
          const elEnd = Math.min(p + elLen, clusterEnd);

          if (id === 0xe7) { // Timestamp / Timecode (0xE7)
            clusterTimecode = this.readEbmlUint(bytes, p, elLen);
          } else if (id === 0xa3) { // SimpleBlock (0xA3)
            this.parseBlockPayload(bytes, p, elEnd, clusterTimecode, timecodeScaleNs, subtitleTrackMap, 3.5);
          } else if (id === 0xa0) { // BlockGroup (0xA0)
            let bgPos = p;
            let blockDurationMs: number | null = null;
            let blockStart = 0;
            let blockEnd = 0;

            while (bgPos < elEnd) {
              const { id: bgId, bytesRead: bgIdBytes } = this.readEbmlElementId(bytes, bgPos);
              if (bgIdBytes === 0) break;
              bgPos += bgIdBytes;
              const { length: bgLen, bytesRead: bgLenBytes } = this.readEbmlVint(bytes, bgPos);
              if (bgLenBytes === 0) break;
              bgPos += bgLenBytes;
              const subEnd = Math.min(bgPos + bgLen, elEnd);

              if (bgId === 0x9b) { // BlockDuration (0x9B)
                blockDurationMs = (this.readEbmlUint(bytes, bgPos, bgLen) * timecodeScaleNs) / 1e6;
              } else if (bgId === 0xa1) { // Block (0xA1)
                blockStart = bgPos;
                blockEnd = subEnd;
              }
              bgPos = subEnd;
            }

            if (blockStart > 0 && blockEnd > blockStart) {
              const defaultDur = blockDurationMs !== null ? blockDurationMs / 1000 : 3.5;
              this.parseBlockPayload(bytes, blockStart, blockEnd, clusterTimecode, timecodeScaleNs, subtitleTrackMap, defaultDur);
            }
          }

          p = elEnd;
        }
      } else {
        p++;
      }
    }
  }

  private parseBlockPayload(
    bytes: Uint8Array,
    start: number,
    end: number,
    clusterTimecode: number,
    timecodeScaleNs: number,
    subtitleTrackMap: Map<number, MediaSubtitleTrack>,
    durationSec: number
  ) {
    if (start >= end) return;
    const { length: trackNum, bytesRead: trBr } = this.readEbmlVint(bytes, start);
    if (trBr === 0) return;
    const payloadPos = start + trBr;
    if (payloadPos + 3 > end) return;

    const subTrack = subtitleTrackMap.get(trackNum);
    if (!subTrack) return;

    // Relative timecode (int16 signed big-endian)
    const view = new DataView(bytes.buffer, bytes.byteOffset + payloadPos, 2);
    const relTimecode = view.getInt16(0, false);
    const dataStart = payloadPos + 3; // skip 2 bytes timecode + 1 byte flags
    if (dataStart >= end) return;

    const startTimeSec = Math.max(0, ((clusterTimecode + relTimecode) * timecodeScaleNs) / 1e9);
    const endTimeSec = startTimeSec + Math.max(0.5, durationSec);

    const rawBytes = bytes.subarray(dataStart, end);
    let text = new TextDecoder('utf-8').decode(rawBytes);

    if (subTrack.format.includes('ASS') || subTrack.format.includes('SSA')) {
      const parts = text.split(',');
      if (parts.length >= 9) {
        text = parts.slice(8).join(',');
      }
    }

    text = text.replace(/\\N/gi, '\n').replace(/\\n/gi, '\n').replace(/\{[^}]+\}/g, '').trim();

    if (text.length > 0) {
      if (!subTrack.cues) subTrack.cues = [];
      subTrack.cues.push({
        startTime: startTimeSec,
        endTime: endTimeSec,
        text,
      });
    }
  }

  private formatMatroskaCodec(codecId: string): string {
    const norm = codecId.toUpperCase();
    if (norm.includes('AAC')) return 'AAC';
    if (norm.includes('AC3') && !norm.includes('EAC3')) return 'AC-3';
    if (norm.includes('EAC3')) return 'E-AC-3';
    if (norm.includes('DTS')) return 'DTS';
    if (norm.includes('TRUEHD')) return 'TrueHD';
    if (norm.includes('FLAC')) return 'FLAC';
    if (norm.includes('OPUS')) return 'Opus';
    if (norm.includes('VORBIS')) return 'Vorbis';
    if (norm.includes('PCM')) return 'PCM';
    if (norm.includes('AVC') || norm.includes('H264')) return 'H.264 / AVC';
    if (norm.includes('HEVC') || norm.includes('H265')) return 'H.265 / HEVC';
    if (norm.includes('VP8')) return 'VP8';
    if (norm.includes('VP9')) return 'VP9';
    if (norm.includes('AV1')) return 'AV1';

    // Subtitle formats
    if (norm.includes('UTF8') || norm.includes('SRT')) return 'SubRip (SRT)';
    if (norm.includes('ASS')) return 'Advanced SubStation (ASS)';
    if (norm.includes('SSA')) return 'SubStation Alpha (SSA)';
    if (norm.includes('WEBVTT')) return 'WebVTT';
    if (norm.includes('VOBSUB')) return 'VobSub DVD';
    if (norm.includes('HDMV') || norm.includes('PGS')) return 'Blu-ray PGS';

    return codecId.replace(/^[AVS]_\w+\//, '').replace(/^[AVS]_/, '');
  }

  private readEbmlElementId(bytes: Uint8Array, offset: number): { id: number; bytesRead: number } {
    if (offset >= bytes.length) return { id: 0, bytesRead: 0 };
    const first = bytes[offset];
    let numBytes = 1;
    let mask = 0x80;
    while (numBytes <= 4 && (first & mask) === 0) {
      mask >>= 1;
      numBytes++;
    }
    if (numBytes > 4 || offset + numBytes > bytes.length) {
      return { id: 0, bytesRead: 1 };
    }
    let id = 0;
    for (let i = 0; i < numBytes; i++) {
      id = (id << 8) | bytes[offset + i];
    }
    return { id: id >>> 0, bytesRead: numBytes };
  }

  private readEbmlFloat(bytes: Uint8Array, offset: number, length: number): number {
    if (offset + length > bytes.length) return 0;
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset, length);
    if (length === 4) return view.getFloat32(0);
    if (length === 8) return view.getFloat64(0);
    return 0;
  }

  private findEbmlId(bytes: Uint8Array, pattern: number[]): number {
    for (let i = 0; i <= bytes.length - pattern.length; i++) {
      let match = true;
      for (let j = 0; j < pattern.length; j++) {
        if (bytes[i + j] !== pattern[j]) {
          match = false;
          break;
        }
      }
      if (match) return i;
    }
    return -1;
  }

  private readEbmlVint(bytes: Uint8Array, offset: number): { length: number; bytesRead: number } {
    if (offset >= bytes.length) return { length: 0, bytesRead: 0 };
    const first = bytes[offset];
    let mask = 0x80;
    let length = 1;

    while (length <= 8 && (first & mask) === 0) {
      mask >>= 1;
      length++;
    }

    if (length > 8) return { length: 0, bytesRead: 1 };

    let value = first & (mask - 1);
    for (let i = 1; i < length; i++) {
      if (offset + i >= bytes.length) break;
      value = (value << 8) | bytes[offset + i];
    }

    return { length: value, bytesRead: length };
  }

  private readEbmlUint(bytes: Uint8Array, offset: number, length: number): number {
    let val = 0;
    for (let i = 0; i < length; i++) {
      if (offset + i < bytes.length) {
        val = (val << 8) | bytes[offset + i];
      }
    }
    return val;
  }

  private calculateAspectRatio(width: number, height: number): string {
    if (!width || !height || width <= 0 || height <= 0) return '16:9';
    const ratio = width / height;
    if (Math.abs(ratio - 1.90) < 0.08) return '1.90:1';
    if (Math.abs(ratio - 1.43) < 0.08) return '1.43:1';
    if (Math.abs(ratio - 2.39) < 0.08 || Math.abs(ratio - 2.35) < 0.08) return '21:9';
    if (Math.abs(ratio - 1.777) < 0.08) return '16:9';
    if (Math.abs(ratio - 1.333) < 0.08) return '4:3';
    return `${ratio.toFixed(2)}:1`;
  }

  /**
   * Direct Audio parsing (WAV, FLAC, MP3, AAC, OGG)
   */
  private parseDirectAudioFile(file: File | Blob, fileName: string, ext: string): MediaContainerAnalysis {
    const displayCodec = ext.toUpperCase();
    const probe = probeAudioCodecPlayability(displayCodec, 2);

    const audioTrack: MediaAudioTrack = {
      id: 'audio-0',
      streamIndex: 0,
      label: `${fileName.replace(/\.[^/.]+$/, '')} (${displayCodec})`,
      originalTitle: fileName.replace(/\.[^/.]+$/, ''),
      language: 'Stereo Master',
      languageCode: 'und',
      codec: displayCodec,
      channels: 2,
      channelLayout: 'Stereo 2.0',
      sampleRate: 44100,
      isDefault: true,
      isPlayable: probe.isPlayable,
      unsupportedReason: probe.unsupportedReason,
    };

    return {
      containerFormat: `Audio Stream (${displayCodec})`,
      mimeType: file.type || `audio/${ext}`,
      durationSeconds: 0,
      fileSizeBytes: file.size,
      audioTracks: [audioTrack],
      videoStreams: [],
      subtitleTracks: [],
      defaultAudioTrackId: 'audio-0',
      defaultVideoStreamId: '',
      isContainerSupported: true,
      isPlaybackSupported: probe.isPlayable,
      compatibilitySummary: `1 Master Audio Track (${displayCodec})`,
    };
  }

  /**
   * Robust generic fallback analysis
   */
  private generateGenericAnalysis(
    file: File | Blob,
    fileName: string,
    ext: string,
    fileSizeBytes: number
  ): MediaContainerAnalysis {
    const audioTrack: MediaAudioTrack = {
      id: 'audio-0',
      streamIndex: 0,
      label: `Audio Stream #1 (${ext.toUpperCase() || 'Direct'})`,
      originalTitle: undefined,
      language: 'Undetermined',
      languageCode: 'und',
      codec: ext.toUpperCase() || 'Direct Audio',
      channels: 2,
      channelLayout: 'Stereo 2.0',
      sampleRate: 48000,
      isDefault: true,
      isPlayable: true,
    };

    const videoStream: MediaVideoStream = {
      id: 'video-0',
      streamIndex: 0,
      label: `Video Stream #1 (${ext.toUpperCase() || 'Direct'})`,
      codec: ext.toUpperCase() || 'Direct Video',
      width: 1920,
      height: 1080,
      resolution: 'Source Resolution',
      aspectRatio: '16:9',
      isDefault: true,
      isPlayable: true,
    };

    return {
      containerFormat: ext.toUpperCase() || 'Media File',
      mimeType: file.type || `video/${ext}`,
      durationSeconds: 0,
      fileSizeBytes,
      audioTracks: [audioTrack],
      videoStreams: [videoStream],
      subtitleTracks: [],
      defaultAudioTrackId: 'audio-0',
      defaultVideoStreamId: 'video-0',
      isContainerSupported: true,
      isPlaybackSupported: true,
      compatibilitySummary: 'Direct Media Stream (1 Audio, 1 Video)',
    };
  }
}

export const mediaParser = new CineMorphMediaParser();
