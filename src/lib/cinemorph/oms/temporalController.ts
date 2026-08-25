import { OMS_ScoredFraming, OMS_TemporalState } from './types';

/**
 * temporalController.ts - Stage 9: Temporal Motion & Hysteresis Controller
 * Prevents micro-jitter, hunting, and unnatural camera movements through exponential smoothing and deadband hysteresis.
 */
export class OMS_TemporalController {
  private state: OMS_TemporalState = {
    currentPanX: 0,
    currentPanY: 0,
    currentScale: 1.0,
    velocity: { vx: 0, vy: 0 },
    lastUpdateTime: 0,
  };

  private readonly ALPHA = 0.15; // Low-pass filter smoothing coefficient
  private readonly DEADBAND_DELTA = 0.025; // Minimum target delta to trigger motion
  private readonly MAX_VELOCITY_PER_SEC = 0.40; // Max pan velocity clamp

  public smooth(
    target: OMS_ScoredFraming,
    timestamp: number,
    isHardCut: boolean
  ): { panX: number; panY: number; scale: number; cssTransform: string } {
    if (this.state.lastUpdateTime === 0 || isHardCut) {
      this.state.currentPanX = target.panX;
      this.state.currentPanY = target.panY;
      this.state.currentScale = target.scale;
      this.state.velocity = { vx: 0, vy: 0 };
      this.state.lastUpdateTime = timestamp;
      return {
        panX: target.panX,
        panY: target.panY,
        scale: target.scale,
        cssTransform: `scale(${target.scale.toFixed(3)}) translate(${(target.panX * 100).toFixed(1)}%, ${(target.panY * 100).toFixed(1)}%)`,
      };
    }

    const dt = Math.max(0.016, Math.min(0.2, Math.abs(timestamp - this.state.lastUpdateTime)));
    this.state.lastUpdateTime = timestamp;

    // Deadband check
    const dx = target.panX - this.state.currentPanX;
    const dy = target.panY - this.state.currentPanY;
    const dScale = target.scale - this.state.currentScale;

    let nextPanX = this.state.currentPanX;
    let nextPanY = this.state.currentPanY;
    let nextScale = this.state.currentScale;

    if (Math.abs(dx) > this.DEADBAND_DELTA) {
      const clampedVx = Math.max(-this.MAX_VELOCITY_PER_SEC, Math.min(this.MAX_VELOCITY_PER_SEC, dx / dt));
      nextPanX = this.state.currentPanX + clampedVx * dt * this.ALPHA;
    }

    if (Math.abs(dy) > this.DEADBAND_DELTA) {
      const clampedVy = Math.max(-this.MAX_VELOCITY_PER_SEC, Math.min(this.MAX_VELOCITY_PER_SEC, dy / dt));
      nextPanY = this.state.currentPanY + clampedVy * dt * this.ALPHA;
    }

    if (Math.abs(dScale) > 0.01) {
      nextScale = this.state.currentScale + dScale * this.ALPHA;
    }

    this.state.currentPanX = nextPanX;
    this.state.currentPanY = nextPanY;
    this.state.currentScale = nextScale;

    const cssTransform = `scale(${nextScale.toFixed(3)}) translate(${(nextPanX * 100).toFixed(1)}%, ${(nextPanY * 100).toFixed(1)}%)`;

    return {
      panX: Number(nextPanX.toFixed(3)),
      panY: Number(nextPanY.toFixed(3)),
      scale: Number(nextScale.toFixed(3)),
      cssTransform,
    };
  }

  public reset(): void {
    this.state = {
      currentPanX: 0,
      currentPanY: 0,
      currentScale: 1.0,
      velocity: { vx: 0, vy: 0 },
      lastUpdateTime: 0,
    };
  }
}
