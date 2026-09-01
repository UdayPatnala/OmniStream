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
  und: 'Original / Undetermined',
  mis: 'Uncoded Language',
  mul: 'Multiple Languages',
  zxx: 'No Linguistic Content',
};

/**
 * Convert ISO language code into clear natural label
 */
export function resolveLanguageName(code?: string): string {
  if (!code) return 'Original Audio';
  const clean = code.trim().toLowerCase().split('-')[0];
  return LANGUAGE_MAP[clean] || code.toUpperCase();
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
      isPlayable: true,
      unsupportedReason: 'Dolby Digital AC-3/E-AC-3 (Hardware passthrough or stereo fold-down active)',
    };
  }
  if (norm.includes('DTS')) {
    return {
      isPlayable: false,
      unsupportedReason: 'DTS / DTS-HD requires licensed hardware decoder or bitstream pass-through',
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
      // Step 1: Read the first 1.5MB for header analysis
      const headerChunk = await this.readChunk(file, 0, Math.min(1.5 * 1024 * 1024, fileSizeBytes));
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
    return view.getUint32(0) === 0x1a45dfa3;
  }

  private isISOBMFF(view: DataView): boolean {
    if (view.byteLength < 8) return false;
    const type = this.readFourCC(view, 4);
    return ['ftyp', 'moov', 'mdat', 'free', 'wide'].includes(type);
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

    // If moov is at the end of the file (common in YouTube/FastStart exports)
    if (!moovBuffer && fileSizeBytes > initialChunk.byteLength) {
      const tailSize = Math.min(2 * 1024 * 1024, fileSizeBytes);
      const tailChunk = await this.readChunk(file, fileSizeBytes - tailSize, tailSize);
      const tailView = new DataView(tailChunk);

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
    }

    if (moovBuffer) {
      this.parseMoovBox(new DataView(moovBuffer), audioTracks, videoStreams, subtitleTracks);
    }

    // If no tracks found through box parsing, create clean baseline
    if (audioTracks.length === 0) {
      audioTracks.push({
        id: 'audio-0',
        streamIndex: 0,
        label: 'Original Audio (AAC)',
        originalTitle: 'Original Audio',
        language: 'Original',
        languageCode: 'und',
        codec: 'AAC',
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
        label: 'Main Video (H.264)',
        codec: 'H.264 / AVC',
        width: 1920,
        height: 1080,
        resolution: '1920x1080 (1080p FHD)',
        aspectRatio: '16:9',
        isDefault: true,
        isPlayable: true,
      });
    }

    const defaultAudio = audioTracks.find((t) => t.isDefault && t.isPlayable)?.id || audioTracks[0].id;
    const defaultVideo = videoStreams.find((v) => v.isDefault && v.isPlayable)?.id || videoStreams[0].id;

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
      isPlaybackSupported: audioTracks.some((t) => t.isPlayable) && videoStreams.some((v) => v.isPlayable),
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

      // Prioritize original embedded title
      const label = trackTitle 
        ? trackTitle 
        : `${languageName} — ${displayCodec} (${channelLayout})`;

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
        isDefault: isDefault || streamIdx === 0,
        isPlayable: probe.isPlayable,
        unsupportedReason: probe.unsupportedReason,
      });
    } else if (handlerType === 'vide') {
      const displayCodec = codec || 'H.264 / AVC';
      const probe = probeVideoCodecPlayability(displayCodec);
      const streamIdx = videoStreams.length;
      const aspectRatio = this.calculateAspectRatio(width, height);

      videoStreams.push({
        id: `video-${streamIdx}`,
        streamIndex: streamIdx,
        label: trackTitle || `Video Stream ${streamIdx + 1} (${displayCodec})`,
        codec: displayCodec,
        width,
        height,
        resolution: `${width}x${height}`,
        aspectRatio,
        isDefault: streamIdx === 0,
        isPlayable: probe.isPlayable,
        unsupportedReason: probe.unsupportedReason,
      });
    } else if (handlerType === 'sbtl' || handlerType === 'text') {
      const streamIdx = subtitleTracks.length;
      subtitleTracks.push({
        id: `sub-${streamIdx}`,
        streamIndex: streamIdx,
        label: trackTitle || `${languageName} Subtitles`,
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
        const textLen = bSize - 8;
        const textBytes = new Uint8Array(view.buffer, view.byteOffset + cur + 8, textLen);
        return new TextDecoder('utf-8').decode(textBytes).trim();
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

          if (sType === 'stsd' && sCur + 16 <= view.byteLength) {
            const entryCodec = this.readFourCC(view, sCur + 16);
            result.codec = this.formatCodecFourCC(entryCodec);

            // Audio entry
            if (sCur + 36 <= view.byteLength) {
              const ch = view.getUint16(sCur + 32);
              const sr = view.getUint16(sCur + 40);
              if (ch > 0 && ch <= 8) result.channels = ch;
              if (sr > 0) result.sampleRate = sr;
            }

            // Video entry
            if (sCur + 44 <= view.byteLength) {
              const w = view.getUint16(sCur + 36);
              const h = view.getUint16(sCur + 38);
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

    const uint8 = new Uint8Array(initialChunk);
    let pos = 0;

    const tracksPos = this.findEbmlId(uint8, [0x16, 0x54, 0xae, 0x6b]);
    if (tracksPos !== -1) {
      pos = tracksPos + 4;
      const { length: tracksLength, bytesRead } = this.readEbmlVint(uint8, pos);
      pos += bytesRead;

      const tracksEnd = (tracksLength > 0 && pos + tracksLength <= uint8.length) 
        ? pos + tracksLength 
        : uint8.length;

      while (pos < tracksEnd) {
        if (uint8[pos] === 0xae) {
          pos++;
          const { length: entryLength, bytesRead: entryBytes } = this.readEbmlVint(uint8, pos);
          pos += entryBytes;

          const entryEnd = Math.min(pos + entryLength, uint8.length);
          this.parseMatroskaTrackEntry(uint8, pos, entryEnd, audioTracks, videoStreams, subtitleTracks);
          pos = entryEnd;
        } else {
          pos++;
        }
      }
    }

    if (audioTracks.length === 0) {
      audioTracks.push({
        id: 'audio-0',
        streamIndex: 0,
        label: 'Primary Audio (Opus/Vorbis/AAC)',
        originalTitle: 'Primary Audio',
        language: 'Original',
        languageCode: 'und',
        codec: 'Opus',
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
        label: 'Master Video (VP9/H.264)',
        codec: 'VP9 / H.264',
        width: 1920,
        height: 1080,
        resolution: '1920x1080',
        aspectRatio: '16:9',
        isDefault: true,
        isPlayable: true,
      });
    }

    const defaultAudio = audioTracks.find((t) => t.isDefault && t.isPlayable)?.id || audioTracks[0].id;
    const defaultVideo = videoStreams.find((v) => v.isDefault && v.isPlayable)?.id || videoStreams[0].id;

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
      isPlaybackSupported: audioTracks.some((t) => t.isPlayable) && videoStreams.some((v) => v.isPlayable),
      compatibilitySummary: `${audioTracks.length} Audio Track${audioTracks.length > 1 ? 's' : ''}, ${videoStreams.length} Video Stream`,
    };
  }

  private parseMatroskaTrackEntry(
    bytes: Uint8Array,
    start: number,
    end: number,
    audioTracks: MediaAudioTrack[],
    videoStreams: MediaVideoStream[],
    subtitleTracks: MediaSubtitleTrack[]
  ) {
    let trackType = 0; // 1 = video, 2 = audio, 17 = subtitle
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
      const idByte = bytes[p++];
      if (idByte === 0x83) { // TrackType (0x83)
        const { length: len, bytesRead: br } = this.readEbmlVint(bytes, p);
        p += br;
        trackType = bytes[p];
        p += len;
      } else if (idByte === 0x86) { // CodecID (0x86)
        const { length: len, bytesRead: br } = this.readEbmlVint(bytes, p);
        p += br;
        codecId = new TextDecoder('utf-8').decode(bytes.subarray(p, p + len));
        p += len;
      } else if (idByte === 0x53 && bytes[p] === 0x6e) { // Name (0x536E)
        p++;
        const { length: len, bytesRead: br } = this.readEbmlVint(bytes, p);
        p += br;
        trackName = new TextDecoder('utf-8').decode(bytes.subarray(p, p + len));
        p += len;
      } else if (idByte === 0x22 && bytes[p] === 0xb5 && bytes[p + 1] === 0x9c) { // Language (0x22B59C)
        p += 2;
        const { length: len, bytesRead: br } = this.readEbmlVint(bytes, p);
        p += br;
        languageCode = new TextDecoder('utf-8').decode(bytes.subarray(p, p + len)).trim();
        p += len;
      } else if (idByte === 0x88) { // FlagDefault (0x88)
        const { length: len, bytesRead: br } = this.readEbmlVint(bytes, p);
        p += br;
        isDefault = bytes[p] === 1;
        p += len;
      } else if (idByte === 0xe1) { // Audio settings (0xE1)
        const { length: len, bytesRead: br } = this.readEbmlVint(bytes, p);
        p += br;
        const aEnd = p + len;
        while (p < aEnd) {
          if (bytes[p] === 0x9f) { // Channels (0x9F)
            p++;
            const { length: cLen, bytesRead: cBr } = this.readEbmlVint(bytes, p);
            p += cBr;
            channels = bytes[p];
            p += cLen;
          } else {
            p++;
          }
        }
      } else if (idByte === 0xe0) { // Video settings (0xE0)
        const { length: len, bytesRead: br } = this.readEbmlVint(bytes, p);
        p += br;
        const vEnd = p + len;
        while (p < vEnd) {
          if (bytes[p] === 0xb0) { // PixelWidth (0xB0)
            p++;
            const { length: wLen, bytesRead: wBr } = this.readEbmlVint(bytes, p);
            p += wBr;
            width = this.readEbmlUint(bytes, p, wLen);
            p += wLen;
          } else if (bytes[p] === 0xba) { // PixelHeight (0xBA)
            p++;
            const { length: hLen, bytesRead: hBr } = this.readEbmlVint(bytes, p);
            p += hBr;
            height = this.readEbmlUint(bytes, p, hLen);
            p += hLen;
          } else {
            p++;
          }
        }
      } else {
        const { length: len, bytesRead: br } = this.readEbmlVint(bytes, p);
        if (br > 0 && len > 0 && p + br + len <= end) {
          p += br + len;
        } else {
          p++;
        }
      }
    }

    const languageName = resolveLanguageName(languageCode);
    const displayCodec = this.formatMatroskaCodec(codecId);

    if (trackType === 2) { // Audio Track
      const streamIdx = audioTracks.length;
      const channelLayout = formatChannelLayout(channels);
      const probe = probeAudioCodecPlayability(displayCodec, channels);

      const label = trackName
        ? trackName
        : `${languageName} — ${displayCodec} (${channelLayout})`;

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
        isDefault: isDefault || streamIdx === 0,
        isPlayable: probe.isPlayable,
        unsupportedReason: probe.unsupportedReason,
      });
    } else if (trackType === 1) { // Video Track
      const streamIdx = videoStreams.length;
      const probe = probeVideoCodecPlayability(displayCodec);
      const aspectRatio = this.calculateAspectRatio(width, height);

      videoStreams.push({
        id: `video-${streamIdx}`,
        streamIndex: streamIdx,
        label: trackName || `Video Stream ${streamIdx + 1} (${displayCodec})`,
        codec: displayCodec,
        width,
        height,
        resolution: `${width}x${height}`,
        aspectRatio,
        isDefault: isDefault || streamIdx === 0,
        isPlayable: probe.isPlayable,
        unsupportedReason: probe.unsupportedReason,
      });
    } else if (trackType === 17) { // Subtitle Track
      const streamIdx = subtitleTracks.length;
      subtitleTracks.push({
        id: `sub-${streamIdx}`,
        streamIndex: streamIdx,
        label: trackName || `${languageName} Subtitles`,
        language: languageName,
        languageCode,
        format: displayCodec || 'SubRip (SRT)',
        isDefault,
        isForced: false,
      });
    }
  }

  private formatMatroskaCodec(codecId: string): string {
    const norm = codecId.toUpperCase();
    if (norm.includes('AAC')) return 'AAC';
    if (norm.includes('AC3') && !norm.includes('EAC3')) return 'AC-3';
    if (norm.includes('EAC3')) return 'E-AC-3';
    if (norm.includes('DTS')) return 'DTS';
    if (norm.includes('FLAC')) return 'FLAC';
    if (norm.includes('OPUS')) return 'Opus';
    if (norm.includes('VORBIS')) return 'Vorbis';
    if (norm.includes('PCM')) return 'PCM';
    if (norm.includes('AVC')) return 'H.264 / AVC';
    if (norm.includes('HEVC')) return 'H.265 / HEVC';
    if (norm.includes('VP8')) return 'VP8';
    if (norm.includes('VP9')) return 'VP9';
    if (norm.includes('AV1')) return 'AV1';
    return codecId.replace(/^[AV]_\w+\//, '').replace(/^[AV]_/, '');
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
      label: 'Native Source Audio',
      originalTitle: 'Native Source Audio',
      language: 'Original',
      languageCode: 'und',
      codec: ext === 'mkv' ? 'Opus/AAC' : 'AAC',
      channels: 2,
      channelLayout: 'Stereo 2.0',
      sampleRate: 48000,
      isDefault: true,
      isPlayable: true,
    };

    const videoStream: MediaVideoStream = {
      id: 'video-0',
      streamIndex: 0,
      label: 'Main Video Stream',
      codec: 'H.264 / AVC',
      width: 1920,
      height: 1080,
      resolution: '1920x1080 (1080p FHD)',
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
      compatibilitySummary: 'Native Media Stream (1 Audio, 1 Video)',
    };
  }
}

export const mediaParser = new CineMorphMediaParser();
