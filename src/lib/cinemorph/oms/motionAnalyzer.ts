import { OMS_VisionAnalysisResult, OMS_MotionVector } from './types';

/**
 * motionAnalyzer.ts - Stage 5: Temporal Motion & Optical Velocity Engine
 * Tracks subject velocity across frames to predict lead-room positioning.
 */
export class OMS_MotionAnalyzer {
  private lastPosition: { x: number; y: number } | null = null;
  private lastTimestamp = 0;

  public process(vision: OMS_VisionAnalysisResult, timestamp: number): OMS_MotionVector {
    if (!this.lastPosition || this.lastTimestamp === 0) {
      this.lastPosition = { ...vision.combinedCenter };
      this.lastTimestamp = timestamp;
      return { vx: 0, vy: 0, speed: 0, directionRad: 0 };
    }

    const dt = Math.max(0.016, Math.abs(timestamp - this.lastTimestamp));
    const dx = vision.combinedCenter.x - this.lastPosition.x;
    const dy = vision.combinedCenter.y - this.lastPosition.y;

    const vx = dx / dt;
    const vy = dy / dt;
    const speed = Math.sqrt(vx * vx + vy * vy);
    const directionRad = Math.atan2(vy, vx);

    this.lastPosition = { ...vision.combinedCenter };
    this.lastTimestamp = timestamp;

    return {
      vx: Math.max(-2, Math.min(2, vx)),
      vy: Math.max(-2, Math.min(2, vy)),
      speed: Math.min(2.8, speed),
      directionRad,
    };
  }

  public reset(): void {
    this.lastPosition = null;
    this.lastTimestamp = 0;
  }
}
