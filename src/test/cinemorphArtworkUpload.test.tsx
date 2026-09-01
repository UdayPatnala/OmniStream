import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CineMorphLanding } from '../pages/CineMorphLanding';
import { useTicketStore } from '../state/useTicketStore';
import { useAppStore } from '../store';

vi.mock('../state/useTicketStore', () => ({
  useTicketStore: Object.assign(
    vi.fn((selector) => selector({ tickets: [] })),
    {
      getState: () => ({
        tickets: [],
        trigger10sPrintAnimation: vi.fn().mockResolvedValue(undefined),
        resumeFromTicket: vi.fn(),
      }),
    }
  ),
}));

describe('CineMorph Artwork Interactive File Picker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ localMediaHistory: {} });
  });

  it('renders the CineMorph artwork image as the primary accessible file picker button', () => {
    render(
      <MemoryRouter>
        <CineMorphLanding />
      </MemoryRouter>
    );

    // Verified: The CineMorph artwork image is rendered
    const artworkImg = screen.getByAltText(/CineMorph AI/i);
    expect(artworkImg).toBeInTheDocument();
    expect(artworkImg).toHaveAttribute('src', '/cinemorph_artwork.png');

    // Verified: Accessible button role wraps the artwork
    const pickerButton = screen.getByRole('button', {
      name: /Import local video or audio file into CineMorph theater/i,
    });
    expect(pickerButton).toBeInTheDocument();
    expect(pickerButton).toContainElement(artworkImg);

    // Verified: No old generic "Browse Local Media" button exists
    expect(screen.queryByText(/Browse Local Media/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Select or Drop Local Media/i)).not.toBeInTheDocument();
  });

  it('triggers the hidden file input when clicking the artwork', () => {
    render(
      <MemoryRouter>
        <CineMorphLanding />
      </MemoryRouter>
    );

    const pickerButton = screen.getByRole('button', {
      name: /Import local video or audio file into CineMorph theater/i,
    });
    const hiddenFileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    expect(hiddenFileInput).toBeInTheDocument();
    const clickSpy = vi.spyOn(hiddenFileInput, 'click');

    fireEvent.click(pickerButton);
    expect(clickSpy).toHaveBeenCalled();
  });

  it('shows graceful error for unsupported file formats', async () => {
    render(
      <MemoryRouter>
        <CineMorphLanding />
      </MemoryRouter>
    );

    const hiddenFileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const invalidFile = new File(['dummy content'], 'document.pdf', { type: 'application/pdf' });

    fireEvent.change(hiddenFileInput, {
      target: { files: [invalidFile] },
    });

    await waitFor(() => {
      expect(screen.getByText(/Unsupported format \(\.pdf\)/i)).toBeInTheDocument();
    });
  });
});
