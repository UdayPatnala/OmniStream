import { AudioEQConfig, AudioPreset } from '../types';
import { AudioIntelligenceService } from './audioIntelligence';

/**
 * CineMorph AI - Web Audio DSP Neural Audio Engine
 * Real-time Web Audio API node management for EQ, Surround 3D, and DRC.
 */

export interface AudioTrackSwitchResult {
  success: boolean;
  switched: boolean;
  activeTrackIndex: number;
  message: string;
  method: 'native_api' | 'default_stream' | 'unsupported_browser';
}

/**
 * CineMorph AI - Web Audio DSP Neural Audio Engine
 * Real-time Web Audio API node management for EQ, Surround 3D, and DRC.
 */
export class CineMorphAudioEngine {
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private lowMidFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private highMidFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private isInitialized = false;
  private activeTrackIndex = 0;
  private audioIntelligence = new AudioIntelligenceService();
  private attachedElement: HTMLMediaElement | null = null;
  private sourceNodeCache = new WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>();

  public init(mediaElement?: HTMLMediaElement | null): boolean {
    try {
      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtxClass) return false;

        this.audioCtx = new AudioCtxClass();
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 64;

        // Build 5-band parametric equalizer
        if (typeof this.audioCtx.createBiquadFilter === 'function') {
          try {
            this.bassFilter = this.audioCtx.createBiquadFilter();
            this.bassFilter.type = 'lowshelf';
            this.bassFilter.frequency.value = 100;
            this.bassFilter.gain.value = 0;

            this.lowMidFilter = this.audioCtx.createBiquadFilter();
            this.lowMidFilter.type = 'peaking';
            this.lowMidFilter.frequency.value = 350;
            if (this.lowMidFilter.Q) this.lowMidFilter.Q.value = 1.0;
            this.lowMidFilter.gain.value = 0;

            this.midFilter = this.audioCtx.createBiquadFilter();
            this.midFilter.type = 'peaking';
            this.midFilter.frequency.value = 2200;
            if (this.midFilter.Q) this.midFilter.Q.value = 1.2;
            this.midFilter.gain.value = 0;

            this.highMidFilter = this.audioCtx.createBiquadFilter();
            this.highMidFilter.type = 'peaking';
            this.highMidFilter.frequency.value = 4500;
            if (this.highMidFilter.Q) this.highMidFilter.Q.value = 1.0;
            this.highMidFilter.gain.value = 0;

            this.trebleFilter = this.audioCtx.createBiquadFilter();
            this.trebleFilter.type = 'highshelf';
            this.trebleFilter.frequency.value = 10000;
            this.trebleFilter.gain.value = 0;
          } catch (filterErr) {
            console.warn('[CineMorphAudioEngine] Filter creation notice:', filterErr);
          }
        }

        // Build dynamic range compressor
        if (typeof this.audioCtx.createDynamicsCompressor === 'function') {
          try {
            this.compressor = this.audioCtx.createDynamicsCompressor();
            this.compressor.threshold.value = -18;
            this.compressor.knee.value = 12;
            this.compressor.ratio.value = 3;
            this.compressor.attack.value = 0.003;
            this.compressor.release.value = 0.25;
          } catch (compErr) {
            console.warn('[CineMorphAudioEngine] Compressor creation notice:', compErr);
          }
        }

        this.isInitialized = true;
      }

      if (mediaElement && mediaElement !== this.attachedElement) {
        if (this.sourceNode) {
          try {
            this.sourceNode.disconnect();
          } catch {}
        }
        try {
          this.sourceNode = this.audioCtx.createMediaElementSource(mediaElement);
          this.attachedElement = mediaElement;
          this.connectPipeline();
        } catch (sourceErr) {
          // In Chromium/WebKit, calling createMediaElementSource twice or with incompatible node throws InvalidStateError.
          console.warn('[CineMorphAudioEngine] Media element source connection notice:', sourceErr);
          return false;
        }
      }

      return true;
    } catch (e) {
      console.warn('CineMorph Audio Engine initialization warning:', e);
      return false;
    }
  }

  public attachMediaElement(mediaElement: HTMLMediaElement | null): boolean {
    return this.init(mediaElement);
  }

  private connectPipeline() {
    if (!this.audioCtx || !this.sourceNode) return;
    try {
      this.sourceNode.disconnect();
      
      let lastNode: AudioNode = this.sourceNode;

      const safeConnect = (node: any) => {
        if (node && typeof node.connect === 'function' && typeof lastNode.connect === 'function') {
          try {
            lastNode.connect(node);
            lastNode = node;
          } catch {}
        }
      };

      // 5-band EQ chain
      safeConnect(this.bassFilter);
      safeConnect(this.lowMidFilter);
      safeConnect(this.midFilter);
      safeConnect(this.highMidFilter);
      safeConnect(this.trebleFilter);

      // Dynamic Range Compressor
      safeConnect(this.compressor);

      // Analyser Node
      if (this.analyser) {
        safeConnect(this.analyser);
      }

      if (typeof lastNode.connect === 'function') {
        lastNode.connect(this.audioCtx.destination);
      }
    } catch (err) {
      try {
        if (this.sourceNode && typeof this.sourceNode.connect === 'function') {
          this.sourceNode.connect(this.audioCtx.destination);
        }
      } catch (e) {}
    }
  }

  private setAudioParam(param: any, targetValue: number, timeConstant = 0.05) {
    if (!param) return;
    try {
      if (typeof param.setTargetAtTime === 'function' && this.audioCtx) {
        param.setTargetAtTime(targetValue, this.audioCtx.currentTime, timeConstant);
      } else {
        param.value = targetValue;
      }
    } catch {
      try {
        param.value = targetValue;
      } catch {}
    }
  }

  /**
   * Applies 5-band EQ and dynamic range parameters to Web Audio DSP chain
   */
  public applyConfig(config?: AudioEQConfig): void {
    try {
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      const bassBoost = Number.isFinite(config?.bassBoost) ? config!.bassBoost : 0;
      const dialogueClarity = Number.isFinite(config?.dialogueClarity) ? config!.dialogueClarity : 0;
      const trebleShine = Number.isFinite(config?.trebleShine) ? config!.trebleShine : 0;

      // 1. Bass shelf (100Hz)
      if (this.bassFilter) {
        this.setAudioParam(this.bassFilter.gain, bassBoost);
      }

      // 2. Low-mid (350Hz) - reduce muddiness when dialogue clarity is boosted
      if (this.lowMidFilter) {
        const lowMidCut = config?.preset === 'dialogue-boost' ? -2.5 : 0;
        this.setAudioParam(this.lowMidFilter.gain, lowMidCut);
      }

      // 3. Speech clarity band (2.2kHz)
      if (this.midFilter) {
        this.setAudioParam(this.midFilter.gain, dialogueClarity);
      }

      // 4. High-mid presence band (4.5kHz)
      if (this.highMidFilter) {
        this.setAudioParam(this.highMidFilter.gain, dialogueClarity * 0.4);
      }

      // 5. Treble shine shelf (10kHz)
      if (this.trebleFilter) {
        this.setAudioParam(this.trebleFilter.gain, trebleShine);
      }

      // 6. Dynamic Range Compressor
      if (this.compressor) {
        if (config?.drcLoudness || config?.preset === 'night-compression') {
          this.setAudioParam(this.compressor.threshold, -24);
          this.setAudioParam(this.compressor.ratio, 6);
        } else if (config?.preset === 'dialogue-boost') {
          this.setAudioParam(this.compressor.threshold, -20);
          this.setAudioParam(this.compressor.ratio, 3.5);
        } else {
          this.setAudioParam(this.compressor.threshold, -6);
          this.setAudioParam(this.compressor.ratio, 1.2);
        }
      }
    } catch (err) {
      console.warn('[CineMorphAudioEngine] Error applying audio DSP config:', err);
    }
  }

  public getPresetConfig(preset?: AudioPreset | null): AudioEQConfig {
    switch (preset) {
      case 'dialogue-boost':
        return {
          preset: 'dialogue-boost',
          bassBoost: -1.5,
          dialogueClarity: 5.0,
          trebleShine: 1.5,
          surround3D: false,
          drcLoudness: true,
        };
      case 'bass-heavy':
        return {
          preset: 'bass-heavy',
          bassBoost: 6.0,
          dialogueClarity: 0,
          trebleShine: 1.0,
          surround3D: false,
          drcLoudness: false,
        };
      case 'spatial-3d':
        return {
          preset: 'spatial-3d',
          bassBoost: 2.0,
          dialogueClarity: 1.5,
          trebleShine: 3.5,
          surround3D: true,
          drcLoudness: false,
        };
      case 'night-compression':
        return {
          preset: 'night-compression',
          bassBoost: -3.0,
          dialogueClarity: 3.0,
          trebleShine: -1.0,
          surround3D: false,
          drcLoudness: true,
        };
      case 'original':
      default:
        return {
          preset: 'original',
          bassBoost: 0,
          dialogueClarity: 0,
          trebleShine: 0,
          surround3D: false,
          drcLoudness: false,
        };
    }
  }

  public getSpectrumData(): Uint8Array {
    if (!this.analyser || typeof this.analyser.getByteFrequencyData !== 'function') {
      return new Uint8Array(16).fill(128);
    }
    try {
      const binCount = this.analyser.frequencyBinCount || 16;
      const data = new Uint8Array(binCount);
      this.analyser.getByteFrequencyData(data);
      return data;
    } catch {
      return new Uint8Array(16).fill(128);
    }
  }

  public canSwitchAudioTracks(mediaElement?: HTMLMediaElement | null): boolean {
    if (!mediaElement) return false;
    const tracks = (mediaElement as any).audioTracks;
    return Boolean(tracks && typeof tracks.length === 'number' && tracks.length > 1);
  }

  /**
   * Switches active hardware audio track if supported by browser/mediaElement.
   * Honestly reports when browser engine does not support switching secondary tracks.
   */
  public setActiveAudioTrack(trackIndex: number, mediaElement?: HTMLMediaElement | null): AudioTrackSwitchResult {
    if (!mediaElement) {
      this.activeTrackIndex = trackIndex;
      return {
        success: true,
        switched: false,
        activeTrackIndex: trackIndex,
        message: 'Audio track recorded',
        method: 'default_stream',
      };
    }

    try {
      // 1. Check for standard HTMLMediaElement.audioTracks (Safari / experimental Chrome)
      const tracks = (mediaElement as any).audioTracks;
      if (tracks && typeof tracks.length === 'number' && tracks.length > 0) {
        let matched = false;
        for (let i = 0; i < tracks.length; i++) {
          if (i === trackIndex) {
            tracks[i].enabled = true;
            matched = true;
          } else {
            tracks[i].enabled = false;
          }
        }
        if (matched) {
          this.activeTrackIndex = trackIndex;
          if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume().catch(() => {});
          }
          return {
            success: true,
            switched: true,
            activeTrackIndex: trackIndex,
            message: `Switched to audio track #${trackIndex + 1}`,
            method: 'native_api',
          };
        }
      }

      // 2. If track 0 is requested, it is the native default stream in standard HTML5 video
      if (trackIndex === 0) {
        this.activeTrackIndex = 0;
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }
        return {
          success: true,
          switched: false,
          activeTrackIndex: 0,
          message: 'Default audio stream active',
          method: 'default_stream',
        };
      }

      // 3. If track > 0 is requested on a browser without audioTracks API support
      return {
        success: false,
        switched: false,
        activeTrackIndex: this.activeTrackIndex,
        message: 'Multi-track audio switching is not supported by your browser engine. Default primary stream remains active.',
        method: 'unsupported_browser',
      };
    } catch (err) {
      console.warn('[CineMorphAudioEngine] Error switching audio track:', err);
      return {
        success: false,
        switched: false,
        activeTrackIndex: this.activeTrackIndex,
        message: 'Failed to switch audio stream',
        method: 'unsupported_browser',
      };
    }
  }

  public getActiveAudioTrackIndex(): number {
    return this.activeTrackIndex;
  }

  /**
   * Probes whether the primary audio stream can be decoded by the browser.
   * If not, explains why the video may play in silence (Problem B).
   */
  public probeStreamPlayability(codec?: string): { isPlayable: boolean; reason?: string } {
    if (!codec) return { isPlayable: true };
    const norm = codec.toUpperCase();
    if (norm.includes('DTS') || norm.includes('TRUEHD')) {
      return {
        isPlayable: false,
        reason: `${codec} audio is unsupported by browser audio decoders. Video may play silently.`,
      };
    }
    if (norm.includes('AC-3') || norm.includes('AC3') || norm.includes('E-AC-3') || norm.includes('EAC3')) {
      if (typeof document !== 'undefined') {
        const audioEl = document.createElement('audio');
        const canAC3 = audioEl.canPlayType('audio/mp4; codecs="ac-3"') || audioEl.canPlayType('audio/mp4; codecs="ec-3"');
        if (canAC3 === 'probably' || canAC3 === 'maybe') {
          return { isPlayable: true };
        }
      }
      return {
        isPlayable: false,
        reason: `${codec} (Dolby Digital) requires host OS hardware decoding not detected in this browser environment. Video may play silently.`,
      };
    }
    return { isPlayable: true };
  }

  public getSpeechClarityInsight(timestamp?: number): {
    appliedClarityBoost: number;
    dialogueDetected: boolean;
  } {
    const spectrum = this.getSpectrumData();
    const time = timestamp || (this.audioCtx ? this.audioCtx.currentTime : 0);
    return this.audioIntelligence.processSpectrum(spectrum, time);
  }

  public reset(): void {
    try {
      if (this.sourceNode) {
        this.sourceNode.disconnect();
        this.sourceNode = null;
      }
      if (this.bassFilter) {
        try { this.bassFilter.disconnect(); } catch {}
        this.bassFilter = null;
      }
      if (this.lowMidFilter) {
        try { this.lowMidFilter.disconnect(); } catch {}
        this.lowMidFilter = null;
      }
      if (this.midFilter) {
        try { this.midFilter.disconnect(); } catch {}
        this.midFilter = null;
      }
      if (this.highMidFilter) {
        try { this.highMidFilter.disconnect(); } catch {}
        this.highMidFilter = null;
      }
      if (this.trebleFilter) {
        try { this.trebleFilter.disconnect(); } catch {}
        this.trebleFilter = null;
      }
      if (this.compressor) {
        try { this.compressor.disconnect(); } catch {}
        this.compressor = null;
      }
      if (this.audioCtx && this.audioCtx.state !== 'closed') {
        this.audioCtx.close().catch(() => {});
      }
    } catch (e) {}
    this.audioIntelligence.reset();
    this.audioCtx = null;
    this.analyser = null;
    this.attachedElement = null;
    this.activeTrackIndex = 0;
    this.isInitialized = false;
  }
}

export const audioEngine = new CineMorphAudioEngine();

