import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AspectRatioMode, FramingRuleMode, useCineMorphStore } from './useCineMorphStore';
import { storageService, IDB_STORES } from '../services/storageService';
import { getVideosByIds } from '../lib/youtube';
import { extractYouTubeId } from '../lib/utils';

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
  tickets: MovieTicket[];
  isPrintingAnimationActive: boolean;
  animationCountdownSeconds: number;
  activeTicket: MovieTicket | null;
  saveTicketProgress: (ticket: Omit<MovieTicket, 'ticketId' | 'printedAt'>) => string;
  resumeFromTicket: (ticketId: string) => MovieTicket | null;
  removeTicket: (ticketId: string) => void;
  trigger10sPrintAnimation: (movie: {
    title: string;
    source: string;
    isLocal: boolean;
    file?: File;
  }) => Promise<void>;
  cancelPrintAnimation: () => void;
}

const STORAGE_KEY_TICKETS = 'omnistream-tickets-store';

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

export const useTicketStore = create<TicketStoreState>()(
  persist(
    (set, get) => ({
      tickets: [],
      isPrintingAnimationActive: false,
      animationCountdownSeconds: 0,
      activeTicket: null,

      saveTicketProgress: (ticketData: Omit<MovieTicket, 'ticketId' | 'printedAt'>): string => {
        const existing = get().tickets;
        const existingIndex = existing.findIndex(
          (t) => t.sourceUrl === ticketData.sourceUrl || (t.movieTitle === ticketData.movieTitle && t.isLocal === ticketData.isLocal)
        );

        let ticketId: string;
        let updatedTickets: MovieTicket[];

        if (existingIndex >= 0) {
          ticketId = existing[existingIndex].ticketId;
          const updatedTicket: MovieTicket = {
            ...existing[existingIndex],
            ...ticketData,
            ticketId,
            printedAt: Date.now(),
          };
          updatedTickets = [
            updatedTicket,
            ...existing.filter((_, idx) => idx !== existingIndex),
          ];
        } else {
          ticketId = `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const newTicket: MovieTicket = {
            ...ticketData,
            ticketId,
            printedAt: Date.now(),
            seatAssignment: ticketData.seatAssignment || generateSeatAssignment(),
          };
          updatedTickets = [newTicket, ...existing];
        }

        // Asynchronously persist heavy record to IndexedDB
        try {
          storageService.setIDB(IDB_STORES.TICKETS, updatedTickets[0]);
        } catch (e) {}

        set({
          tickets: updatedTickets,
          activeTicket: updatedTickets[0],
        });

        return ticketId;
      },

      resumeFromTicket: (ticketId: string): MovieTicket | null => {
        const ticket = get().tickets.find((t) => t.ticketId === ticketId);
        if (!ticket) return null;

        set({ activeTicket: ticket });

        // Sync with CineMorph store
        const cineMorph = useCineMorphStore.getState();
        cineMorph.setVideoSource({
          type: ticket.isLocal ? 'local' : 'youtube',
          url: ticket.sourceUrl,
          name: ticket.movieTitle,
          thumbnailUrl: ticket.thumbnailDataUrl,
          duration: ticket.durationSeconds,
        });
        cineMorph.setAspectRatio(ticket.aspectRatio);
        cineMorph.setFramingRule(ticket.framingRule);
        cineMorph.setPlaybackTimestamp(ticket.timestampSeconds);
        cineMorph.setIsPlaying(true);

        return ticket;
      },

      removeTicket: (ticketId: string) => {
        const updated = get().tickets.filter((t) => t.ticketId !== ticketId);
        try {
          storageService.removeIDB(IDB_STORES.TICKETS, ticketId);
        } catch (e) {}

        set({
          tickets: updated,
          activeTicket: get().activeTicket?.ticketId === ticketId ? null : get().activeTicket,
        });
      },

      trigger10sPrintAnimation: async (movie: {
        title: string;
        source: string;
        isLocal: boolean;
        file?: File;
      }) => {
        const cineMorph = useCineMorphStore.getState();
        let title = movie.title;
        let durationSeconds = 0;

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
              }
            }
          } catch (e) {
            console.warn('Failed to pre-fetch video details for ticket:', e);
          }
        } else if (movie.isLocal && movie.file) {
          try {
            durationSeconds = await new Promise<number>((resolve) => {
              const videoEl = document.createElement('video');
              videoEl.preload = 'metadata';
              videoEl.src = URL.createObjectURL(movie.file!);
              videoEl.onloadedmetadata = () => {
                resolve(Math.round(videoEl.duration));
                URL.revokeObjectURL(videoEl.src);
              };
              videoEl.onerror = () => {
                resolve(0);
              };
            });
          } catch (e) {}
        }

        // Create temporary active ticket
        const tempTicket: MovieTicket = {
          ticketId: `ticket_temp_${Date.now()}`,
          movieTitle: title,
          sourceUrl: movie.source,
          isLocal: movie.isLocal,
          aspectRatio: cineMorph.aspectRatio,
          framingRule: cineMorph.framingRule,
          timestampSeconds: 0,
          durationSeconds: durationSeconds,
          printedAt: Date.now(),
          seatAssignment: generateSeatAssignment(),
        };

        set({
          isPrintingAnimationActive: true,
          animationCountdownSeconds: 0,
          activeTicket: tempTicket,
        });

        // Load media into CineMorph player
        cineMorph.setVideoSource({
          type: movie.isLocal ? 'local' : 'youtube',
          url: movie.source,
          file: movie.file,
          name: title,
          duration: durationSeconds,
        });
        cineMorph.setIsPlaying(true);
      },

      cancelPrintAnimation: () => {
        set({
          isPrintingAnimationActive: false,
          animationCountdownSeconds: 0,
        });
      },
    }),
    {
      name: STORAGE_KEY_TICKETS,
      storage: {
        getItem: (name) => {
          const val = storageService.getLocal<any>(name, null);
          return val ? { state: val } : null;
        },
        setItem: (name, value) => {
          storageService.setLocal(name, value.state);
        },
        removeItem: (name) => {
          storageService.removeLocal(name);
        },
      },
    }
  )
);
