import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  mediaParser,
  resolveLanguageName,
  formatChannelLayout,
  probeAudioCodecPlayability,
  probeVideoCodecPlayability,
} from '../lib/cinemorph/mediaParser';
import { audioEngine } from '../lib/cinemorph/audioEngine';

describe('CineMorph Media Compatibility & Stream Demuxer', () => {
  describe('Language & Channel Helpers', () => {
    it('resolves ISO-639 codes to natural language names', () => {
      expect(resolveLanguageName('eng')).toBe('English');
      expect(resolveLanguageName('jpn')).toBe('Japanese');
      expect(resolveLanguageName('hin')).toBe('Hindi');
      expect(resolveLanguageName('tel')).toBe('Telugu');
      expect(resolveLanguageName('tam')).toBe('Tamil');
      expect(resolveLanguageName('spa')).toBe('Spanish');
      expect(resolveLanguageName('fra')).toBe('French');
      expect(resolveLanguageName('deu')).toBe('German');
      expect(resolveLanguageName('ita')).toBe('Italian');
      expect(resolveLanguageName('kor')).toBe('Korean');
      expect(resolveLanguageName('zho')).toBe('Chinese');
      expect(resolveLanguageName('und')).toBe('Undetermined');
      expect(resolveLanguageName('')).toBe('Undetermined');
    });

    it('formats channel counts into standard cinema surround sound layouts', () => {
      expect(formatChannelLayout(1)).toBe('Mono 1.0');
      expect(formatChannelLayout(2)).toBe('Stereo 2.0');
      expect(formatChannelLayout(3)).toBe('2.1 Surround');
      expect(formatChannelLayout(4)).toBe('4.0 Quad');
      expect(formatChannelLayout(6)).toBe('5.1 Surround');
      expect(formatChannelLayout(8)).toBe('7.1 Surround');
      expect(formatChannelLayout(0)).toBe('Stereo 2.0');
    });
  });

  describe('Audio & Video Codec Playability Probing', () => {
    it('verifies standard native audio codecs are marked playable', () => {
      expect(probeAudioCodecPlayability('AAC').isPlayable).toBe(true);
      expect(probeAudioCodecPlayability('MP3').isPlayable).toBe(true);
      expect(probeAudioCodecPlayability('Opus').isPlayable).toBe(true);
      expect(probeAudioCodecPlayability('Vorbis').isPlayable).toBe(true);
      expect(probeAudioCodecPlayability('FLAC').isPlayable).toBe(true);
      expect(probeAudioCodecPlayability('ALAC').isPlayable).toBe(true);
      expect(probeAudioCodecPlayability('PCM').isPlayable).toBe(true);
    });

    it('flags unsupported proprietary DTS formats with clear guidance', () => {
      const probe = probeAudioCodecPlayability('DTS-HD MA');
      expect(probe.isPlayable).toBe(false);
      expect(probe.unsupportedReason).toContain('unsupported by browser audio decoders');
    });

    it('verifies video codec support for H.264, VP9, AV1', () => {
      expect(probeVideoCodecPlayability('H.264 / AVC').isPlayable).toBe(true);
      expect(probeVideoCodecPlayability('VP9').isPlayable).toBe(true);
      expect(probeVideoCodecPlayability('AV1').isPlayable).toBe(true);
    });
  });

  describe('Direct Audio File Parsing', () => {
    it('parses direct FLAC files correctly', async () => {
      const mockBlob = new Blob([new Uint8Array(1024)], { type: 'audio/flac' });
      const result = await mediaParser.parseMediaFile(mockBlob, 'symphony_master.flac');

      expect(result.containerFormat).toBe('Audio Stream (FLAC)');
      expect(result.audioTracks.length).toBe(1);
      expect(result.audioTracks[0].codec).toBe('FLAC');
      expect(result.audioTracks[0].label).toContain('symphony_master');
      expect(result.audioTracks[0].isPlayable).toBe(true);
    });

    it('parses direct MP3 and WAV files', async () => {
      const mp3Blob = new Blob([new Uint8Array(512)], { type: 'audio/mp3' });
      const mp3Res = await mediaParser.parseMediaFile(mp3Blob, 'soundtrack.mp3');
      expect(mp3Res.audioTracks[0].codec).toBe('MP3');
      expect(mp3Res.audioTracks[0].isPlayable).toBe(true);

      const wavBlob = new Blob([new Uint8Array(512)], { type: 'audio/wav' });
      const wavRes = await mediaParser.parseMediaFile(wavBlob, 'atmos_mix.wav');
      expect(wavRes.audioTracks[0].codec).toBe('WAV');
      expect(wavRes.audioTracks[0].isPlayable).toBe(true);
    });
  });

  describe('Synthetic EBML Matroska (MKV) Demuxing', () => {
    it('demuxes MKV stream with multiple audio tracks and Unicode track titles', async () => {
      // Construct a valid minimal EBML Matroska buffer containing Tracks and TrackEntries
      const buffer = new ArrayBuffer(512);
      const uint8 = new Uint8Array(buffer);
      const view = new DataView(buffer);

      // EBML Header (0x1A45DFA3)
      uint8[0] = 0x1a; uint8[1] = 0x45; uint8[2] = 0xdf; uint8[3] = 0xa3;

      // Tracks Master Element (0x1654AE6B) at offset 8
      uint8[8] = 0x16; uint8[9] = 0x54; uint8[10] = 0xae; uint8[11] = 0x6b;
      uint8[12] = 0x40; uint8[13] = 200; // 2-byte EBML vint length = 200 bytes

      // TrackEntry 1 (Video) at offset 14 (0xAE)
      let p = 14;
      const track1Start = p;
      uint8[p++] = 0xae;
      const track1LenPos = p++;
      // TrackType = 1 (Video)
      uint8[p++] = 0x83; uint8[p++] = 0x81; uint8[p++] = 1;
      // CodecID = "V_MPEG4/ISO/AVC"
      uint8[p++] = 0x86;
      const avcCodec = new TextEncoder().encode('V_MPEG4/ISO/AVC');
      uint8[p++] = 0x80 | avcCodec.length;
      uint8.set(avcCodec, p);
      p += avcCodec.length;
      // Video Settings (0xE0)
      uint8[p++] = 0xe0; uint8[p++] = 0x80 | 8;
      // PixelWidth = 1920 (0xB0)
      uint8[p++] = 0xb0; uint8[p++] = 0x82; uint8[p++] = 0x07; uint8[p++] = 0x80;
      // PixelHeight = 1080 (0xBA)
      uint8[p++] = 0xba; uint8[p++] = 0x82; uint8[p++] = 0x04; uint8[p++] = 0x38;
      uint8[track1LenPos] = 0x80 | (p - track1Start - 2);

      // TrackEntry 2 (Audio Track 1: Original Japanese Mix)
      const track2Start = p;
      uint8[p++] = 0xae;
      const track2LenPos = p++;
      // TrackType = 2 (Audio)
      uint8[p++] = 0x83; uint8[p++] = 0x81; uint8[p++] = 2;
      // FlagDefault = 1 (0x88)
      uint8[p++] = 0x88; uint8[p++] = 0x81; uint8[p++] = 1;
      // Name = "Original Japanese 5.1 Mix" (0x536E)
      uint8[p++] = 0x53; uint8[p++] = 0x6e;
      const name1 = new TextEncoder().encode('Original Japanese 5.1 Mix');
      uint8[p++] = 0x80 | name1.length;
      uint8.set(name1, p);
      p += name1.length;
      // Language = "jpn" (0x22B59C)
      uint8[p++] = 0x22; uint8[p++] = 0xb5; uint8[p++] = 0x9c;
      const lang1 = new TextEncoder().encode('jpn');
      uint8[p++] = 0x80 | lang1.length;
      uint8.set(lang1, p);
      p += lang1.length;
      // CodecID = "A_AAC" (0x86)
      uint8[p++] = 0x86;
      const aacCodec = new TextEncoder().encode('A_AAC');
      uint8[p++] = 0x80 | aacCodec.length;
      uint8.set(aacCodec, p);
      p += aacCodec.length;
      // Audio Settings (0xE1): Channels = 6 (0x9F)
      uint8[p++] = 0xe1; uint8[p++] = 0x80 | 3;
      uint8[p++] = 0x9f; uint8[p++] = 0x81; uint8[p++] = 6;
      uint8[track2LenPos] = 0x80 | (p - track2Start - 2);

      // TrackEntry 3 (Audio Track 2: Director Commentary)
      const track3Start = p;
      uint8[p++] = 0xae;
      const track3LenPos = p++;
      // TrackType = 2 (Audio)
      uint8[p++] = 0x83; uint8[p++] = 0x81; uint8[p++] = 2;
      // Name = "Director Commentary"
      uint8[p++] = 0x53; uint8[p++] = 0x6e;
      const name2 = new TextEncoder().encode('Director Commentary');
      uint8[p++] = 0x80 | name2.length;
      uint8.set(name2, p);
      p += name2.length;
      // Language = "eng"
      uint8[p++] = 0x22; uint8[p++] = 0xb5; uint8[p++] = 0x9c;
      const lang2 = new TextEncoder().encode('eng');
      uint8[p++] = 0x80 | lang2.length;
      uint8.set(lang2, p);
      p += lang2.length;
      // CodecID = "A_OPUS"
      uint8[p++] = 0x86;
      const opusCodec = new TextEncoder().encode('A_OPUS');
      uint8[p++] = 0x80 | opusCodec.length;
      uint8.set(opusCodec, p);
      p += opusCodec.length;
      uint8[track3LenPos] = 0x80 | (p - track3Start - 2);

      const mkvBlob = new Blob([buffer], { type: 'video/x-matroska' });
      const analysis = await mediaParser.parseMediaFile(mkvBlob, 'feature_film.mkv');

      expect(analysis.containerFormat).toBe('Matroska / WebM (EBML)');
      expect(analysis.videoStreams.length).toBe(1);
      expect(analysis.videoStreams[0].width).toBe(1920);
      expect(analysis.videoStreams[0].height).toBe(1080);
      expect(analysis.videoStreams[0].aspectRatio).toBe('16:9');

      // Verify 2 audio tracks detected with original embedded titles preserved!
      expect(analysis.audioTracks.length).toBe(2);
      expect(analysis.audioTracks[0].label).toBe('Original Japanese 5.1 Mix');
      expect(analysis.audioTracks[0].language).toBe('Japanese');
      expect(analysis.audioTracks[0].channelLayout).toBe('5.1 Surround');
      expect(analysis.audioTracks[0].isDefault).toBe(true);

      expect(analysis.audioTracks[1].label).toBe('Director Commentary');
      expect(analysis.audioTracks[1].language).toBe('English');
      expect(analysis.audioTracks[1].codec).toBe('Opus');
    });
  });

  describe('Audio Engine Stream Switching', () => {
    beforeEach(() => {
      audioEngine.reset();
    });

    afterEach(() => {
      audioEngine.reset();
    });

    it('switches hardware audio tracks when supported by HTMLMediaElement', () => {
      const mockAudioTracks = [
        { enabled: true, label: 'Japanese 5.1', language: 'jpn' },
        { enabled: false, label: 'English Stereo', language: 'eng' },
      ];

      const mockVideoEl = {
        audioTracks: mockAudioTracks,
        currentTime: 42.5,
        paused: false,
      } as unknown as HTMLMediaElement;

      // Switch to track 1 (English)
      const result = audioEngine.setActiveAudioTrack(1, mockVideoEl);

      expect(result.success).toBe(true);
      expect(result.switched).toBe(true);
      expect(result.method).toBe('native_api');
      expect(mockAudioTracks[0].enabled).toBe(false);
      expect(mockAudioTracks[1].enabled).toBe(true);
      expect(audioEngine.getActiveAudioTrackIndex()).toBe(1);
    });

    it('safely handles media elements without native audioTracks API', () => {
      const mockVideoEl = {
        currentTime: 10,
        paused: true,
      } as unknown as HTMLMediaElement;

      const result = audioEngine.setActiveAudioTrack(0, mockVideoEl);
      expect(result.success).toBe(true);
      expect(result.method).toBe('default_stream');
      expect(audioEngine.getActiveAudioTrackIndex()).toBe(0);

      // Attempting to switch to secondary track on browser without audioTracks API
      const unsuppResult = audioEngine.setActiveAudioTrack(1, mockVideoEl);
      expect(unsuppResult.success).toBe(false);
      expect(unsuppResult.method).toBe('unsupported_browser');
    });

    it('proactively identifies unsupported primary streams (e.g. DTS) to explain silence', () => {
      const dtsProbe = audioEngine.probeStreamPlayability('DTS');
      expect(dtsProbe.isPlayable).toBe(false);
      expect(dtsProbe.reason).toContain('unsupported by browser audio decoders');

      const aacProbe = audioEngine.probeStreamPlayability('AAC');
      expect(aacProbe.isPlayable).toBe(true);
    });
  });

  describe('Forensic Bug Verification: EBML Multi-Byte IDs & MP4 STSD Offsets', () => {
    it('accurately parses MKV tracks even when multi-byte EBML IDs (TrackUID, FlagForced) are present', async () => {
      const buffer = new ArrayBuffer(512);
      const uint8 = new Uint8Array(buffer);

      // EBML Header
      uint8.set([0x1a, 0x45, 0xdf, 0xa3], 0);

      // Tracks Master Element (0x1654AE6B)
      uint8.set([0x16, 0x54, 0xae, 0x6b], 8);
      uint8[12] = 0x40; uint8[13] = 200; // length 200

      let p = 14;
      const t1Start = p;
      uint8[p++] = 0xae;
      const t1Len = p++;

      // TrackNumber (0xD7, 1 byte)
      uint8[p++] = 0xd7; uint8[p++] = 0x81; uint8[p++] = 1;

      // TrackUID (0x73C5, 2 bytes) - was previously causing desync!
      uint8[p++] = 0x73; uint8[p++] = 0xc5; uint8[p++] = 0x84;
      uint8[p++] = 0x00; uint8[p++] = 0x00; uint8[p++] = 0x12; uint8[p++] = 0x34;

      // TrackType (0x83, 1 byte): 2 = Audio
      uint8[p++] = 0x83; uint8[p++] = 0x81; uint8[p++] = 2;

      // TrackName (0x536E, 2 bytes): "Master 5.1"
      uint8[p++] = 0x53; uint8[p++] = 0x6e;
      const name = new TextEncoder().encode('Master 5.1');
      uint8[p++] = 0x80 | name.length;
      uint8.set(name, p);
      p += name.length;

      // CodecID (0x86, 1 byte): "A_AAC"
      uint8[p++] = 0x86;
      const codec = new TextEncoder().encode('A_AAC');
      uint8[p++] = 0x80 | codec.length;
      uint8.set(codec, p);
      p += codec.length;

      // Audio Settings (0xE1) with SamplingFrequency float32 (0xB5)
      uint8[p++] = 0xe1; uint8[p++] = 0x80 | 12;
      uint8[p++] = 0x9f; uint8[p++] = 0x81; uint8[p++] = 6; // Channels = 6
      uint8[p++] = 0xb5; uint8[p++] = 0x84; // SamplingFrequency (4-byte float = 48000.0 -> 0x473B8000)
      const fView = new DataView(buffer, p, 4);
      fView.setFloat32(0, 48000.0);
      p += 4;

      uint8[t1Len] = 0x80 | (p - t1Start - 2);

      const mkvBlob = new Blob([buffer], { type: 'video/x-matroska' });
      const analysis = await mediaParser.parseMediaFile(mkvBlob, 'feature.mkv');

      expect(analysis.audioTracks.length).toBe(1);
      expect(analysis.audioTracks[0].label).toBe('Master 5.1');
      expect(analysis.audioTracks[0].codec).toBe('AAC');
      expect(analysis.audioTracks[0].channels).toBe(6);
      expect(analysis.audioTracks[0].channelLayout).toBe('5.1 Surround');
      expect(analysis.audioTracks[0].sampleRate).toBe(48000);
    });

    it('accurately parses MP4 stsd sample description box with correct codec, channels, and sample rate', async () => {
      const buffer = new ArrayBuffer(1024);
      const view = new DataView(buffer);
      const uint8 = new Uint8Array(buffer);

      // ftyp
      view.setUint32(0, 16);
      uint8.set([0x66, 0x74, 0x79, 0x70], 4);
      uint8.set([0x69, 0x73, 0x6f, 0x6d], 8);

      let offset = 16;
      const moovStart = offset; offset += 8;
      const trakStart = offset; offset += 8;
      const mdiaStart = offset; offset += 8;

      // mdhd (Japanese)
      view.setUint32(offset, 32);
      uint8.set([0x6d, 0x64, 0x68, 0x64], offset + 4);
      view.setUint16(offset + 28, 0x2a0e); // jpn
      offset += 32;

      // hdlr 'soun'
      view.setUint32(offset, 24);
      uint8.set([0x68, 0x64, 0x6c, 0x72], offset + 4);
      uint8.set([0x73, 0x6f, 0x75, 0x6e], offset + 16);
      offset += 24;

      // minf -> stbl -> stsd
      const minfStart = offset; offset += 8;
      const stblStart = offset; offset += 8;

      const stsdStart = offset;
      view.setUint32(offset + 4, 0x73747364); // 'stsd'
      view.setUint8(offset + 8, 0);
      view.setUint32(offset + 12, 1);
      offset += 16;

      const entryStart = offset;
      uint8.set([0x6d, 0x70, 0x34, 0x61], offset + 4); // 'mp4a'
      view.setUint16(offset + 24, 6); // channels = 6
      view.setUint16(offset + 32, 48000); // sampleRate = 48000
      const entrySize = 36;
      view.setUint32(entryStart, entrySize);
      offset += entrySize;

      view.setUint32(stsdStart, offset - stsdStart);
      view.setUint32(stblStart, offset - stblStart);
      uint8.set([0x73, 0x74, 0x62, 0x6c], stblStart + 4);
      view.setUint32(minfStart, offset - minfStart);
      uint8.set([0x6d, 0x69, 0x6e, 0x66], minfStart + 4);
      view.setUint32(mdiaStart, offset - mdiaStart);
      uint8.set([0x6d, 0x64, 0x69, 0x61], mdiaStart + 4);
      view.setUint32(trakStart, offset - trakStart);
      uint8.set([0x74, 0x72, 0x61, 0x6b], trakStart + 4);
      view.setUint32(moovStart, offset - moovStart);
      uint8.set([0x6d, 0x6f, 0x6f, 0x76], moovStart + 4);

      const mp4Blob = new Blob([buffer.slice(0, offset)], { type: 'video/mp4' });
      const res = await mediaParser.parseMediaFile(mp4Blob, 'japanese_cinema.mp4');

      expect(res.audioTracks.length).toBe(1);
      expect(res.audioTracks[0].codec).toBe('AAC');
      expect(res.audioTracks[0].channels).toBe(6);
      expect(res.audioTracks[0].channelLayout).toBe('5.1 Surround');
      expect(res.audioTracks[0].sampleRate).toBe(48000);
      expect(res.audioTracks[0].language).toBe('Japanese');
    });

    it('correctly maps MKV subtitle formats (SRT, ASS)', async () => {
      const buffer = new ArrayBuffer(512);
      const uint8 = new Uint8Array(buffer);

      uint8.set([0x1a, 0x45, 0xdf, 0xa3], 0);
      uint8.set([0x16, 0x54, 0xae, 0x6b], 8);
      uint8[12] = 0x40; uint8[13] = 120;

      let p = 14;
      const t1Start = p;
      uint8[p++] = 0xae;
      const t1Len = p++;

      // TrackType = 17 (Subtitle)
      uint8[p++] = 0x83; uint8[p++] = 0x81; uint8[p++] = 17;
      // CodecID = "S_TEXT/UTF8"
      uint8[p++] = 0x86;
      const srtCodec = new TextEncoder().encode('S_TEXT/UTF8');
      uint8[p++] = 0x80 | srtCodec.length;
      uint8.set(srtCodec, p);
      p += srtCodec.length;

      uint8[t1Len] = 0x80 | (p - t1Start - 2);

      const mkvBlob = new Blob([buffer], { type: 'video/x-matroska' });
      const analysis = await mediaParser.parseMediaFile(mkvBlob, 'subtitled.mkv');

      expect(analysis.subtitleTracks.length).toBe(1);
      expect(analysis.subtitleTracks[0].format).toBe('SubRip (SRT)');
    });
  });

  describe('Audio Engine Tracks & MediaElementSourceNode Lifecycle', () => {
    it('safely attaches to the same media element multiple times without re-creating nodes or throwing', () => {
      const mockElement = document.createElement('video');
      
      // Initialize with element
      const init1 = audioEngine.init(mockElement);
      expect(init1).toBe(true);

      // Re-initialize with same element
      const init2 = audioEngine.init(mockElement);
      expect(init2).toBe(true);
    });

    it('handles reset gracefully without destroying media element routing', () => {
      const mockElement = document.createElement('video');
      audioEngine.init(mockElement);
      
      expect(() => {
        audioEngine.reset();
      }).not.toThrow();

      // Should re-attach cleanly
      expect(() => {
        audioEngine.init(mockElement);
      }).not.toThrow();
    });
  });
});
