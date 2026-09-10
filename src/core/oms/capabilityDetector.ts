import { IDeviceCapabilities } from './interfaces';

/**
 * OMS Device Capability Detector
 * 100% Client-Side, Zero Network Overhead
 */
class OMSCapabilityDetector {
  private cachedCapabilities: IDeviceCapabilities | null = null;

  public async detect(): Promise<IDeviceCapabilities> {
    if (this.cachedCapabilities) {
      return this.cachedCapabilities;
    }

    const hasWasm = typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
    let hasSimd = false;
    if (hasWasm && typeof WebAssembly.validate === 'function') {
      try {
        // Test 4-byte WASM SIMD opcode validation
        hasSimd = WebAssembly.validate(
          new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 253, 12, 0, 0, 0, 0, 11])
        );
      } catch {
        hasSimd = false;
      }
    }

    const hasWebGpu = typeof navigator !== 'undefined' && 'gpu' in navigator && !!(navigator as any).gpu;
    const hasWebWorkers = typeof Worker !== 'undefined';
    const hasOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';
    const hasAudioContext = typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window);
    const hardwareConcurrency = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
    const deviceMemoryGb = typeof navigator !== 'undefined' && 'deviceMemory' in navigator ? (navigator as any).deviceMemory || 4 : 4;
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    let isOnBattery: boolean | undefined = undefined;
    let batteryLevel: number | undefined = undefined;

    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        isOnBattery = !battery.charging;
        batteryLevel = battery.level;
      } catch {
        // Battery API permission or support failed gracefully
      }
    }

    let maxTextureSize = 4096;
    if (typeof document !== 'undefined') {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          maxTextureSize = (gl as WebGLRenderingContext).getParameter((gl as WebGLRenderingContext).MAX_TEXTURE_SIZE) || 4096;
        }
      } catch {}
    }

    // Determine estimated tier
    let estimatedTier: IDeviceCapabilities['estimatedTier'] = 'balanced';
    if (hardwareConcurrency >= 8 && deviceMemoryGb >= 8 && (hasWebGpu || maxTextureSize >= 8192)) {
      estimatedTier = 'high';
    } else if (hardwareConcurrency <= 2 || deviceMemoryGb <= 2) {
      estimatedTier = 'ultra-low';
    } else if (hardwareConcurrency < 4 || deviceMemoryGb < 4) {
      estimatedTier = 'low';
    }

    this.cachedCapabilities = {
      hasWasm,
      hasSimd,
      hasWebGpu,
      hasWebWorkers,
      hasOffscreenCanvas,
      hasAudioContext,
      hardwareConcurrency,
      deviceMemoryGb,
      isOnline,
      isOnBattery,
      batteryLevel,
      maxTextureSize,
      estimatedTier,
    };

    return this.cachedCapabilities;
  }

  public getSyncCapabilities(): IDeviceCapabilities {
    if (this.cachedCapabilities) return this.cachedCapabilities;

    const hasWasm = typeof WebAssembly === 'object';
    const hasWebGpu = typeof navigator !== 'undefined' && 'gpu' in navigator;
    const hasWebWorkers = typeof Worker !== 'undefined';
    const hasOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';
    const hasAudioContext = typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window);
    const hardwareConcurrency = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
    const deviceMemoryGb = typeof navigator !== 'undefined' && 'deviceMemory' in navigator ? (navigator as any).deviceMemory || 4 : 4;
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    return {
      hasWasm,
      hasSimd: false,
      hasWebGpu,
      hasWebWorkers,
      hasOffscreenCanvas,
      hasAudioContext,
      hardwareConcurrency,
      deviceMemoryGb,
      isOnline,
      maxTextureSize: 4096,
      estimatedTier: hardwareConcurrency >= 8 ? 'high' : hardwareConcurrency <= 2 ? 'low' : 'balanced',
    };
  }
}

export const omsCapabilityDetector = new OMSCapabilityDetector();
