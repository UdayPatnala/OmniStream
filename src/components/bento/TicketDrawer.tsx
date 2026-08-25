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
      className={`relative overflow-hidden rounded-3xl border border-amber-200 bg-[#FDFBF7] p-6 sm:p-7 shadow-sm transition-all ${className}`}
    >
      <div className="flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-200/80 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800 border border-amber-300 shadow-sm">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-slate-900">
                  Torn Admission Tickets Shelf
                </h3>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-mono font-bold text-amber-900 border border-amber-300">
                  {tickets.length} SAVED
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Click any torn ticket stub to resume theater playback instantly
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[10px] font-mono font-bold uppercase text-amber-900 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300 shadow-sm">
              1-Click State Recovery
            </span>
          </div>
        </div>

        {/* Tickets Grid / List */}
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-amber-300 bg-white/80 py-8 px-4 text-center">
            <Clapperboard className="h-10 w-10 text-amber-400 mb-2" />
            <div className="text-sm font-bold text-slate-800">Admission Drawer Empty</div>
            <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
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
                  className="group relative cursor-pointer rounded-2xl border border-amber-200/90 bg-white hover:bg-amber-50/40 p-4 transition-all duration-200 hover:border-amber-400 hover:shadow-md flex flex-col justify-between"
                >
                  {/* Diegetic Perforated Edge Notches */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2.5 h-5 bg-[#FDFBF7] rounded-r-full border-r border-amber-200" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-5 bg-[#FDFBF7] rounded-l-full border-l border-amber-200" />

                  <div>
                    {/* Top Row: Title & Remove */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                            {ticket.aspectRatio}
                          </span>
                          <span className="text-[10px] font-mono font-medium text-slate-500">
                            {ticket.seatAssignment || 'ORCHESTRA ROW A'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 truncate mt-1.5 group-hover:text-amber-800 transition-colors">
                          {ticket.movieTitle}
                        </h4>
                      </div>

                      <button
                        onClick={(e) => handleRemove(e, ticket.ticketId)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Tear & Discard Ticket"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Progress details */}
                    <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-600">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock className="h-3 w-3 text-amber-600" />
                        <span>{formatTime(ticket.timestampSeconds)}</span>
                        {ticket.durationSeconds > 0 && (
                          <span className="text-slate-400">/ {formatTime(ticket.durationSeconds)}</span>
                        )}
                      </div>
                      <span className="text-amber-800 font-bold">{progressPct}% saved</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2 h-1.5 w-full rounded-full bg-amber-100 overflow-hidden border border-amber-200">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(5, progressPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Resume CTA */}
                  <div className="mt-3 pt-2.5 border-t border-amber-100 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-400 font-medium uppercase">
                      {ticket.isLocal ? 'LOCAL MP4 FILE' : 'YOUTUBE STREAM'}
                    </span>
                    <div className="flex items-center gap-1 text-amber-800 font-bold group-hover:translate-x-0.5 transition-transform">
                      <span>RESUME</span>
                      <Play className="h-2.5 w-2.5 fill-amber-800" />
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
