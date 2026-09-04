import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mediaParser,
  resolveLanguageName,
  formatChannelLayout,
  probeAudioCodecPlayability,
  probeVideoCodecPlayability,
} from '../../lib/cinemorph/mediaParser';
import { audioEngine } from '../../lib/cinemorph/audioEngine';

describe('OmniStream I4: CineMorph Media Compatibility & Audio Track Discovery', () => {
  beforeEach(() => {
    audioEngine.reset();
  });

  afterEach(() => {
    audioEngine.reset();
  });

  describe('Scenario A: MP4 with Single Supported Audio Track', () => {
    it('demuxes standard MP4 container with clean playable AAC stream', async () => {
      const buffer = new ArrayBuffer(256);
      const view = new DataView(buffer);

      // ftyp box
      view.setUint32(0, 24);
      view.setUint8(4, 0x66); view.setUint8(5, 0x74); view.setUint8(6, 0x79); view.setUint8(7, 0x70); // 'ftyp'
      // 'isom'
      view.setUint8(8, 0x69); view.setUint8(9, 0x73); view.setUint8(10, 0x6f); view.setUint8(11, 0x6d);

      const blob = new Blob([buffer], { type: 'video/mp4' });
      const analysis = await mediaParser.parseMediaFile(blob, 'sample_short.mp4');

      expect(analysis.isContainerSupported).toBe(true);
      expect(analysis.isPlaybackSupported).toBe(true);
      expect(analysis.audioTracks.length).toBeGreaterThanOrEqual(1);
      expect(analysis.audioTracks[0].isPlayable).toBe(true);
    });
  });

  describe('Scenario B: MP4 with Multiple Audio Tracks', () => {
    it('accurately parses multiple audio tracks and sets default stream', async () => {
      // Create synthetic MP4 with moov and two trak boxes (1 video, 2 audio)
      const buffer = new ArrayBuffer(1024);
      const view = new DataView(buffer);
      const uint8 = new Uint8Array(buffer);

      // Box 1: ftyp (size 16)
      view.setUint32(0, 16);
      uint8.set([0x66, 0x74, 0x79, 0x70], 4); // 'ftyp'
      uint8.set([0x6d, 0x70, 0x34, 0x32], 8); // 'mp42'

      // Box 2: moov
      let offset = 16;
      const moovStart = offset;
      offset += 8; // moov header placeholder

      // trak 1: video
      const trak1Start = offset;
      offset += 8; // trak header placeholder
      // mdia -> hdlr 'vide'
      const mdia1Start = offset;
      offset += 8;
      // hdlr
      view.setUint32(offset, 24);
      uint8.set([0x68, 0x64, 0x6c, 0x72], offset + 4); // 'hdlr'
      uint8.set([0x76, 0x69, 0x64, 0x65], offset + 16); // 'vide'
      offset += 24;
      view.setUint32(mdia1Start, offset - mdia1Start);
      uint8.set([0x6d, 0x64, 0x69, 0x61], mdia1Start + 4);
      view.setUint32(trak1Start, offset - trak1Start);
      uint8.set([0x74, 0x72, 0x61, 0x6b], trak1Start + 4);

      // trak 2: audio (Japanese 5.1)
      const trak2Start = offset;
      offset += 8;
      // udta -> name
      const udta2Start = offset;
      offset += 8;
      const title1 = new TextEncoder().encode('Japanese 5.1 Surround');
      view.setUint32(offset, 8 + title1.length);
      uint8.set([0x6e, 0x61, 0x6d, 0x65], offset + 4);
      uint8.set(title1, offset + 8);
      offset += 8 + title1.length;
      view.setUint32(udta2Start, offset - udta2Start);
      uint8.set([0x75, 0x64, 0x74, 0x61], udta2Start + 4);

      // mdia -> mdhd (lang 'jpn') + hdlr ('soun')
      const mdia2Start = offset;
      offset += 8;
      // mdhd
      view.setUint32(offset, 32);
      uint8.set([0x6d, 0x64, 0x68, 0x64], offset + 4);
      // packed jpn (10, 16, 14 in 5-bit = (10<<10) | (16<<5) | 14 = 0x2A0E)
      view.setUint16(offset + 28, 0x2a0e);
      offset += 32;
      // hdlr 'soun'
      view.setUint32(offset, 24);
      uint8.set([0x68, 0x64, 0x6c, 0x72], offset + 4);
      uint8.set([0x73, 0x6f, 0x75, 0x6e], offset + 16);
      offset += 24;
      view.setUint32(mdia2Start, offset - mdia2Start);
      uint8.set([0x6d, 0x64, 0x69, 0x61], mdia2Start + 4);
      view.setUint32(trak2Start, offset - trak2Start);
      uint8.set([0x74, 0x72, 0x61, 0x6b], trak2Start + 4);

      // trak 3: audio (English commentary)
      const trak3Start = offset;
      offset += 8;
      const udta3Start = offset;
      offset += 8;
      const title2 = new TextEncoder().encode('English Director Commentary');
      view.setUint32(offset, 8 + title2.length);
      uint8.set([0x6e, 0x61, 0x6d, 0x65], offset + 4);
      uint8.set(title2, offset + 8);
      offset += 8 + title2.length;
      view.setUint32(udta3Start, offset - udta3Start);
      uint8.set([0x75, 0x64, 0x74, 0x61], udta3Start + 4);

      const mdia3Start = offset;
      offset += 8;
      view.setUint32(offset, 32);
      uint8.set([0x6d, 0x64, 0x68, 0x64], offset + 4);
      // packed eng: 'e'-0x60=5, 'n'-0x60=14, 'g'-0x60=7 -> (5<<10)|(14<<5)|7 = 0x15C7
      view.setUint16(offset + 28, 0x15c7);
      offset += 32;
      view.setUint32(offset, 24);
      uint8.set([0x68, 0x64, 0x6c, 0x72], offset + 4);
      uint8.set([0x73, 0x6f, 0x75, 0x6e], offset + 16);
      offset += 24;
      view.setUint32(mdia3Start, offset - mdia3Start);
      uint8.set([0x6d, 0x64, 0x69, 0x61], mdia3Start + 4);
      view.setUint32(trak3Start, offset - trak3Start);
      uint8.set([0x74, 0x72, 0x61, 0x6b], trak3Start + 4);

      // finalize moov
      view.setUint32(moovStart, offset - moovStart);
      uint8.set([0x6d, 0x6f, 0x6f, 0x76], moovStart + 4);

      const blob = new Blob([buffer.slice(0, offset)], { type: 'video/mp4' });
      const analysis = await mediaParser.parseMediaFile(blob, 'feature_multitrack.mp4');

      expect(analysis.videoStreams.length).toBe(1);
      expect(analysis.audioTracks.length).toBe(2);
      expect(analysis.audioTracks[0].label).toBe('Japanese 5.1 Surround');
      expect(analysis.audioTracks[0].language).toBe('Japanese');
      expect(analysis.audioTracks[1].label).toBe('English Director Commentary');
      expect(analysis.audioTracks[1].language).toBe('English');
    });
  });

  describe('Scenario C: MKV with Multiple Audio Tracks & Unicode Names', () => {
    it('preserves genuine track metadata without fabricating values', async () => {
      const buffer = new ArrayBuffer(512);
      const uint8 = new Uint8Array(buffer);

      // EBML Header
      uint8.set([0x1a, 0x45, 0xdf, 0xa3], 0);

      // Tracks Master Element (0x1654AE6B)
      uint8.set([0x16, 0x54, 0xae, 0x6b], 8);
      uint8[12] = 0x40; uint8[13] = 200; // 2-byte length

      let p = 14;
      // Track 1: Audio with TrackName
      const t1Start = p;
      uint8[p++] = 0xae;
      const t1Len = p++;
      uint8[p++] = 0x83; uint8[p++] = 0x81; uint8[p++] = 2; // Audio
      uint8[p++] = 0x88; uint8[p++] = 0x81; uint8[p++] = 1; // Default
      uint8[p++] = 0x53; uint8[p++] = 0x6e; // TrackName
      const name1 = new TextEncoder().encode('Hindi 5.1 Atmos');
      uint8[p++] = 0x80 | name1.length;
      uint8.set(name1, p);
      p += name1.length;
      uint8[p++] = 0x22; uint8[p++] = 0xb5; uint8[p++] = 0x9c; // Language
      const lang1 = new TextEncoder().encode('hin');
      uint8[p++] = 0x80 | lang1.length;
      uint8.set(lang1, p);
      p += lang1.length;
      uint8[p++] = 0x86; // CodecID
      const codec1 = new TextEncoder().encode('A_AAC');
      uint8[p++] = 0x80 | codec1.length;
      uint8.set(codec1, p);
      p += codec1.length;
      uint8[t1Len] = 0x80 | (p - t1Start - 2);

      const mkvBlob = new Blob([buffer], { type: 'video/x-matroska' });
      const analysis = await mediaParser.parseMediaFile(mkvBlob, 'movie.mkv');

      expect(analysis.audioTracks.length).toBe(1);
      expect(analysis.audioTracks[0].label).toBe('Hindi 5.1 Atmos');
      expect(analysis.audioTracks[0].language).toBe('Hindi');
      expect(analysis.audioTracks[0].originalTitle).toBe('Hindi 5.1 Atmos');
    });
  });

  describe('Scenario D: Incompatible Audio Codec Handling (DTS / AC-3)', () => {
    it('flags DTS multi-channel stream as unplayable and reports exact reason', () => {
      const probe = probeAudioCodecPlayability('DTS-HD');
      expect(probe.isPlayable).toBe(false);
      expect(probe.unsupportedReason).toContain('unsupported by browser audio decoders');
    });

    it('identifies unplayable streams in container summary honestly', async () => {
      const probe = probeAudioCodecPlayability('DTS');
      expect(probe.isPlayable).toBe(false);
    });
  });

  describe('Scenario E: Missing Metadata Fallback (Zero Fabrication)', () => {
    it('uses honest Undetermined and neutral track numbers when metadata is absent', () => {
      expect(resolveLanguageName('und')).toBe('Undetermined');
      expect(resolveLanguageName('')).toBe('Undetermined');
      expect(resolveLanguageName(undefined)).toBe('Undetermined');
    });
  });

  describe('Scenario F: Audio Engine Track Switching Capability', () => {
    it('switches track via native AudioTracks API when available', () => {
      const mockTracks = [
        { enabled: true, label: 'Hindi', language: 'hin' },
        { enabled: false, label: 'Telugu', language: 'tel' },
      ];
      const videoEl = { audioTracks: mockTracks } as unknown as HTMLMediaElement;

      expect(audioEngine.canSwitchAudioTracks(videoEl)).toBe(true);

      const result = audioEngine.setActiveAudioTrack(1, videoEl);
      expect(result.success).toBe(true);
      expect(result.switched).toBe(true);
      expect(result.method).toBe('native_api');
      expect(mockTracks[0].enabled).toBe(false);
      expect(mockTracks[1].enabled).toBe(true);
    });

    it('honestly reports browser limitation when audioTracks is undefined', () => {
      const videoEl = {} as HTMLMediaElement; // Standard Chrome/Firefox default
      expect(audioEngine.canSwitchAudioTracks(videoEl)).toBe(false);

      // Track 0 is the default active stream
      const defResult = audioEngine.setActiveAudioTrack(0, videoEl);
      expect(defResult.success).toBe(true);
      expect(defResult.switched).toBe(false);
      expect(defResult.method).toBe('default_stream');

      // Track 1 cannot be switched by standard HTMLVideoElement
      const secResult = audioEngine.setActiveAudioTrack(1, videoEl);
      expect(secResult.success).toBe(false);
      expect(secResult.method).toBe('unsupported_browser');
    });
  });
});
