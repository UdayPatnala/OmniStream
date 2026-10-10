/**
 * domRendererAdapter.ts - OMS-SBH DOM & CSS Renderer Adapter
 * Maps normalized OMSProjectionState into GPU-accelerated CSS styles & variables (Points 123, 124)
 */

import type React from 'react';
import { OMSProjectionState } from './geometryTypes';

export interface OMSDOMRenderOutput {
  containerStyle: React.CSSProperties;
  screenStyle: React.CSSProperties;
  projectionPlaneStyle: React.CSSProperties;
  captionSafeZoneStyle: React.CSSProperties;
  apertureClipCurve: string;
  cssVariables: Record<string, string>;
}

export class OMSDOMRendererAdapter {
  /**
   * Generates production-ready CSS styles and CSS variables from an OMSProjectionState
   */
  public static mapStateToStyles(
    state: OMSProjectionState,
    isFullscreen: boolean = false
  ): OMSDOMRenderOutput {
    const { screen, aperture, projection, presentation, seats } = state;
    const isOriginal = presentation.mode === 'original';
    const isImax = presentation.mode === '1.43';

    // 1. Proscenium Aperture Dimensions
    const effectiveAspect = `${presentation.targetAspect}`;

    const maxHeight = isFullscreen
      ? seats.visible
        ? 'min(88vh, calc(100dvh - 5rem))'
        : '98vh'
      : seats.visible
      ? isOriginal
        ? 'min(84vh, calc(100dvh - 5.5rem))'
        : isImax
        ? 'min(84vh, calc(100dvh - 5.5rem))'
        : 'min(82vh, calc(100dvh - 5.5rem))'
      : isOriginal
      ? '94vh'
      : isImax
      ? '94vh'
      : '92vh';

    const maxWidth = isFullscreen
      ? seats.visible
        ? `min(99vw, calc(${maxHeight} * (${effectiveAspect})))`
        : `min(99vw, calc(98vh * (${effectiveAspect})))`
      : seats.visible
      ? `min(98vw, calc(${maxHeight} * (${effectiveAspect})))`
      : isOriginal
      ? `min(98vw, calc(94vh * (${effectiveAspect})))`
      : isImax
      ? `min(98vw, calc(94vh * (${effectiveAspect})))`
      : `min(98vw, calc(92vh * (${effectiveAspect})))`;

    const perspectiveTransform = isOriginal
      ? 'none'
      : isImax
      ? 'perspective(1100px) rotateX(1.3deg)'
      : 'perspective(1300px) rotateX(1.0deg)';

    const screenStyle: React.CSSProperties = {
      aspectRatio: effectiveAspect,
      width: '100%',
      maxWidth,
      maxHeight,
      clipPath: aperture.clipCurve,
      WebkitClipPath: aperture.clipCurve,
      transform: perspectiveTransform,
      transformOrigin: 'center bottom',
      transition:
        'max-width 600ms cubic-bezier(0.16, 1, 0.3, 1), max-height 600ms cubic-bezier(0.16, 1, 0.3, 1), aspect-ratio 600ms cubic-bezier(0.16, 1, 0.3, 1), transform 600ms cubic-bezier(0.16, 1, 0.3, 1), clip-path 600ms cubic-bezier(0.16, 1, 0.3, 1), -webkit-clip-path 600ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 600ms cubic-bezier(0.16, 1, 0.3, 1)',
    };

    // 2. Projection Plane Transform behind the aperture
    // Translate source crop offsets and scale onto the projection surface
    const offsetXPercent = projection.offset.x * 10;
    const offsetYPercent = projection.offset.y * 10;
    const projectionTransform = isOriginal
      ? 'none'
      : `scale(${projection.scale}) translate(${offsetXPercent}%, ${offsetYPercent}%)`;

    const projectionPlaneStyle: React.CSSProperties = {
      transform: projectionTransform,
      transformOrigin: 'center center',
      transition: 'transform 500ms cubic-bezier(0.16, 1, 0.3, 1)',
    };

    // 3. Caption Safe Region (Point 143: bottom 18% of aperture, safe margins)
    const captionSafeZoneStyle: React.CSSProperties = {
      position: 'absolute',
      bottom: '6%',
      left: '10%',
      right: '10%',
      maxWidth: '80%',
      pointerEvents: 'none',
      zIndex: 25,
    };

    const containerStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: isFullscreen ? 'center' : 'flex-start',
      paddingTop: isFullscreen ? 0 : '0.75rem',
      position: 'relative',
      width: '100%',
      height: '100%',
    };

    // 4. CSS Custom Properties for Render Isolation
    const cssVariables: Record<string, string> = {
      '--oms-max-width': maxWidth,
      '--oms-max-height': maxHeight,
      '--oms-aspect-ratio': effectiveAspect,
      '--oms-projection-scale': `${projection.scale}`,
      '--oms-pan-x': `${offsetXPercent}%`,
      '--oms-pan-y': `${offsetYPercent}%`,
      '--oms-curvature-x': `${screen.curvatureX}`,
      '--oms-curvature-y': `${screen.curvatureY}`,
      '--oms-seats-visible': seats.visible ? '1' : '0',
    };

    return {
      containerStyle,
      screenStyle,
      projectionPlaneStyle,
      captionSafeZoneStyle,
      apertureClipCurve: aperture.clipCurve,
      cssVariables,
    };
  }
}
