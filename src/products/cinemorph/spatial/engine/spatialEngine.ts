/**
 * spatialEngine.ts — CineMorph Spatial Engine (Canonical Coordinator)
 * Master coordinator orchestrating World State, Constraint Optimization, Invariant Validation,
 * Motion Dynamics, Fail-Safe Recovery, and DOM Presentation.
 */

import { OMSSBHHarmonizer, OMSSBHState, omsSBHHarmonizer } from '../../sbh/sbhHarmonizer';
import { OMSPresentationMode, OMSFocalPoint } from '../../sbh/geometryTypes';

export type CineMorphSpatialState = OMSSBHState;

export interface CineMorphSpatialInput {
  widthPx: number;
  heightPx: number;
  mode: OMSPresentationMode;
  seatsVisible: boolean;
  isFullscreen?: boolean;
  viewportWidthPx?: number;
  viewportHeightPx?: number;
  intelligenceProposal?: {
    focalPoint?: OMSFocalPoint;
    confidence: number;
    timestamp: number;
    generation?: number;
  };
}

/**
 * CineMorph Spatial Engine
 * Canonical human-engineered spatial behavior coordinator.
 */
export class CineMorphSpatialEngine extends OMSSBHHarmonizer {
  /**
   * Computes the authoritative spatial presentation state for CineMorph Theater.
   */
  public computeSpatialState(input: CineMorphSpatialInput): CineMorphSpatialState {
    return this.harmonize(input);
  }
}

/** Authoritative singleton instance */
export const cineMorphSpatialEngine = new CineMorphSpatialEngine();

// Backward compatibility alias
export { cineMorphSpatialEngine as omsSBHHarmonizer };
