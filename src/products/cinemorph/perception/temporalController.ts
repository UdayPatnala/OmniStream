import { OMS_ScoredFraming, OMS_TemporalState } from './types';

/**
 * temporalController.ts - Stage 9: Temporal Motion & Hysteresis Controller
 * Prevents micro-jitter, hunting, and unnatural camera movements through
 * 2nd-order critically damped spring-damper dynamics (zeta = 1.0) and deadband hysteresis.
 */
export class OMS_TemporalController {
  private state: OMS_TemporalState = {
    currentPanX: 0,
    currentPanY: 0,
    currentScale: 1.0,
    velocity: { vx: 0, vy: 0 },
    lastUpdateTime: 0,
  };

  private readonly DEADBAND_DELTA = 0.025; // Minimum target delta to trigger motion
  private readonly OMEGA_N = 6.0; // Natural frequency (rad/s)
  private readonly ZETA = 1.0; // Critically damped ratio (zeta = 1.0: zero overshoot)
  private readonly MAX_VELOCITY_PER_SEC = 0.45; // Max pan velocity clamp

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

    const dt = Math.max(0.016, Math.min(0.1, Math.abs(timestamp - this.state.lastUpdateTime)));
    this.state.lastUpdateTime = timestamp;

    // Calculate displacement error
    const dx = target.panX - this.state.currentPanX;
    const dy = target.panY - this.state.currentPanY;
    const dScale = target.scale - this.state.currentScale;

    // Apply deadband hysteresis
    let effectiveTargetX = this.state.currentPanX;
    let effectiveTargetY = this.state.currentPanY;
    let effectiveTargetScale = this.state.currentScale;

    if (Math.abs(dx) > this.DEADBAND_DELTA) {
      effectiveTargetX = target.panX;
    }
    if (Math.abs(dy) > this.DEADBAND_DELTA) {
      effectiveTargetY = target.panY;
    }
    if (Math.abs(dScale) > 0.01) {
      effectiveTargetScale = target.scale;
    }

    // Spring-Damper Physics step: F = -k*(x - target) - c*v
    // For critical damping: k = omega^2, c = 2*zeta*omega
    const k = this.OMEGA_N * this.OMEGA_N;
    const c = 2 * this.ZETA * this.OMEGA_N;

    const ax = k * (effectiveTargetX - this.state.currentPanX) - c * this.state.velocity.vx;
    const ay = k * (effectiveTargetY - this.state.currentPanY) - c * this.state.velocity.vy;

    // Integrate velocity and clamp
    let vx = this.state.velocity.vx + ax * dt;
    let vy = this.state.velocity.vy + ay * dt;

    vx = Math.max(-this.MAX_VELOCITY_PER_SEC, Math.min(this.MAX_VELOCITY_PER_SEC, vx));
    vy = Math.max(-this.MAX_VELOCITY_PER_SEC, Math.min(this.MAX_VELOCITY_PER_SEC, vy));

    this.state.velocity = { vx, vy };

    // Integrate position
    const nextPanX = this.state.currentPanX + vx * dt;
    const nextPanY = this.state.currentPanY + vy * dt;
    const nextScale = this.state.currentScale + (effectiveTargetScale - this.state.currentScale) * 0.18;

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
