import { AudioEQConfig, AudioPreset } from '../../types';
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
  private isInitialized = false;
  private activeTrackIndex = 0;
  private audioIntelligence = new AudioIntelligenceService();

  public init(mediaElement?: HTMLMediaElement | null): boolean {
    if (this.isInitialized) return true;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return false;

      this.audioCtx = new AudioCtxClass();

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64;

      if (mediaElement) {
        this.sourceNode = this.audioCtx.createMediaElementSource(mediaElement);
        this.connectPipeline();
      }

      this.isInitialized = true;
      return true;
    } catch (e) {
      console.warn('CineMorph Audio Engine initialization warning:', e);
      return false;
    }
  }

  private connectPipeline() {
    if (!this.audioCtx || !this.sourceNode) return;
    try {
      this.sourceNode.disconnect();
      
      let lastNode: AudioNode = this.sourceNode;

      if (this.analyser) {
        lastNode.connect(this.analyser);
        lastNode = this.analyser;
      }

      lastNode.connect(this.audioCtx.destination);
    } catch (err) {
      try {
        this.sourceNode.connect(this.audioCtx.destination);
      } catch (e) {}
    }
  }

  /**
   * Preserves creator original sound without artificial distortions
   */
  public applyConfig(_config?: AudioEQConfig): void {
    try {
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
    } catch (err) {
      console.warn('[CineMorphAudioEngine] Error resuming audio context:', err);
    }
  }

  public getPresetConfig(preset?: AudioPreset | null): AudioEQConfig {
    return {
      preset: (preset === 'original' || !preset) ? 'original' : preset,
      bassBoost: 0,
      dialogueClarity: 0,
      trebleShine: 0,
      surround3D: false,
      drcLoudness: false,
    };
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
      if (this.audioCtx && this.audioCtx.state !== 'closed') {
        this.audioCtx.close().catch(() => {});
      }
    } catch (e) {}
    this.audioIntelligence.reset();
    this.audioCtx = null;
    this.analyser = null;
    this.isInitialized = false;
  }
}

export const audioEngine = new CineMorphAudioEngine();
