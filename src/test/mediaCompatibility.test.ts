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
      expect(resolveLanguageName('und')).toBe('Original / Undetermined');
      expect(resolveLanguageName('')).toBe('Original Audio');
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
      expect(probe.unsupportedReason).toContain('licensed hardware decoder');
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
      const success = audioEngine.setActiveAudioTrack(1, mockVideoEl);

      expect(success).toBe(true);
      expect(mockAudioTracks[0].enabled).toBe(false);
      expect(mockAudioTracks[1].enabled).toBe(true);
      expect(audioEngine.getActiveAudioTrackIndex()).toBe(1);
    });

    it('safely handles media elements without native audioTracks API', () => {
      const mockVideoEl = {
        currentTime: 10,
        paused: true,
      } as unknown as HTMLMediaElement;

      const success = audioEngine.setActiveAudioTrack(0, mockVideoEl);
      expect(success).toBe(true);
      expect(audioEngine.getActiveAudioTrackIndex()).toBe(0);
    });
  });
});
