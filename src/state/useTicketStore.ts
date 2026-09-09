import { create } from 'zustand';
import { AspectRatioMode, FramingRuleMode, useCineMorphStore } from './useCineMorphStore';
import { getVideosByIds } from '../lib/youtube';
import { extractYouTubeId } from '../lib/utils';
import { posterService } from '../lib/cinemorph/posterService';

export interface MovieTicket {
  ticketId: string;
  movieTitle: string;
  sourceUrl: string;
  isLocal: boolean;
  aspectRatio: AspectRatioMode;
  framingRule: FramingRuleMode;
  timestampSeconds: number;
  durationSeconds: number;
  printedAt: number;
  thumbnailDataUrl?: string;
  seatAssignment?: string;
}

export interface TicketStoreState {
  activeTicket: MovieTicket | null;
  tickets: MovieTicket[]; // In-memory session ticket only (activeTicket ? [activeTicket] : [])
  isPrintingAnimationActive: boolean;
  animationCountdownSeconds: number;
  setActiveTicket: (ticket: MovieTicket | null) => void;
  clearActiveTicket: () => void;
  trigger10sPrintAnimation: (movie: {
    sessionId?: string;
    title: string;
    source: string;
    isLocal: boolean;
    file?: File;
    posterUrl?: string;
    thumbnailUrl?: string;
  }) => Promise<void>;
  cancelPrintAnimation: () => void;
}

function parseISO8601ToSeconds(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

function generateSeatAssignment(): string {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const row = rows[Math.floor(Math.random() * rows.length)];
  const seat = Math.floor(Math.random() * 18) + 1;
  return `ROW ${row} • SEAT ${seat}`;
}

export const useTicketStore = create<TicketStoreState>((set, get) => ({
  activeTicket: null,
  tickets: [],
  isPrintingAnimationActive: false,
  animationCountdownSeconds: 0,

  setActiveTicket: (ticket: MovieTicket | null) => {
    set({
      activeTicket: ticket,
      tickets: ticket ? [ticket] : [],
    });
    if (ticket) {
      useCineMorphStore.getState().setActiveSession({
        sessionId: ticket.ticketId,
        title: ticket.movieTitle,
        sourceUrl: ticket.sourceUrl,
        isLocal: ticket.isLocal,
        aspectRatio: ticket.aspectRatio,
        framingRule: ticket.framingRule,
        durationSeconds: ticket.durationSeconds,
        timestampSeconds: ticket.timestampSeconds,
        seatAssignment: ticket.seatAssignment,
        ticketId: ticket.ticketId,
        createdAt: ticket.printedAt,
        posterUrl: ticket.thumbnailDataUrl,
        thumbnailUrl: ticket.thumbnailDataUrl,
      });
    } else {
      useCineMorphStore.getState().clearActiveSession();
    }
  },

  clearActiveTicket: () => {
    set({
      activeTicket: null,
      tickets: [],
      isPrintingAnimationActive: false,
      animationCountdownSeconds: 0,
    });
    useCineMorphStore.getState().clearActiveSession();
  },

  trigger10sPrintAnimation: async (movie: {
    sessionId?: string;
    title: string;
    source: string;
    isLocal: boolean;
    file?: File;
    posterUrl?: string;
    thumbnailUrl?: string;
  }) => {
    const cineMorph = useCineMorphStore.getState();
    let title = movie.title;
    let durationSeconds = 0;
    let resolvedPosterUrl = movie.posterUrl || movie.thumbnailUrl || '/cinemorph_artwork.png';

    // Set initial staging state
    set({
      isPrintingAnimationActive: true,
      animationCountdownSeconds: 0,
    });

    if (!movie.isLocal) {
      try {
        const ytId = extractYouTubeId(movie.source);
        if (ytId) {
          const videos = await getVideosByIds([ytId]);
          if (videos && videos.length > 0) {
            title = videos[0].title;
            if (videos[0].duration) {
              durationSeconds = parseISO8601ToSeconds(videos[0].duration);
            }
            if (!movie.posterUrl && videos[0].thumbnails) {
              resolvedPosterUrl = videos[0].thumbnails.high || videos[0].thumbnails.medium || videos[0].thumbnails.default;
            }
          }
        }
      } catch (e) {
        console.warn('Failed to pre-fetch video details for ticket:', e);
      }
    }

    // If user cancelled while async resolution was running, abort
    if (!get().isPrintingAnimationActive) {
      return;
    }

    const canonicalTicketId = movie.sessionId || `ticket_session_${Date.now()}`;
    const seatAssignment = generateSeatAssignment();

    // Create temporary session ticket (in-memory only)
    const sessionTicket: MovieTicket = {
      ticketId: canonicalTicketId,
      movieTitle: title,
      sourceUrl: movie.source,
      isLocal: movie.isLocal,
      aspectRatio: cineMorph.aspectRatio,
      framingRule: cineMorph.framingRule,
      timestampSeconds: 0,
      durationSeconds: durationSeconds,
      printedAt: Date.now(),
      seatAssignment,
      thumbnailDataUrl: resolvedPosterUrl,
    };

    set({
      isPrintingAnimationActive: true,
      animationCountdownSeconds: 0,
      activeTicket: sessionTicket,
      tickets: [sessionTicket],
    });

    // Create unified CineMorphScreeningSession as single source of truth
    useCineMorphStore.getState().setActiveSession({
      sessionId: canonicalTicketId,
      title,
      sourceUrl: movie.source,
      isLocal: movie.isLocal,
      file: movie.file,
      posterUrl: resolvedPosterUrl,
      thumbnailUrl: resolvedPosterUrl,
      aspectRatio: cineMorph.aspectRatio,
      framingRule: cineMorph.framingRule,
      durationSeconds,
      timestampSeconds: 0,
      seatAssignment,
      ticketId: canonicalTicketId,
      createdAt: sessionTicket.printedAt,
    });

    // Load media into CineMorph player (staged, but playback paused until theater entry)
    cineMorph.setVideoSource({
      type: movie.isLocal ? 'local' : 'youtube',
      url: movie.source,
      file: movie.file,
      name: title,
      thumbnailUrl: resolvedPosterUrl,
      duration: durationSeconds,
    });
    cineMorph.setIsPlaying(true);

    // If remote, resolve poster in the background if not already high-res
    if (!movie.isLocal) {
      posterService.resolvePoster({
        sourceUrl: movie.source,
        isLocal: movie.isLocal,
        title: title,
        thumbnailUrl: movie.thumbnailUrl,
        posterUrl: movie.posterUrl || resolvedPosterUrl,
        duration: durationSeconds,
      }).then((res) => {
        const currentTicket = get().activeTicket;
        if (currentTicket && currentTicket.ticketId === sessionTicket.ticketId) {
          const updated = {
            ...currentTicket,
            thumbnailDataUrl: res.url,
          };
          set({
            activeTicket: updated,
            tickets: [updated],
          });
          useCineMorphStore.getState().updateActiveSession({
            posterUrl: res.url,
            thumbnailUrl: res.url,
          });
        }
      }).catch(() => {});
    }
  },

  cancelPrintAnimation: () => {
    set({
      isPrintingAnimationActive: false,
      animationCountdownSeconds: 0,
    });
  },
}));
