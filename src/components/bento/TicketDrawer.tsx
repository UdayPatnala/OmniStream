import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ticket,
  Play,
  Trash2,
  Clock,
  Clapperboard,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { useTicketStore, MovieTicket } from '../../state/useTicketStore';

interface TicketDrawerProps {
  className?: string;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

export const TicketDrawer: React.FC<TicketDrawerProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const { tickets, resumeFromTicket, removeTicket } = useTicketStore();

  const handleResumeTicket = (ticket: MovieTicket) => {
    resumeFromTicket(ticket.ticketId);
    if (ticket.isLocal) {
      navigate('/theater/local-playback');
    } else {
      const match = ticket.sourceUrl.match(/(?:v=|youtu\.be\/|\/watch\?v=)([^&?/]+)/);
      const videoId = match ? match[1] : 'stream';
      navigate(`/theater/${videoId}`);
    }
  };

  const handleRemove = (e: React.MouseEvent, ticketId: string) => {
    e.stopPropagation();
    removeTicket(ticketId);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-[#1b140d] via-[#100d08] to-[#0a0704] p-6 shadow-2xl ${className}`}
    >
      {/* Vintage Paper / Ticket Aesthetic Texture */}
      <div className="flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-900/30 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-wide text-white">
                  Torn Admission Tickets Shelf
                </h3>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300 border border-amber-500/30">
                  {tickets.length} SAVED
                </span>
              </div>
              <p className="text-[11px] text-amber-200/60 font-mono">
                Click any torn ticket stub to resume theater playback instantly
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[10px] font-mono uppercase text-amber-400/80 bg-amber-950/40 px-2 py-1 rounded-lg border border-amber-800/40">
              1-Click State Recovery
            </span>
          </div>
        </div>

        {/* Tickets Grid / List */}
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-amber-500/20 bg-black/30 py-8 px-4 text-center">
            <Clapperboard className="h-10 w-10 text-amber-500/40 mb-2" />
            <div className="text-sm font-bold text-white">Admission Drawer Empty</div>
            <p className="text-xs text-gray-400 max-w-sm mt-1">
              Start playing a movie in CineMorph to print your first vintage admission ticket. Your exact playback timestamp will be preserved here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
            {tickets.map((ticket) => {
              const progressPct =
                ticket.durationSeconds > 0
                  ? Math.min(100, Math.round((ticket.timestampSeconds / ticket.durationSeconds) * 100))
                  : 0;

              return (
                <div
                  key={ticket.ticketId}
                  onClick={() => handleResumeTicket(ticket)}
                  className="group relative cursor-pointer rounded-2xl border border-amber-500/30 bg-[#161009] hover:bg-[#20180d] p-4 transition-all duration-200 hover:border-amber-400/70 hover:shadow-lg hover:shadow-amber-950/40 flex flex-col justify-between"
                >
                  {/* Diegetic Perforated Edge Mock */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-4 bg-[#0a0704] rounded-r-full border-r border-amber-500/30" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-4 bg-[#0a0704] rounded-l-full border-l border-amber-500/30" />

                  <div>
                    {/* Top Row: Title & Remove */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                            {ticket.aspectRatio}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">
                            {ticket.seatAssignment || 'ORCHESTRA ROW A'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white truncate mt-1.5 group-hover:text-amber-300 transition-colors">
                          {ticket.movieTitle}
                        </h4>
                      </div>

                      <button
                        onClick={(e) => handleRemove(e, ticket.ticketId)}
                        className="rounded-lg p-1.5 text-gray-500 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
                        title="Tear & Discard Ticket"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Progress details */}
                    <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-gray-300">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-amber-400" />
                        <span>{formatTime(ticket.timestampSeconds)}</span>
                        {ticket.durationSeconds > 0 && (
                          <span className="text-gray-500">/ {formatTime(ticket.durationSeconds)}</span>
                        )}
                      </div>
                      <span className="text-amber-400 font-bold">{progressPct}% saved</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2 h-1.5 w-full rounded-full bg-black/60 overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(5, progressPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Resume CTA */}
                  <div className="mt-3 pt-2.5 border-t border-amber-900/30 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-gray-400">
                      {ticket.isLocal ? 'LOCAL MP4 FILE' : 'YOUTUBE STREAM'}
                    </span>
                    <div className="flex items-center gap-1 text-amber-400 font-bold group-hover:translate-x-0.5 transition-transform">
                      <span>RESUME</span>
                      <Play className="h-2.5 w-2.5 fill-amber-400" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
