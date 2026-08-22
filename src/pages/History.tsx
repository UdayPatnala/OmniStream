import { useState } from 'react';
import { useAppStore } from '../store';
import { VideoCard } from '../components/VideoCard';
import { Trash2, BarChart2, Clock, CheckCircle2, Film } from 'lucide-react';
import { Link } from 'react-router-dom';
import { calculateUserStats } from '../lib/recommendations';

export function History() {
  const { history, subscriptions, collections, clearHistory, removeFromHistory } = useAppStore();
  const [filterTab, setFilterTab] = useState<'all' | 'unfinished' | 'completed'>('all');
  
  const historyItems = Object.values(history).sort((a, b) => b.watchedAt - a.watchedAt);
  const stats = calculateUserStats(history, subscriptions, collections);

  const filteredItems = historyItems.filter(item => {
    if (filterTab === 'unfinished') {
      return item.progress > 10 && item.duration > 0 && item.progress < item.duration * 0.9;
    }
    if (filterTab === 'completed') {
      return item.duration > 0 && item.progress >= item.duration * 0.9;
    }
    return true;
  });

  if (historyItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <div className="w-20 h-20 bg-[#272727] rounded-full flex items-center justify-center mb-6">
          <Trash2 className="w-8 h-8 text-[#aaaaaa]" />
        </div>
        <h2 className="text-xl font-bold mb-2 text-[#f1f1f1]">Keep track of what you watch</h2>
        <p className="text-[#aaaaaa] mb-6 text-sm">Your watch history and viewing statistics will appear here.</p>
        <Link to="/" className="px-6 py-2.5 bg-white text-black font-bold rounded-full transition-colors text-sm">
          Explore Videos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Personal Viewing Statistics Summary */}
      <div className="bg-[#272727] p-5 rounded-2xl border border-[#383838] space-y-4">
        <div className="flex items-center gap-2 border-b border-[#383838] pb-3">
          <BarChart2 className="w-5 h-5 text-red-500" />
          <h2 className="text-base font-bold text-[#f1f1f1]">Personal Viewing Statistics</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
          <div className="bg-[#1e1e1e] p-3.5 rounded-xl flex items-center gap-3">
            <Film className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <div className="text-lg font-bold text-[#f1f1f1]">{stats.totalWatched}</div>
              <div className="text-[11px] text-[#aaaaaa]">Videos Watched</div>
            </div>
          </div>

          <div className="bg-[#1e1e1e] p-3.5 rounded-xl flex items-center gap-3">
            <Clock className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-lg font-bold text-[#f1f1f1]">{stats.totalHours} hrs</div>
              <div className="text-[11px] text-[#aaaaaa]">Total Watch Time</div>
            </div>
          </div>

          <div className="bg-[#1e1e1e] p-3.5 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" />
            <div>
              <div className="text-lg font-bold text-[#f1f1f1]">{stats.completionRate}%</div>
              <div className="text-[11px] text-[#aaaaaa]">Completion Rate</div>
            </div>
          </div>

          <div className="bg-[#1e1e1e] p-3.5 rounded-xl flex items-center gap-3">
            <BarChart2 className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-lg font-bold text-[#f1f1f1]">{stats.subscriptionsCount}</div>
              <div className="text-[11px] text-[#aaaaaa]">Subscriptions</div>
            </div>
          </div>
        </div>
      </div>

      {/* History Header & List with Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#272727] pb-3 pt-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-[#f1f1f1]">Watch History</h1>
          <div className="flex items-center gap-1.5 ml-4">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                filterTab === 'all' ? 'bg-white text-black' : 'bg-[#272727] text-gray-300 hover:bg-[#333]'
              }`}
            >
              All ({historyItems.length})
            </button>
            <button
              onClick={() => setFilterTab('unfinished')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                filterTab === 'unfinished' ? 'bg-cyan-500 text-black' : 'bg-[#272727] text-gray-300 hover:bg-[#333]'
              }`}
            >
              In Progress ({historyItems.filter(h => h.progress > 10 && h.duration > 0 && h.progress < h.duration * 0.9).length})
            </button>
            <button
              onClick={() => setFilterTab('completed')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                filterTab === 'completed' ? 'bg-purple-500 text-white' : 'bg-[#272727] text-gray-300 hover:bg-[#333]'
              }`}
            >
              Completed ({historyItems.filter(h => h.duration > 0 && h.progress >= h.duration * 0.9).length})
            </button>
          </div>
        </div>

        <button 
          onClick={() => {
            if (confirm('Are you sure you want to clear your history?')) {
              clearHistory();
            }
          }}
          className="text-xs font-semibold text-[#aaaaaa] hover:text-red-400 transition-colors self-start sm:self-auto"
        >
          Clear all history
        </button>
      </div>

      <div className="space-y-4">
        {filteredItems.map(item => (
          <div key={item.video.id} className="group flex flex-col sm:flex-row gap-4 p-3 bg-[#1e1e1e] hover:bg-[#272727] rounded-2xl transition-colors relative">
            <div className="w-full sm:w-64 shrink-0">
              <VideoCard video={item.video} progress={item.progress} />
            </div>
            <div className="flex-1 flex justify-between items-start pt-1">
              <div className="max-w-xl hidden sm:block">
                <p className="text-xs text-[#aaaaaa] line-clamp-3 leading-relaxed">
                  {item.video.description}
                </p>
              </div>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  removeFromHistory(item.video.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-2 text-[#aaaaaa] hover:text-red-400 transition-all rounded-full hover:bg-white/10"
                aria-label="Remove from history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

