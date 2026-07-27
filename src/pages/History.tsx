import { useAppStore } from '../store';
import { VideoCard } from '../components/VideoCard';
import { Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function History() {
  const { history, clearHistory, removeFromHistory } = useAppStore();
  
  // Sort history items by watchedAt descending
  const historyItems = Object.values(history).sort((a, b) => b.watchedAt - a.watchedAt);

  if (historyItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
          <Trash2 className="w-8 h-8 text-[#938F99]" />
        </div>
        <h2 className="text-xl font-medium mb-2 text-[#E6E1E5]">Keep track of what you watch</h2>
        <p className="text-[#938F99] mb-6">Your watch history will appear here.</p>
        <Link to="/" className="px-6 py-3 bg-[#D0BCFF] hover:bg-[#EADDFF] text-[#381E72] font-semibold rounded-xl transition-colors">
          Explore Videos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-medium uppercase tracking-[0.2em] text-[#938F99]">Watch History</h1>
        <button 
          onClick={() => {
            if (confirm('Are you sure you want to clear your history?')) {
              clearHistory();
            }
          }}
          className="text-sm font-medium text-[#938F99] hover:text-red-400 transition-colors"
        >
          Clear all
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {historyItems.map(item => (
          <div key={item.video.id} className="group flex flex-col sm:flex-row gap-6 p-4 sm:p-0 bg-[#1C1B1F] sm:bg-transparent rounded-3xl sm:rounded-none border sm:border-none border-white/5">
            <div className="w-full sm:w-72 shrink-0">
              <VideoCard video={item.video} progress={item.progress} />
            </div>
            <div className="flex-1 flex justify-between items-start py-2">
              <div className="max-w-xl hidden sm:block">
                <p className="text-sm text-[#CAC4D0] mt-2 line-clamp-3 leading-relaxed">
                  {item.video.description}
                </p>
              </div>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  removeFromHistory(item.video.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-3 text-[#938F99] hover:text-red-400 transition-all rounded-full hover:bg-white/5"
                aria-label="Remove from history"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
