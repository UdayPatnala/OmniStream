import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThresholdPortal } from '../components/threshold/ThresholdPortal';
import { CineMorphLanding } from '../pages/CineMorphLanding';
import {
  isMobileTouchDevice,
  isPortraitOrientation,
  requestLandscapeOrientation,
  unlockOrientation,
} from '../lib/services/orientationService';

vi.mock('../lib/services/orientationService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/services/orientationService')>();
  return {
    ...actual,
    isMobileTouchDevice: vi.fn(),
    isPortraitOrientation: vi.fn(),
    requestLandscapeOrientation: vi.fn().mockResolvedValue(true),
    unlockOrientation: vi.fn(),
  };
});

describe('OmniStream Responsive & Visual Palette Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('T-RESP-01: ThresholdPortal has responsive container with min-h-[100dvh] and overflow-y-auto for natural scrolling without clipping', () => {
    const { container } = render(
      <MemoryRouter>
        <ThresholdPortal />
      </MemoryRouter>
    );

    const rootElement = container.firstChild as HTMLElement;
    expect(rootElement).toBeDefined();
    expect(rootElement.className).toContain('min-h-[100dvh]');
    expect(rootElement.className).toContain('overflow-y-auto');
    expect(rootElement.className).toContain('overflow-x-hidden');
  });

  it('T-RESP-02: ThresholdPortal applies elevated light-first warm ivory & dark navy palette', () => {
    const { container } = render(
      <MemoryRouter>
        <ThresholdPortal />
      </MemoryRouter>
    );

    const rootElement = container.firstChild as HTMLElement;
    expect(rootElement).toBeDefined();
    const inlineBg = rootElement.style.background;
    // Verify background gradient contains warm ivory #FAF8F5 or dark cosmic radial
    expect(inlineBg.includes('#FAF8F5') || inlineBg.includes('rgb(250, 248, 245)') || inlineBg.includes('radial-gradient')).toBe(true);

    const utubeButton = screen.getByRole('button', { name: /u-tube/i });
    const cinemorphButton = screen.getByRole('button', { name: /cinemorph/i });
    expect(utubeButton).toBeDefined();
    expect(cinemorphButton).toBeDefined();
  });

  it('T-RESP-03: CineMorphLanding displays rotation prompt banner when portrait mobile device is detected', () => {
    vi.mocked(isMobileTouchDevice).mockReturnValue(true);
    vi.mocked(isPortraitOrientation).mockReturnValue(true);

    render(
      <MemoryRouter>
        <CineMorphLanding />
      </MemoryRouter>
    );

    const banner = screen.getByRole('status');
    expect(banner).toBeDefined();
    expect(banner.textContent).toContain('Rotate to landscape');

    // Click Rotate button on banner triggers explicit landscape orientation request
    const rotateBtn = screen.getByRole('button', { name: /rotate/i });
    fireEvent.click(rotateBtn);
    expect(requestLandscapeOrientation).toHaveBeenCalled();

    // Dismiss button works
    const dismissBtn = screen.getByLabelText('Dismiss rotation prompt');
    fireEvent.click(dismissBtn);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('T-RESP-04: CineMorphLanding does not display rotation banner on desktop or landscape devices', () => {
    vi.mocked(isMobileTouchDevice).mockReturnValue(false);
    vi.mocked(isPortraitOrientation).mockReturnValue(false);

    render(
      <MemoryRouter>
        <CineMorphLanding />
      </MemoryRouter>
    );

    expect(screen.queryByRole('status')).toBeNull();
  });

  it('T-RESP-05: CineMorph selection in ThresholdPortal triggers landscape orientation request', () => {
    render(
      <MemoryRouter>
        <ThresholdPortal />
      </MemoryRouter>
    );

    const cinemorphButton = screen.getByRole('button', { name: /cinemorph/i });
    fireEvent.click(cinemorphButton);

    expect(requestLandscapeOrientation).toHaveBeenCalled();
  });
});
