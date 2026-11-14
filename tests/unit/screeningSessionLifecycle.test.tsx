import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useTicketStore } from '@omnistream/cinemorph/ticketing/useTicketStore';
import { useCineMorphStore } from '@omnistream/cinemorph/state/useCineMorphStore';
import { useAppStore } from '@/src/store';
import { CineMorphTheater } from '@omnistream/cinemorph/pages/CineMorphTheater';

describe('CineMorph Screening Session Lifecycle & Zero False Error State', () => {
  beforeEach(() => {
    useTicketStore.setState({
      tickets: [],
      activeTicket: null,
      isPrintingAnimationActive: false,
      animationCountdownSeconds: 0,
    });
    useCineMorphStore.setState({
      aspectRatio: 'original',
      framingRule: 'auto',
      playbackTimestamp: 0,
      isPlaying: false,
      videoSource: null,
      activeSession: null,
    });
    useAppStore.setState({
      activeLocalMedia: null,
      localMediaHistory: {},
    });
  });

  it('T-LIFE-01: activeSession is created synchronously and becomes single source of truth', async () => {
    const sessionId = 'local-1788931220000-abcde';
    await useTicketStore.getState().trigger10sPrintAnimation({
      sessionId,
      title: 'One Piece Heroines',
      source: 'blob:http://localhost/mock-video-stream',
      isLocal: true,
      posterUrl: '/cinemorph_artwork.png',
    });

    const session = useCineMorphStore.getState().activeSession;
    const ticket = useTicketStore.getState().activeTicket;

    expect(session).not.toBeNull();
    expect(session?.sessionId).toBe(sessionId);
    expect(session?.title).toBe('One Piece Heroines');
    expect(session?.sourceUrl).toBe('blob:http://localhost/mock-video-stream');
    expect(session?.isLocal).toBe(true);

    expect(ticket?.ticketId).toBe(sessionId);
  });

  it('T-LIFE-02: CineMorphTheater renders with activeSession without showing false NO ACTIVE SCREENING SESSION', async () => {
    const sessionId = 'local-valid-session-999';
    const mockSourceUrl = 'blob:http://localhost/mock-video-stream';

    // Mock global fetch for blob probe
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === mockSourceUrl) {
        return Promise.resolve({
          ok: true,
          status: 200,
          type: 'basic',
          body: { cancel: vi.fn() },
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
    });

    // Create session in-memory
    await useTicketStore.getState().trigger10sPrintAnimation({
      sessionId,
      title: 'Dune: Part Two',
      source: mockSourceUrl,
      isLocal: true,
      posterUrl: '/cinemorph_artwork.png',
    });

    useAppStore.getState().setActiveLocalMedia({
      id: sessionId,
      name: 'Dune: Part Two',
      size: 1048576,
      type: 'video/mp4',
      url: mockSourceUrl,
      duration: 120,
      progress: 0,
      lastWatchedAt: Date.now(),
      aspectRatio: '16:9',
      thumbnail: '/cinemorph_artwork.png',
    });

    render(
      <MemoryRouter initialEntries={[`/theater/${sessionId}`]}>
        <Routes>
          <Route path="/theater/:id" element={<CineMorphTheater />} />
        </Routes>
      </MemoryRouter>
    );

    // Ensure "No Active Screening Session" error is NOT rendered
    await waitFor(() => {
      expect(screen.queryByText(/NO ACTIVE SCREENING SESSION/i)).toBeNull();
    });

    // Clean up mock
    global.fetch = originalFetch;
  });

  it('T-LIFE-03: CineMorphTheater correctly shows error state only when session is truly absent and URL is dead', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation(() => Promise.reject(new Error('Revoked blob')));

    render(
      <MemoryRouter initialEntries={['/theater/local-dead-session']}>
        <Routes>
          <Route path="/theater/:id" element={<CineMorphTheater />} />
        </Routes>
      </MemoryRouter>
    );

    // When session is dead/revoked, it cleanly shows No Active Screening Session
    await waitFor(() => {
      expect(screen.getByText(/NO ACTIVE SCREENING SESSION/i)).toBeInTheDocument();
      expect(screen.getByText(/Return to Booking Office/i)).toBeInTheDocument();
    });

    global.fetch = originalFetch;
  });

  it('T-LIFE-04: CineMorphTheater revokes active blob URLs and releases video resources upon unmount', async () => {
    const mockRevoke = vi.fn();
    const originalRevoke = URL.revokeObjectURL;
    URL.revokeObjectURL = mockRevoke;

    const sessionId = 'local-unmount-session-123';
    const mockBlobUrl = 'blob:http://localhost/unmount-blob-url-test';

    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === mockBlobUrl) {
        return Promise.resolve({
          ok: true,
          status: 200,
          type: 'basic',
          body: { cancel: vi.fn() },
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
    });

    await useTicketStore.getState().trigger10sPrintAnimation({
      sessionId,
      title: 'Blade Runner',
      source: mockBlobUrl,
      isLocal: true,
      posterUrl: '/cinemorph_artwork.png',
    });

    useAppStore.getState().setActiveLocalMedia({
      id: sessionId,
      name: 'Blade Runner',
      size: 1048576,
      type: 'video/mp4',
      url: mockBlobUrl,
      duration: 120,
      progress: 0,
      lastWatchedAt: Date.now(),
      aspectRatio: '16:9',
      thumbnail: '/cinemorph_artwork.png',
    });

    const { unmount } = render(
      <MemoryRouter initialEntries={[`/theater/${sessionId}`]}>
        <Routes>
          <Route path="/theater/:id" element={<CineMorphTheater />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/NO ACTIVE SCREENING SESSION/i)).toBeNull();
    });

    // Unmount theater component (simulates browser back, header navigation, or routing change)
    unmount();

    // Invariant: URL.revokeObjectURL MUST have been called to free multi-GB media memory
    expect(mockRevoke).toHaveBeenCalledWith(mockBlobUrl);

    global.fetch = originalFetch;
    URL.revokeObjectURL = originalRevoke;
  });
});
