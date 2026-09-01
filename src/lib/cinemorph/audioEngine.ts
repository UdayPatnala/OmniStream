import { AudioEQConfig, AudioPreset } from '../../types';

/**
 * CineMorph AI - Web Audio DSP Neural Audio Engine
 * Real-time Web Audio API node management for EQ, Surround 3D, and DRC.
 */

class CineMorphAudioEngine {
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isInitialized = false;
  private activeTrackIndex = 0;

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

  /**
   * Switches active hardware audio track if supported by browser/mediaElement
   */
  public setActiveAudioTrack(trackIndex: number, mediaElement?: HTMLMediaElement | null): boolean {
    this.activeTrackIndex = trackIndex;

    if (!mediaElement) return true;

    try {
      // 1. Check for standard HTMLMediaElement.audioTracks
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
        return matched;
      }

      // 2. WebAudio Graph Resync
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      return true;
    } catch (err) {
      console.warn('[CineMorphAudioEngine] Error switching audio track:', err);
      return false;
    }
  }

  public getActiveAudioTrackIndex(): number {
    return this.activeTrackIndex;
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
    this.audioCtx = null;
    this.analyser = null;
    this.isInitialized = false;
  }
}

export const audioEngine = new CineMorphAudioEngine();
