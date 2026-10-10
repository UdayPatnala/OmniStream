/**
 * temporalSmoother.ts - OMS-SBH Temporal Motion Smoothing
 * Critically damped spring filter (zeta = 1.0) with deadband hysteresis & frame-rate independent decay (Points 108, 109)
 */

import { OMSCropRect, OMSPoint } from './geometryTypes';
import { OMS_GEOMETRY_CONFIG } from './geometryConfig';

export class OMSTemporalSmoother {
  private currentCrop: OMSCropRect = { x: 0, y: 0, width: 1.0, height: 1.0 };
  private velocity: OMSPoint = { x: 0, y: 0 };
  private lastTimestamp: number = 0;
  private isInitialized: boolean = false;

  public reset(initialCrop?: OMSCropRect): void {
    this.currentCrop = initialCrop ? { ...initialCrop } : { x: 0, y: 0, width: 1.0, height: 1.0 };
    this.velocity = { x: 0, y: 0 };
    this.lastTimestamp = 0;
    this.isInitialized = Boolean(initialCrop);
  }

  /**
   * Applies frame-rate-independent critically damped spring smoothing to candidate crop coordinates
   * Stable across 30Hz, 60Hz, 90Hz, 120Hz, and 144Hz
   */
  public smooth(targetCrop: OMSCropRect, timestamp: number): OMSCropRect {
    if (!this.isInitialized) {
      this.currentCrop = { ...targetCrop };
      this.lastTimestamp = timestamp;
      this.isInitialized = true;
      return { ...this.currentCrop };
    }

    const dt =
      this.lastTimestamp === 0
        ? 0.016
        : Math.min(0.1, Math.max(0.001, (timestamp - this.lastTimestamp) / 1000));
    this.lastTimestamp = timestamp;

    // Hysteresis deadband: ignore position delta if below threshold (Point 109)
    const dx = targetCrop.x - this.currentCrop.x;
    const dy = targetCrop.y - this.currentCrop.y;
    const dist = Math.hypot(dx, dy);

    if (dist < OMS_GEOMETRY_CONFIG.TEMPORAL_DEADBAND) {
      // Within deadband: decay velocity smoothly
      this.velocity.x *= 0.85;
      this.velocity.y *= 0.85;
      return { ...this.currentCrop };
    }

    // Critically damped spring-damper equations:
    // a = -2*zeta*omega*v - omega^2*(x - target)
    const omega = OMS_GEOMETRY_CONFIG.SPRING_ANGULAR_FREQUENCY;
    const zeta = OMS_GEOMETRY_CONFIG.SPRING_DAMPING_RATIO;

    const ax = -2 * zeta * omega * this.velocity.x - omega * omega * (this.currentCrop.x - targetCrop.x);
    const ay = -2 * zeta * omega * this.velocity.y - omega * omega * (this.currentCrop.y - targetCrop.y);

    this.velocity.x += ax * dt;
    this.velocity.y += ay * dt;

    let nextX = this.currentCrop.x + this.velocity.x * dt;
    let nextY = this.currentCrop.y + this.velocity.y * dt;

    // Settling check: if very close to target and velocity is negligible, snap to target
    if (
      Math.abs(nextX - targetCrop.x) < OMS_GEOMETRY_CONFIG.SPRING_SETTLING_THRESHOLD &&
      Math.abs(this.velocity.x) < 0.005
    ) {
      nextX = targetCrop.x;
      this.velocity.x = 0;
    }

    if (
      Math.abs(nextY - targetCrop.y) < OMS_GEOMETRY_CONFIG.SPRING_SETTLING_THRESHOLD &&
      Math.abs(this.velocity.y) < 0.005
    ) {
      nextY = targetCrop.y;
      this.velocity.y = 0;
    }

    // Clamp within valid [0, 1] range
    nextX = Math.max(0, Math.min(1.0 - targetCrop.width, nextX));
    nextY = Math.max(0, Math.min(1.0 - targetCrop.height, nextY));

    // Frame-rate independent dimension smoothing using exponential decay:
    // decayFactor = 1 - exp(-omega * dt)
    const decayFactor = 1.0 - Math.exp(-omega * dt);
    const nextW = this.currentCrop.width + (targetCrop.width - this.currentCrop.width) * decayFactor;
    const nextH = this.currentCrop.height + (targetCrop.height - this.currentCrop.height) * decayFactor;

    this.currentCrop = {
      x: Number(nextX.toFixed(6)),
      y: Number(nextY.toFixed(6)),
      width: Number(nextW.toFixed(6)),
      height: Number(nextH.toFixed(6)),
    };

    return { ...this.currentCrop };
  }

  public getCurrentCrop(): OMSCropRect {
    return { ...this.currentCrop };
  }

  public getVelocity(): OMSPoint {
    return { ...this.velocity };
  }
}
