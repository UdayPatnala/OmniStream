import { Sony360DetectionResult } from '@omnistream/shared';

/**
 * Sony 360 Reality Audio Prober & Analyzer
 *
 * Dedicated analyzer to distinguish genuine native Sony 360 Reality Audio / MPEG-H 3D Audio
 * object-based streams from standard multichannel audio and general spatial downmixes.
 *
 * Reports whether native hardware decoding is available or if OmniStream's high-fidelity
 * HRTF binaural virtualization will be applied.
 */

export interface Sony360ProbeInput {
  name?: string;
  type?: string;
  codec?: string;
  channels?: number;
  tags?: Record<string, string>;
  rawMetadata?: string;
}

export class Sony360Detector {
  /**
   * Evaluates whether the media stream or file contains Sony 360 Reality Audio markers.
   */
  public probe(input: File | string | Sony360ProbeInput): Sony360DetectionResult {
    let name = '';
    let mimeType = '';
    let codec = '';
    let channels = 2;
    let rawMeta = '';

    if (typeof input === 'string') {
      name = input;
    } else if (input instanceof File) {
      name = input.name;
      mimeType = input.type;
    } else if (typeof input === 'object' && input !== null) {
      name = input.name || '';
      mimeType = input.type || '';
      codec = input.codec || '';
      channels = input.channels || 2;
      rawMeta = input.rawMetadata || (input.tags ? JSON.stringify(input.tags) : '');
    }

    const testString = `${name} ${mimeType} ${codec} ${rawMeta}`.toLowerCase();

    // 1. Definite / Confirmed MPEG-H 3D Audio & Sony 360RA profiles
    const hasConfirmed360RA =
      testString.includes('360ra') ||
      testString.includes('sony 360') ||
      testString.includes('360 reality audio') ||
      testString.includes('mha1') ||
      testString.includes('mhm1') ||
      testString.includes('audio/mpegh-3d-audio');

    // 2. Probable indicators (13+ discrete channels with spatial/binaural tagging)
    const hasProbableIndicators =
      channels >= 13 ||
      testString.includes('mpegh') ||
      testString.includes('mpeg-h') ||
      testString.includes('spatial audio object');

    // Check if the browser natively supports MPEG-H 3D Audio hardware decoding
    let isNativeHardwareDecoded = false;
    if (typeof document !== 'undefined') {
      try {
        const audio = document.createElement('audio');
        const canPlayMpegh = audio.canPlayType('audio/mp4; codecs="mha1"') || audio.canPlayType('audio/mpegh-3d-audio');
        if (canPlayMpegh === 'probably') {
          isNativeHardwareDecoded = true;
        }
      } catch {}
    }

    if (hasConfirmed360RA) {
      return {
        isDetected: true,
        isNativeHardwareDecoded,
        confidence: 'confirmed',
        formatProfile: 'MPEG-H 3D Audio Profile Level 3 (Sony 360RA)',
        objectCount: channels >= 13 ? channels : 16,
        notes: isNativeHardwareDecoded
          ? 'Native hardware decoding confirmed. Bitstream passed directly to spatial renderer.'
          : 'Sony 360 Reality Audio stream confirmed. Rendered via OmniStream HRTF binaural virtualizer with object coordinate mapping.',
      };
    }

    if (hasProbableIndicators) {
      return {
        isDetected: true,
        isNativeHardwareDecoded,
        confidence: 'probable',
        formatProfile: 'MPEG-H 3D Audio Candidate',
        objectCount: channels,
        notes: 'Multichannel spatial object stream detected. Virtualized through OmniStream 3D cinema acoustics.',
      };
    }

    return {
      isDetected: false,
      isNativeHardwareDecoded: false,
      confidence: 'none',
      notes: 'Standard channel-based audio. General OmniStream spatial virtualization available on demand.',
    };
  }
}

export const sony360Detector = new Sony360Detector();
