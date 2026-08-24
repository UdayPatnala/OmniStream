import re

with open('src/pages/CineMorphLanding.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add useTicketStore hook
content = content.replace('const navigate = useNavigate();', 'const navigate = useNavigate();\n  const tickets = useTicketStore(state => state.tickets);')

# Inject ticket stubs section
insertion_point = '''      </div>

      <div className="absolute bottom-6 font-mono text-[10px] text-amber-900/40 tracking-[0.3em] uppercase flex items-center gap-3 font-bold">'''

stubs_html = '''        {/* Torn Tickets / Continue Watching */}
        {tickets.length > 0 && (
          <div className="w-full max-w-2xl mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-2 mb-4 px-2">
              <Ticket className="w-4 h-4 text-amber-700" />
              <h3 className="text-xs font-bold text-amber-900 tracking-[0.2em] uppercase">My Stubs</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tickets.slice(0, 4).map(ticket => (
                <div 
                  key={ticket.ticketId}
                  onClick={async () => {
                    const resumed = useTicketStore.getState().resumeFromTicket(ticket.ticketId);
                    if (resumed) {
                      await useTicketStore.getState().trigger10sPrintAnimation({
                        title: ticket.movieTitle,
                        source: ticket.sourceUrl,
                        isLocal: ticket.isLocal
                      });
                      navigate(ticket.isLocal ? /theater/ : /theater/);
                    }
                  }}
                  className="group relative bg-white border border-amber-200 hover:border-amber-400 p-3 rounded-2xl flex items-center gap-4 cursor-pointer transition-all shadow-sm hover:shadow-md"
                >
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100 group-hover:scale-105 transition-transform">
                    {ticket.isLocal ? <HardDrive className="w-5 h-5 text-amber-700" /> : <Film className="w-5 h-5 text-amber-700" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-amber-950 truncate">{ticket.movieTitle}</h4>
                    <p className="text-[10px] font-mono text-amber-700 mt-1">{ticket.seatAssignment}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <div className="absolute bottom-6 font-mono text-[10px] text-amber-900/40 tracking-[0.3em] uppercase flex items-center gap-3 font-bold">'''

content = content.replace(insertion_point, stubs_html)

with open('src/pages/CineMorphLanding.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
