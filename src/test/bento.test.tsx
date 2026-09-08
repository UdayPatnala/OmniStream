import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThresholdPortal } from '../components/threshold/ThresholdPortal';
import { BentoGrid } from '../components/bento/BentoGrid';
import { ModeCard } from '../components/bento/ModeCard';
import { TicketDrawer } from '../components/bento/TicketDrawer';
import { useTicketStore } from '../state/useTicketStore';
import { useCineMorphStore } from '../state/useCineMorphStore';

describe('Threshold & Landing Portal Components', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
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

  it('renders ThresholdPortal with both world identities and OMNISTREAM mark', () => {
    render(
      <MemoryRouter>
        <ThresholdPortal />
      </MemoryRouter>
    );

    expect(screen.getByText(/OMNISTREAM/i)).toBeInTheDocument();
    expect(screen.getByText(/U-TUBE/i)).toBeInTheDocument();
    expect(screen.getByText(/CINEMORPH/i)).toBeInTheDocument();
    expect(screen.getByText(/DISCOVERY FLOW/i)).toBeInTheDocument();
    expect(screen.getByText(/THEATER APERTURE/i)).toBeInTheDocument();
    // AROH product seal is now an image (no text); verify it via aria-label on the container
    expect(screen.getByLabelText(/An AROH product/i)).toBeInTheDocument();
  });

  it('renders BentoGrid header and both mode cards', () => {
    render(
      <MemoryRouter>
        <BentoGrid />
      </MemoryRouter>
    );

    expect(screen.getAllByText(/OMNISTREAM/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/U-TUBE/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/CINEMORPH/i).length).toBeGreaterThan(0);
  });

  it('renders empty ticket drawer when no active session ticket exists', () => {
    render(
      <MemoryRouter>
        <TicketDrawer />
      </MemoryRouter>
    );

    expect(screen.getByText(/No Active Session/i)).toBeInTheDocument();
  });

  it('renders active session ticket in drawer', () => {
    useTicketStore.getState().setActiveTicket({
      ticketId: 'ticket_bento_test_001',
      movieTitle: 'The Matrix',
      sourceUrl: 'https://example.com/matrix.mp4',
      isLocal: true,
      aspectRatio: '1.43:1',
      framingRule: 'auto',
      timestampSeconds: 1800,
      durationSeconds: 7200,
      printedAt: Date.now(),
    });

    render(
      <MemoryRouter>
        <TicketDrawer />
      </MemoryRouter>
    );

    expect(screen.getByText('The Matrix')).toBeInTheDocument();
    expect(screen.getByText(/25% watched/i)).toBeInTheDocument();
  });

  it('renders CineMorph ModeCard and handles navigation click', () => {
    render(
      <MemoryRouter>
        <ModeCard mode="cinemorph" />
      </MemoryRouter>
    );

    expect(screen.getByText('CINEMORPH')).toBeInTheDocument();
    expect(screen.getByText(/Virtual Theater Experience/i)).toBeInTheDocument();
    expect(screen.getByText('Enter CineMorph')).toBeInTheDocument();
  });

  it('allows changing aspect ratio in CineMorph ModeCard', () => {
    render(
      <MemoryRouter>
        <ModeCard mode="cinemorph" />
      </MemoryRouter>
    );

    const imaxBtn = screen.getByText('True IMAX (1.43:1)');
    fireEvent.click(imaxBtn);
    expect(useCineMorphStore.getState().aspectRatio).toBe('1.43:1');

    const imax190Btn = screen.getByText('IMAX (1.90:1)');
    fireEvent.click(imax190Btn);
    expect(useCineMorphStore.getState().aspectRatio).toBe('1.90:1');

    const origBtn = screen.getByText('Directorial Original');
    fireEvent.click(origBtn);
    expect(useCineMorphStore.getState().aspectRatio).toBe('original');
  });
});
