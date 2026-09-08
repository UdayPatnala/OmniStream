import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ticket,
  Play,
  Clock,
  Clapperboard,
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

function formatRuntimeDisplay(durationSecs: number, timestampSecs: number): string {
  if (!durationSecs || durationSecs <= 0) {
    if (timestampSecs > 0) return `${formatTime(timestampSecs)} watched`;
    return 'Feature Film';
  }
  const hours = Math.floor(durationSecs / 3600);
  const minutes = Math.floor((durationSecs % 3600) / 60);
  const seconds = Math.floor(durationSecs % 60);

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds > 0 ? `${seconds}s` : ''}`;
  return `${seconds}s`;
}

export const TicketDrawer: React.FC<TicketDrawerProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const activeTicket = useTicketStore((state) => state?.activeTicket);

  const handleResumeTicket = (ticket: MovieTicket) => {
    if (ticket.isLocal) {
      navigate('/cinemorph');
    } else {
      const match = ticket.sourceUrl.match(/(?:v=|youtu\.be\/|\/watch\?v=)([^&?/]+)/);
      const videoId = match ? match[1] : 'stream';
      navigate(`/theater/${videoId}`);
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-cinemorph-border bg-cinemorph-card p-6 sm:p-7 shadow-sm transition-all ${className}`}
    >
      <div className="flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cinemorph-border pb-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cinemorph-surface text-cinemorph-primary border border-cinemorph-border shadow-sm">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-wide text-cinemorph-text font-cinematic-title uppercase">
                  Admission Ticket
                </h3>
                {activeTicket && (
                  <span className="rounded-full bg-cinemorph-surface px-2.5 py-0.5 text-[10px] font-mono font-bold text-cinemorph-primary border border-cinemorph-border">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-cinemorph-text-muted font-medium font-cinematic">
                Click the ticket stub to return to theater playback
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[10px] font-mono font-bold uppercase text-cinemorph-primary bg-cinemorph-surface px-2.5 py-1 rounded-lg border border-cinemorph-border shadow-sm">
              1-Click Resume
            </span>
          </div>
        </div>

        {/* Ticket / Empty State */}
        {!activeTicket ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cinemorph-border bg-cinemorph-surface/50 py-8 px-4 text-center">
            <Clapperboard className="h-10 w-10 text-cinemorph-primary/60 mb-2" />
            <div className="text-sm font-bold text-cinemorph-text font-cinematic">No Active Session</div>
            <p className="text-xs text-cinemorph-text-muted max-w-sm mt-1 leading-relaxed font-cinematic">
              Load a movie in CineMorph to print an admission ticket. Your session will appear here.
            </p>
          </div>
        ) : (() => {
          const ticket = activeTicket;
          const progressPct =
            ticket.durationSeconds > 0
              ? Math.min(100, Math.round((ticket.timestampSeconds / ticket.durationSeconds) * 100))
              : 0;
          const runtimeDisplay = formatRuntimeDisplay(ticket.durationSeconds, ticket.timestampSeconds);

          return (
            <div
              onClick={() => handleResumeTicket(ticket)}
              className="group relative cursor-pointer rounded-2xl border border-cinemorph-border bg-cinemorph-surface hover:bg-cinemorph-surface/80 p-4 transition-all duration-200 hover:border-cinemorph-primary hover:shadow-md flex flex-col justify-between"
            >
              {/* Diegetic Perforated Edge Notches */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2.5 h-5 bg-cinemorph-card rounded-r-full border-r border-cinemorph-border" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-5 bg-cinemorph-card rounded-l-full border-l border-cinemorph-border" />

              <div>
                {/* Top Row: Title */}
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cinemorph-surface text-cinemorph-primary font-bold border border-cinemorph-border">
                        {ticket.aspectRatio}
                      </span>
                      <span className="text-[10px] font-mono font-medium text-cinemorph-text-muted">
                        {ticket.seatAssignment || 'ORCHESTRA ROW A'}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-cinemorph-text truncate mt-1.5 group-hover:text-cinemorph-primary transition-colors font-cinematic tracking-wide">
                      {ticket.movieTitle}
                    </h4>
                  </div>
                </div>

                {/* Progress details */}
                <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-cinemorph-text-secondary">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Clock className="h-3 w-3 text-cinemorph-primary" />
                    <span>{formatTime(ticket.timestampSeconds)}</span>
                    {ticket.durationSeconds > 0 && (
                      <span className="text-cinemorph-text-muted">/ {runtimeDisplay}</span>
                    )}
                  </div>
                  <span className="text-cinemorph-primary font-bold">{progressPct}% watched</span>
                </div>

                {/* Progress Bar */}
                <div className="mt-2 h-1.5 w-full rounded-full bg-cinemorph-card overflow-hidden border border-cinemorph-border">
                  <div
                    className="h-full bg-cinemorph-primary rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(5, progressPct)}%` }}
                  />
                </div>
              </div>

              {/* Resume CTA */}
              <div className="mt-3 pt-2.5 border-t border-cinemorph-border flex items-center justify-between text-[10px] font-mono">
                <span className="text-cinemorph-text-muted font-medium uppercase">
                  {ticket.isLocal ? 'LOCAL MP4 FILE' : 'YOUTUBE STREAM'}
                </span>
                <div className="flex items-center gap-1 text-cinemorph-primary font-bold group-hover:translate-x-0.5 transition-transform">
                  <span>RESUME</span>
                  <Play className="h-2.5 w-2.5 fill-cinemorph-primary" />
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
