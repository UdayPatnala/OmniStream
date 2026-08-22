import { FrameAspectRatio, FrameReframeMode } from '../../types';

/**
 * CineMorph AI - Smart Framing & Viewport Adaptation Engine
 */

export interface FrameStyleResult {
  containerAspectClass: string;
  videoScaleTransform: string;
  cropOverlay: boolean;
  paddingTop: string;
}

export function calculateFrameStyle(
  aspectRatio: FrameAspectRatio,
  reframeMode: FrameReframeMode
): FrameStyleResult {
  let paddingTop = '56.25%'; // Default 16:9 ratio
  let videoScaleTransform = 'scale(1.0) translate(0px, 0px)';
  let cropOverlay = false;

  switch (aspectRatio) {
    case '21:9':
      paddingTop = '42.85%';
      if (reframeMode === 'center') {
        videoScaleTransform = 'scale(1.33) translateY(0%)';
      } else if (reframeMode === 'face-priority') {
        videoScaleTransform = 'scale(1.35) translateY(-4%)';
      } else if (reframeMode === 'smart-pan-zoom') {
        videoScaleTransform = 'scale(1.38) translateY(2%)';
      }
      cropOverlay = true;
      break;

    case '4:3':
      paddingTop = '75%';
      if (reframeMode === 'center') {
        videoScaleTransform = 'scale(1.0) translateY(0%)';
      } else if (reframeMode === 'face-priority') {
        videoScaleTransform = 'scale(1.05) translateY(-2%)';
      }
      break;

    case '1:1':
      paddingTop = '100%';
      videoScaleTransform = 'scale(1.25) translateY(0%)';
      cropOverlay = true;
      break;

    case '16:9':
    default:
      paddingTop = '56.25%';
      if (reframeMode === 'face-priority') {
        videoScaleTransform = 'scale(1.04) translateY(-2%)';
      } else if (reframeMode === 'smart-pan-zoom') {
        videoScaleTransform = 'scale(1.08) translateY(0%)';
      }
      break;
  }

  return {
    containerAspectClass: aspectRatio === '21:9' ? 'aspect-[21/9]' : aspectRatio === '4:3' ? 'aspect-[4/3]' : aspectRatio === '1:1' ? 'aspect-square' : 'aspect-video',
    videoScaleTransform,
    cropOverlay,
    paddingTop,
  };
}
