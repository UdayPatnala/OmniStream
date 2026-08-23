import { FrameAspectRatio, FrameReframeMode } from '../../types';

/**
 * CineMorph AI - Smart Framing & Viewport Adaptation Engine
 */

export interface FrameStyleResult {
  containerAspectClass: string;
  aspectRatioStyle: string;
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
  let aspectRatioStyle = '16 / 9';

  switch (aspectRatio) {
    case 'original':
      paddingTop = '56.25%';
      aspectRatioStyle = '16 / 9';
      videoScaleTransform = 'scale(1.0) translate(0px, 0px)';
      cropOverlay = false;
      break;

    case 'auto':
      paddingTop = '48%';
      aspectRatioStyle = '19.5 / 9';
      videoScaleTransform = 'scale(1.18) translateY(-3%)';
      cropOverlay = true;
      break;

    case '21:9':
      paddingTop = '42.85%';
      aspectRatioStyle = '21 / 9';
      if (reframeMode === 'center') {
        videoScaleTransform = 'scale(1.33) translateY(0%)';
      } else if (reframeMode === 'face-priority') {
        videoScaleTransform = 'scale(1.35) translateY(-4%)';
      } else if (reframeMode === 'smart-pan-zoom') {
        videoScaleTransform = 'scale(1.42) translateY(2%)';
      } else {
        videoScaleTransform = 'scale(1.33) translateY(-2%)';
      }
      cropOverlay = true;
      break;

    case '4:3':
      paddingTop = '75%';
      aspectRatioStyle = '4 / 3';
      if (reframeMode === 'face-priority') {
        videoScaleTransform = 'scale(1.12) translateY(-2%)';
      } else if (reframeMode === 'smart-pan-zoom') {
        videoScaleTransform = 'scale(1.20)';
      } else {
        videoScaleTransform = 'scale(1.0)';
      }
      break;

    case '1:1':
      paddingTop = '100%';
      aspectRatioStyle = '1 / 1';
      videoScaleTransform = 'scale(1.35) translateY(-3%)';
      cropOverlay = true;
      break;

    case '1.43:1':
      paddingTop = '69.93%';
      aspectRatioStyle = '143 / 100';
      if (reframeMode === 'face-priority') {
        videoScaleTransform = 'scale(1.28) translateY(-3%)';
      } else if (reframeMode === 'smart-pan-zoom') {
        videoScaleTransform = 'scale(1.32) translateY(-2%)';
      } else {
        videoScaleTransform = 'scale(1.25) translateY(0%)';
      }
      cropOverlay = true;
      break;

    case '1.90:1':
      paddingTop = '52.63%';
      aspectRatioStyle = '190 / 100';
      if (reframeMode === 'face-priority') {
        videoScaleTransform = 'scale(1.12) translateY(-2%)';
      } else if (reframeMode === 'smart-pan-zoom') {
        videoScaleTransform = 'scale(1.16) translateY(-1%)';
      } else {
        videoScaleTransform = 'scale(1.08) translateY(0%)';
      }
      cropOverlay = true;
      break;

    case '4.3:1':
      paddingTop = '23.255%';
      aspectRatioStyle = '43 / 10';
      if (reframeMode === 'face-priority') {
        videoScaleTransform = 'scale(1.45) translateY(-5%)';
      } else {
        videoScaleTransform = 'scale(1.35) translateY(-2%)';
      }
      cropOverlay = true;
      break;

    case '16:9':
    default:
      paddingTop = '56.25%';
      aspectRatioStyle = '16 / 9';
      if (reframeMode === 'face-priority') {
        videoScaleTransform = 'scale(1.06) translateY(-2%)';
      } else if (reframeMode === 'smart-pan-zoom') {
        videoScaleTransform = 'scale(1.12) translateY(0%)';
      } else {
        videoScaleTransform = 'scale(1.0)';
      }
      break;
  }

  return {
    containerAspectClass: 
      aspectRatio === 'original' ? 'aspect-video' :
      aspectRatio === 'auto' ? 'aspect-[19.5/9]' :
      aspectRatio === '1.43:1' ? 'aspect-[143/100]' :
      aspectRatio === '1.90:1' ? 'aspect-[190/100]' :
      aspectRatio === '21:9' ? 'aspect-[21/9]' : 
      aspectRatio === '4:3' ? 'aspect-[4/3]' : 
      aspectRatio === '1:1' ? 'aspect-square' : 
      aspectRatio === '4.3:1' ? 'aspect-[43/10]' : 'aspect-video',
    aspectRatioStyle,
    videoScaleTransform,
    cropOverlay,
    paddingTop,
  };
}
