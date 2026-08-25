import { OMS_CandidateFraming } from './types';

/**
 * candidateGenerator.ts - Stage 7: Candidate Framing Viewport Generator
 * Generates discrete candidate viewports (Center, Left-Third, Right-Third, Upper-Third, Motion-Leading, Source-Original)
 * at the minimum scale required to cover the selected aperture ratio.
 */
export class OMS_CandidateGenerator {
  public generateCandidates(aspectRatio: string): OMS_CandidateFraming[] {
    const minScale = aspectRatio === '1.43:1' ? 1.25 : aspectRatio === '1.90:1' ? 1.08 : aspectRatio === '21:9' ? 1.33 : 1.0;

    return [
      {
        id: 'source_original',
        name: 'Source Directorial Composition',
        panX: 0,
        panY: 0,
        scale: 1.0,
        aspectRatio,
      },
      {
        id: 'aperture_center',
        name: 'Aperture Matched Center',
        panX: 0,
        panY: 0,
        scale: minScale,
        aspectRatio,
      },
      {
        id: 'left_third',
        name: 'Left-Third Subject Framing',
        panX: -0.15,
        panY: -0.02,
        scale: minScale * 1.04,
        aspectRatio,
      },
      {
        id: 'right_third',
        name: 'Right-Third Subject Framing',
        panX: 0.15,
        panY: -0.02,
        scale: minScale * 1.04,
        aspectRatio,
      },
      {
        id: 'upper_third',
        name: 'Upper-Third Headroom Priority',
        panX: 0,
        panY: -0.05,
        scale: minScale * 1.05,
        aspectRatio,
      },
      {
        id: 'motion_lead',
        name: 'Dynamic Motion Lead-Room',
        panX: 0.08,
        panY: -0.02,
        scale: minScale * 1.06,
        aspectRatio,
      },
    ];
  }
}
