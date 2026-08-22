import { 
  AdaptivePerformanceDecision, 
  AdaptiveSystemMetrics, 
  DevicePerformanceProfile, 
  MediaHybridRouteType 
} from '../../types';

/**
 * CineMorph AI - Master Hybrid Media Routing & Adaptive Performance Engine
 * Implements 100-Failures-Resilient Processing, Zero-Wait Startup, and Dynamic LOD Arbitration.
 */
export class HybridMediaRouter {
  private currentProfile: DevicePerformanceProfile = 'balanced';
  private metrics: AdaptiveSystemMetrics = {
    isOnline: true,
    hardwareConcurrency: 4,
    deviceMemoryGb: 4,
    isOnBattery: false,
    currentFps: 60,
    droppedFramesCount: 0,
  };
  private consecutiveFrameDrops = 0;

  constructor() {
    this.detectInitialMetrics();
  }

  private detectInitialMetrics(): void {
    if (typeof window === 'undefined') return;

    const nav = window.navigator as any;
    this.metrics.hardwareConcurrency = nav.hardwareConcurrency || 4;
    this.metrics.deviceMemoryGb = nav.deviceMemory || 4;
    this.metrics.isOnline = nav.onLine !== undefined ? nav.onLine : true;

    // Listen for online/offline events
    window.addEventListener('online', () => { this.metrics.isOnline = true; });
    window.addEventListener('offline', () => { this.metrics.isOnline = false; });

    // Battery status API if supported
    if (nav.getBattery) {
      nav.getBattery().then((battery: any) => {
        this.metrics.isOnBattery = !battery.charging;
        this.metrics.batteryLevelPercent = Math.round(battery.level * 100);
        battery.addEventListener('chargingchange', () => {
          this.metrics.isOnBattery = !battery.charging;
        });
      }).catch(() => {});
    }

    this.currentProfile = this.classifyDeviceProfile();
  }

  /**
   * Classifies system hardware capabilities into a performance profile
   */
  public classifyDeviceProfile(): DevicePerformanceProfile {
    const cores = this.metrics.hardwareConcurrency;
    const mem = this.metrics.deviceMemoryGb || 4;
    const onBatteryLow = this.metrics.isOnBattery && (this.metrics.batteryLevelPercent || 100) < 20;

    if (onBatteryLow || cores <= 2) {
      return 'low';
    }
    if (cores >= 8 && mem >= 8 && !this.metrics.isOnBattery) {
      return 'high';
    }
    if (cores >= 4) {
      return 'balanced';
    }
    return 'low';
  }

  /**
   * Evaluates the active playback context and selects the optimal hybrid route (A through J)
   */
  public determineRoute(context: {
    isLocal: boolean;
    durationSeconds: number;
    hasCanvasFailed?: boolean;
    isNetworkThrottled?: boolean;
    userEcoMode?: boolean;
  }): AdaptivePerformanceDecision {
    const profile = context.userEcoMode ? 'low' : this.currentProfile;

    // Route I: Offline Airgap
    if (!this.metrics.isOnline && context.isLocal) {
      return {
        route: 'offline-airgap',
        profile,
        sampleIntervalMs: 1500,
        sampleResolution: { width: 16, height: 9 },
        theaterLOD: profile === 'high' ? 'high' : 'medium',
        spatialAudioEnabled: true,
        allowBackgroundLookahead: false,
        enableDynamicAmbilight: true,
        reason: '100% Offline Airgap playback active with local canvas processing',
      };
    }

    // Route J: Model / Canvas Unavailable Fallback
    if (context.hasCanvasFailed) {
      return {
        route: 'model-unavailable',
        profile,
        sampleIntervalMs: 0,
        sampleResolution: { width: 16, height: 9 },
        theaterLOD: 'minimal',
        spatialAudioEnabled: true,
        allowBackgroundLookahead: false,
        enableDynamicAmbilight: false,
        reason: 'Canvas analysis failed; falling back to clean native player without ambient extraction',
      };
    }

    // Route H: Network Constrained
    if (!context.isLocal && context.isNetworkThrottled) {
      return {
        route: 'network-constrained',
        profile: 'low',
        sampleIntervalMs: 0,
        sampleResolution: { width: 16, height: 9 },
        theaterLOD: 'minimal',
        spatialAudioEnabled: false,
        allowBackgroundLookahead: false,
        enableDynamicAmbilight: false,
        reason: 'Network constrained; pausing optional processing to prioritize video buffer',
      };
    }

    // Local Media Routes
    if (context.isLocal) {
      if (profile === 'high') {
        // Route G: High-End Cinema
        return {
          route: 'high-end-cinema',
          profile: 'high',
          sampleIntervalMs: 800,
          sampleResolution: { width: 32, height: 18 },
          theaterLOD: 'high',
          spatialAudioEnabled: true,
          allowBackgroundLookahead: context.durationSeconds > 0 && context.durationSeconds < 7200,
          enableDynamicAmbilight: true,
          reason: 'High-performance profile enabled: 800ms high-fidelity sampling with 3D acoustics',
        };
      }

      if (profile === 'low' || profile === 'ultra-low') {
        // Route F: Weak Device Fallback
        return {
          route: 'weak-device-fallback',
          profile: 'low',
          sampleIntervalMs: 3000,
          sampleResolution: { width: 16, height: 9 },
          theaterLOD: 'minimal',
          spatialAudioEnabled: false,
          allowBackgroundLookahead: false,
          enableDynamicAmbilight: true,
          reason: 'Conserving system resources: 3s throttled sampling with minimal theater shaders',
        };
      }

      // Route C: Standard Local Light AI
      return {
        route: 'local-light-ai',
        profile: 'balanced',
        sampleIntervalMs: 1500,
        sampleResolution: { width: 16, height: 9 },
        theaterLOD: 'medium',
        spatialAudioEnabled: true,
        allowBackgroundLookahead: false,
        enableDynamicAmbilight: true,
        reason: 'Balanced profile: 1.5s non-blocking sampling (16x9 grid) with full UI smoothness',
      };
    }

    // YouTube Stream Routes
    if (profile === 'high') {
      return {
        route: 'youtube-light-ai',
        profile: 'high',
        sampleIntervalMs: 1000,
        sampleResolution: { width: 16, height: 9 },
        theaterLOD: 'high',
        spatialAudioEnabled: true,
        allowBackgroundLookahead: false,
        enableDynamicAmbilight: true,
        reason: 'YouTube cinema stream with spatial audio processing and active Ambilight',
      };
    }

    return {
      route: 'youtube-no-ai',
      profile: 'balanced',
      sampleIntervalMs: 0,
      sampleResolution: { width: 16, height: 9 },
      theaterLOD: profile === 'low' ? 'minimal' : 'medium',
      spatialAudioEnabled: profile !== 'low',
      allowBackgroundLookahead: false,
      enableDynamicAmbilight: true,
      reason: 'Standard YouTube playback in 4.3:1 IMAX auditorium',
    };
  }

  /**
   * Adapts priority when frame drops are detected
   */
  public reportFrameDrop(): void {
    this.consecutiveFrameDrops++;
    if (this.consecutiveFrameDrops > 5) {
      // Step down profile to protect playback smoothness
      if (this.currentProfile === 'high') this.currentProfile = 'balanced';
      else if (this.currentProfile === 'balanced') this.currentProfile = 'low';
      else if (this.currentProfile === 'low') this.currentProfile = 'ultra-low';
      this.consecutiveFrameDrops = 0;
    }
  }

  public resetFrameDrops(): void {
    this.consecutiveFrameDrops = 0;
  }

  public getMetrics(): AdaptiveSystemMetrics {
    return { ...this.metrics };
  }

  public setManualProfile(profile: DevicePerformanceProfile): void {
    this.currentProfile = profile;
  }
}

export const hybridMediaRouter = new HybridMediaRouter();
