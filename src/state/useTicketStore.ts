import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AspectRatioMode, FramingRuleMode, useCineMorphStore } from './useCineMorphStore';
import { storageService, IDB_STORES } from '../services/storageService';

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
        const pendingTicket: MovieTicket = {
          ticketId: `ticket_pending_${Date.now()}`,
          movieTitle: movie.title,
          sourceUrl: movie.source,
          isLocal: movie.isLocal,
          aspectRatio: cineMorph.aspectRatio,
          framingRule: cineMorph.framingRule,
          timestampSeconds: 0,
          durationSeconds: 0,
          printedAt: Date.now(),
          seatAssignment: generateSeatAssignment(),
        };

        set({
          isPrintingAnimationActive: true,
          animationCountdownSeconds: 10,
          activeTicket: pendingTicket,
        });

        // Dispatch heads-up event for background pre-processing
        if (typeof window !== 'undefined') {
          try {
            window.dispatchEvent(
              new CustomEvent('omnistream:heads-up:start', {
                detail: { movie, aspectRatio: cineMorph.aspectRatio },
              })
            );
          } catch (e) {}
        }

        // Run countdown timer
        const timerDurationMs = 10000;
        const intervalMs = 1000;
        let elapsed = 0;

        await new Promise<void>((resolve) => {
          const interval = setInterval(() => {
            elapsed += intervalMs;
            const remaining = Math.max(0, 10 - Math.floor(elapsed / 1000));
            set({ animationCountdownSeconds: remaining });

            if (elapsed >= timerDurationMs) {
              clearInterval(interval);
              resolve();
            }
          }, intervalMs);
        });

        // Auto-save and register the torn ticket
        const ticketId = get().saveTicketProgress({
          movieTitle: movie.title,
          sourceUrl: movie.source,
          isLocal: movie.isLocal,
          aspectRatio: cineMorph.aspectRatio,
          framingRule: cineMorph.framingRule,
          timestampSeconds: 0,
          durationSeconds: 0,
        });

        const createdTicket = get().tickets.find((t) => t.ticketId === ticketId) || null;

        set({
          isPrintingAnimationActive: false,
          animationCountdownSeconds: 0,
          activeTicket: createdTicket,
        });

        // Load media into CineMorph player
        cineMorph.setVideoSource({
          type: movie.isLocal ? 'local' : 'youtube',
          url: movie.source,
          file: movie.file,
          name: movie.title,
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
