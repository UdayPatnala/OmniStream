import { describe, it, expect } from 'vitest';
import {
  detectSubtitleFormat,
  parseWebVTT,
  parseSRT,
  parseASS,
  parseSubtitleFile,
  sanitizeCueText,
  extractSpeaker,
} from '@omnistream/cinemorph/media/subtitleParser';

describe('CineMorph Multi-Format Subtitle Parsers', () => {
  describe('Format Detection', () => {
    it('detects format by file extension', () => {
      expect(detectSubtitleFormat('', 'movie.vtt')).toBe('vtt');
      expect(detectSubtitleFormat('', 'movie.srt')).toBe('srt');
      expect(detectSubtitleFormat('', 'movie.ass')).toBe('ass');
      expect(detectSubtitleFormat('', 'movie.ssa')).toBe('ass');
    });

    it('detects format by stream header content', () => {
      expect(detectSubtitleFormat('WEBVTT - Header\n\n00:00:01.000 --> 00:00:03.000\nHello')).toBe('vtt');
      expect(detectSubtitleFormat('[Script Info]\nTitle: Sample\n[Events]\nDialogue: 0,0:00:01.00,0:00:03.00,Default,,0,0,0,,Hello')).toBe('ass');
      expect(detectSubtitleFormat('1\n00:00:01,000 --> 00:00:03,000\nHello')).toBe('srt');
    });

    it('returns unknown for unparseable content', () => {
      expect(detectSubtitleFormat('plain text without timestamps')).toBe('unknown');
    });
  });

  describe('Text Sanitization & Speaker Extraction', () => {
    it('strips HTML, WebVTT voice tags, and intra-cue timestamps', () => {
      const raw = '<v Narrator>Welcome to <b>OmniStream</b> at <00:01:23.456> <c.blue>Cinema</c>&amp;Co.';
      const clean = sanitizeCueText(raw);
      expect(clean).toBe('Welcome to OmniStream at Cinema&Co.');
      expect(clean).not.toContain('<');
      expect(clean).not.toContain('>');
    });

    it('extracts speaker from WebVTT <v Speaker> tag', () => {
      const raw = '<v Cooper>We used to look up at the stars.';
      const res = extractSpeaker(raw);
      expect(res.speaker).toBe('Cooper');
      expect(sanitizeCueText(res.textWithoutSpeaker)).toBe('We used to look up at the stars.');
    });

    it('extracts speaker from colon syntax prefix', () => {
      const raw = 'Paul Atreides: Lead them to paradise.';
      const res = extractSpeaker(raw);
      expect(res.speaker).toBe('Paul Atreides');
      expect(res.textWithoutSpeaker).toBe('Lead them to paradise.');
    });

    it('decodes HTML entities safely', () => {
      const raw = 'Romeo &amp; Juliet &quot;Love &amp; Honor&quot; &lt;3';
      expect(sanitizeCueText(raw)).toBe('Romeo & Juliet "Love & Honor" <3');
    });
  });

  describe('WebVTT Parser', () => {
    it('parses WebVTT content with headers, NOTE blocks, and cue settings', () => {
      const vtt = `WEBVTT - Director's Cut
NOTE This is a commentary block that must be ignored

1
00:00:02.000 --> 00:00:05.500 align:center size:80%
<v Brand>Mankind was born on Earth.
It was never meant to die here.

NOTE Another note

2
00:00:07.000 --> 00:00:10.000
[deep bass rumble swelling]
`;
      const cues = parseWebVTT(vtt);
      expect(cues.length).toBe(2);

      expect(cues[0].startTime).toBe(2.0);
      expect(cues[0].endTime).toBe(5.5);
      expect(cues[0].speaker).toBe('Brand');
      expect(cues[0].text).toBe('Mankind was born on Earth.\nIt was never meant to die here.');
      expect(cues[0].settings?.align).toBe('center');

      expect(cues[1].startTime).toBe(7.0);
      expect(cues[1].endTime).toBe(10.0);
      expect(cues[1].isSdh).toBe(true);
      expect(cues[1].text).toBe('[deep bass rumble swelling]');
    });
  });

  describe('SubRip (.srt) Parser', () => {
    it('parses SRT with numeric indices, comma timecodes, and multiple lines', () => {
      const srt = `1
00:01:05,250 --> 00:01:08,750
First dialogue line.
Second dialogue line.

2
00:01:10,000 --> 00:01:14,500
Third dialogue response.
`;
      const cues = parseSRT(srt);
      expect(cues.length).toBe(2);

      expect(cues[0].startTime).toBeCloseTo(65.25, 2);
      expect(cues[0].endTime).toBeCloseTo(68.75, 2);
      expect(cues[0].text).toBe('First dialogue line.\nSecond dialogue line.');

      expect(cues[1].startTime).toBe(70.0);
      expect(cues[1].endTime).toBe(74.5);
      expect(cues[1].text).toBe('Third dialogue response.');
    });
  });

  describe('ASS / SSA Parser', () => {
    it('parses ASS dialogue events, extracts speaker, and strips override tags', () => {
      const ass = `[Script Info]
Title: Anime Master
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,1,1,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:01:05.50,0:01:09.20,Default,Hero,0,0,0,,{\\b1}I will not yield!{\\b0}\\NThe journey continues.
Dialogue: 0,0:01:10.00,0:01:13.50,Default,Villain,0,0,0,,{\\c&H0000FF&}[dark thunder cracks]
`;
      const cues = parseASS(ass);
      expect(cues.length).toBe(2);

      expect(cues[0].startTime).toBeCloseTo(65.5, 2);
      expect(cues[0].endTime).toBeCloseTo(69.2, 2);
      expect(cues[0].speaker).toBe('Hero');
      expect(cues[0].text).toBe('I will not yield!\nThe journey continues.');

      expect(cues[1].startTime).toBe(70.0);
      expect(cues[1].endTime).toBe(73.5);
      expect(cues[1].speaker).toBe('Villain');
      expect(cues[1].isSdh).toBe(true);
      expect(cues[1].text).toBe('[dark thunder cracks]');
    });
  });

  describe('Fault Tolerance & Malformed Recovery', () => {
    it('skips malformed cues without dropping the rest of the file', () => {
      const mixed = `1
INVALID_TIMECODE --> 00:00:05.000
Corrupted line.

2
00:00:06.000 --> 00:00:09.000
Valid second line.
`;
      const cues = parseSubtitleFile(mixed, 'sample.srt');
      expect(cues.length).toBe(1);
      expect(cues[0].startTime).toBe(6.0);
      expect(cues[0].endTime).toBe(9.0);
      expect(cues[0].text).toBe('Valid second line.');
    });

    it('handles empty or blank content gracefully', () => {
      expect(parseSubtitleFile('')).toEqual([]);
      expect(parseSubtitleFile('   \n\n  ')).toEqual([]);
    });
  });

  describe('Internationalization & Script Detection', () => {
    it('accurately detects Right-to-Left (RTL) Arabic subtitles', () => {
      const vtt = `WEBVTT
1
00:00:01.000 --> 00:00:04.000
مرحباً بكم في سينما أومني ستريم
`;
      const cues = parseWebVTT(vtt);
      expect(cues.length).toBe(1);
      expect(cues[0].isRtl).toBe(true);
    });

    it('correctly handles Indic scripts (Telugu and Hindi) with Unicode characters', () => {
      const vtt = `WEBVTT
1
00:00:01.000 --> 00:00:04.000
సినిమా ప్రారంభం అవుతుంది (Telugu)

2
00:00:05.000 --> 00:00:08.000
सिनेमा शुरू हो रहा है (Hindi)
`;
      const cues = parseWebVTT(vtt);
      expect(cues.length).toBe(2);
      expect(cues[0].text).toBe('సినిమా ప్రారంభం అవుతుంది (Telugu)');
      expect(cues[1].text).toBe('सिनेमा शुरू हो रहा है (Hindi)');
      expect(cues[0].isRtl).toBe(false);
    });
  });
});
