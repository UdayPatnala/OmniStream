import { AudioEQConfig, AudioPreset } from '../../types';

/**
 * CineMorph AI - Web Audio DSP Neural Audio Engine
 * Real-time Web Audio API node management for EQ, Surround 3D, and DRC.
 */

class CineMorphAudioEngine {
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private dialogueFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private panner: StereoPannerNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isInitialized = false;

  public init(mediaElement?: HTMLMediaElement | null): boolean {
    if (this.isInitialized) return true;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return false;

      this.audioCtx = new AudioCtxClass();

      // Create filter nodes
      this.bassFilter = this.audioCtx.createBiquadFilter();
      this.bassFilter.type = 'lowshelf';
      this.bassFilter.frequency.value = 150; // 150Hz cutoff

      this.dialogueFilter = this.audioCtx.createBiquadFilter();
      this.dialogueFilter.type = 'peaking';
      this.dialogueFilter.frequency.value = 2500; // 2.5kHz dialogue boost
      this.dialogueFilter.Q.value = 1.2;

      this.trebleFilter = this.audioCtx.createBiquadFilter();
      this.trebleFilter.type = 'highshelf';
      this.trebleFilter.frequency.value = 7000; // 7kHz treble shine

      this.compressor = this.audioCtx.createDynamicsCompressor();
      this.compressor.threshold.value = -24;
      this.compressor.knee.value = 30;
      this.compressor.ratio.value = 12;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.25;

      if (this.audioCtx.createStereoPanner) {
        this.panner = this.audioCtx.createStereoPanner();
        this.panner.pan.value = 0;
      }

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

      if (this.bassFilter) {
        lastNode.connect(this.bassFilter);
        lastNode = this.bassFilter;
      }
      if (this.dialogueFilter) {
        lastNode.connect(this.dialogueFilter);
        lastNode = this.dialogueFilter;
      }
      if (this.trebleFilter) {
        lastNode.connect(this.trebleFilter);
        lastNode = this.trebleFilter;
      }
      if (this.compressor) {
        lastNode.connect(this.compressor);
        lastNode = this.compressor;
      }
      if (this.panner) {
        lastNode.connect(this.panner);
        lastNode = this.panner;
      }
      if (this.analyser) {
        lastNode.connect(this.analyser);
        lastNode = this.analyser;
      }

      lastNode.connect(this.audioCtx.destination);
    } catch (err) {
      // Connect fallback direct destination
      try {
        this.sourceNode.connect(this.audioCtx.destination);
      } catch (e) {}
    }
  }

  public applyConfig(config: AudioEQConfig) {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    if (this.bassFilter) {
      this.bassFilter.gain.value = config.bassBoost;
    }
    if (this.dialogueFilter) {
      this.dialogueFilter.gain.value = config.dialogueClarity;
    }
    if (this.trebleFilter) {
      this.trebleFilter.gain.value = config.trebleShine;
    }

    if (this.compressor) {
      this.compressor.ratio.value = config.drcLoudness ? 12 : 1;
      this.compressor.threshold.value = config.drcLoudness ? -28 : -50;
    }
  }

  public getPresetConfig(preset: AudioPreset): AudioEQConfig {
    switch (preset) {
      case 'dialogue-boost':
        return { preset, bassBoost: -4, dialogueClarity: 18, trebleShine: 8, surround3D: true, drcLoudness: true };
      case 'bass-heavy':
        return { preset, bassBoost: 20, dialogueClarity: 2, trebleShine: 4, surround3D: true, drcLoudness: false };
      case 'spatial-3d':
        return { preset, bassBoost: 8, dialogueClarity: 10, trebleShine: 14, surround3D: true, drcLoudness: true };
      case 'night-compression':
        return { preset, bassBoost: -6, dialogueClarity: 12, trebleShine: -2, surround3D: false, drcLoudness: true };
      case 'original':
      default:
        return { preset, bassBoost: 0, dialogueClarity: 0, trebleShine: 0, surround3D: false, drcLoudness: false };
    }
  }

  public getSpectrumData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(16).fill(128);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }
}

export const audioEngine = new CineMorphAudioEngine();
