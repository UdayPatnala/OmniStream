import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CinemaLounge } from '../components/cinemorph/landing/CinemaLounge';
import { LocalMediaItem } from '../types';

describe('CinemaLounge Hidden Environmental Interaction Behind Screen', () => {
  const defaultProps = {
    environmentalTime: 'morning' as const,
    onTriggerFileInput: vi.fn(),
    fileError: null,
  };

  it('renders the environmental plate and hidden clickable screen button at exact 16:9 stage coordinates', () => {
    render(<CinemaLounge {...defaultProps} />);

    // 1. Environmental background plate rendered with object-contain
    const plateImg = screen.getByAltText('CineMorph Architectural Cinema Lounge');
    expect(plateImg).toBeInTheDocument();
    expect(plateImg.getAttribute('src')).toBe('/cinemorph_lounge_plate.jpg');
    expect(plateImg.className).toMatch(/object-(cover|contain)/);

    // 2. Hidden screen button strictly positioned at exact 16:9 percentage coordinates covering usable screen
    const screenButton = screen.getByRole('button', {
      name: /Import local video or audio file into CineMorph theater/i,
    });
    expect(screenButton).toBeInTheDocument();
    expect(screenButton.style.left).toBe('45.2%');
    expect(screenButton.style.top).toBe('21%');
    expect(screenButton.style.width).toBe('30.6%');
    expect(screenButton.style.height).toBe('30.2%');

    // 3. Screen surface renders unique simple prompt 'CLICK SCREEN TO CONTINUE' (no logo image, no heavy overlay)
    expect(screenButton.querySelector('img')).not.toBeInTheDocument();
    expect(screen.queryByAltText(/^CineMorph$/i)).not.toBeInTheDocument();
    expect(screen.getByText(/CLICK SCREEN TO CONTINUE/i)).toBeInTheDocument();

    // 4. Absolute zero generic didactic / upload instructions on the landing lounge
    expect(screen.queryByText(/Upload/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Browse/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Select or Drop/i)).not.toBeInTheDocument();
  });

  it('triggers onTriggerFileInput when touching/clicking the screen area', () => {
    const onTriggerFileInput = vi.fn();
    render(<CinemaLounge {...defaultProps} onTriggerFileInput={onTriggerFileInput} />);

    const screenButton = screen.getByRole('button', {
      name: /Import local video or audio file into CineMorph theater/i,
    });
    fireEvent.click(screenButton);
    expect(onTriggerFileInput).toHaveBeenCalledTimes(1);
  });

  it('renders active media inside the physical screen surface when media is present', () => {
    const mockMedia: LocalMediaItem = {
      id: 'media-test-1',
      name: 'Interstellar 70mm',
      size: 2048576,
      type: 'video/mp4',
      url: 'blob:http://localhost:3000/media-blob-uuid',
      duration: 10800,
      progress: 0,
      lastWatchedAt: Date.now(),
      aspectRatio: '16:9',
    };

    render(<CinemaLounge {...defaultProps} activeMedia={mockMedia} />);

    const screenButton = screen.getByRole('button', {
      name: /Import local video or audio file into CineMorph theater/i,
    });
    const video = screenButton.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video?.getAttribute('src')).toBe(mockMedia.url);

    // Screen prompt replaced by the media video
    expect(screen.queryByAltText(/^CineMorph$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/CLICK SCREEN TO CONTINUE/i)).not.toBeInTheDocument();
  });
});
