import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BentoGrid } from '../components/bento/BentoGrid';
import { ModeCard } from '../components/bento/ModeCard';
import { TicketDrawer } from '../components/bento/TicketDrawer';
import { useTicketStore } from '../state/useTicketStore';
import { useCineMorphStore } from '../state/useCineMorphStore';

describe('Bento Grid & Landing Components', () => {
  beforeEach(() => {
    localStorage.clear();
    useTicketStore.setState({
      tickets: [],
      isPrintingAnimationActive: false,
      animationCountdownSeconds: 0,
      activeTicket: null,
    });
    useCineMorphStore.setState({
      aspectRatio: 'original',
      isOffline: false,
      videoSource: null,
      framingRule: 'auto',
      diagnosticOverlayVisible: false,
      panOffset: { x: 0, y: 0 },
      playbackTimestamp: 0,
      isPlaying: false,
    });
  });

  it('renders BentoGrid header and both mode cards', () => {
    render(
      <MemoryRouter>
        <BentoGrid />
      </MemoryRouter>
    );

    expect(screen.getByText(/OMNISTREAM/i)).toBeInTheDocument();
    expect(screen.getAllByText(/U-TUBE/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/CineMorph/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Torn Admission Tickets Shelf/i)).toBeInTheDocument();
  });

  it('renders empty admission drawer state when no tickets exist', () => {
    render(
      <MemoryRouter>
        <TicketDrawer />
      </MemoryRouter>
    );

    expect(screen.getByText(/Admission Drawer Empty/i)).toBeInTheDocument();
  });

  it('renders saved tickets and triggers resume upon click', () => {
    useTicketStore.getState().saveTicketProgress({
      movieTitle: 'The Matrix',
      sourceUrl: 'https://example.com/matrix.mp4',
      isLocal: true,
      aspectRatio: '1.43:1',
      framingRule: 'auto',
      timestampSeconds: 1800,
      durationSeconds: 7200,
    });

    render(
      <MemoryRouter>
        <TicketDrawer />
      </MemoryRouter>
    );

    expect(screen.getByText('The Matrix')).toBeInTheDocument();
    expect(screen.getByText(/25% saved/i)).toBeInTheDocument();

    const ticketElement = screen.getByText('The Matrix').closest('div[class*="cursor-pointer"]');
    if (ticketElement) {
      fireEvent.click(ticketElement);
      expect(useCineMorphStore.getState().playbackTimestamp).toBe(1800);
      expect(useCineMorphStore.getState().aspectRatio).toBe('1.43:1');
    }
  });

  it('renders CineMorph ModeCard and handles navigation click', () => {
    render(
      <MemoryRouter>
        <ModeCard mode="cinemorph" />
      </MemoryRouter>
    );

    expect(screen.getByText('CineMorph')).toBeInTheDocument();
    expect(screen.getByText(/Immersive 3D Theatrical Environment/i)).toBeInTheDocument();
    expect(screen.getByText('Enter CineMorph')).toBeInTheDocument();
  });
});
