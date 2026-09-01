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
        <div className="w-20 h-20 bg-utube-surface border border-utube-border rounded-3xl flex items-center justify-center mb-6 shadow-sm">
          <Trash2 className="w-8 h-8 text-utube-text-muted" />
        </div>
        <h2 className="text-xl font-black mb-2 text-utube-text tracking-tight">Keep track of what you watch</h2>
        <Link to="/home" className="px-6 py-2.5 bg-utube-primary hover:bg-utube-secondary text-white font-bold rounded-full transition-all text-xs uppercase tracking-wider shadow-sm">
          Explore Videos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Personal Viewing Statistics Summary */}
      <div className="bg-utube-card p-6 rounded-3xl border border-utube-border space-y-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-utube-border pb-3.5">
          <BarChart2 className="w-5 h-5 text-utube-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-utube-text">Personal Viewing Statistics</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
          <div className="bg-utube-surface p-4 rounded-2xl border border-utube-border/60 flex items-center gap-3">
            <Film className="w-5 h-5 text-blue-500 shrink-0" />
            <div>
              <div className="text-xl font-black text-utube-text">{stats.totalWatched}</div>
              <div className="text-[11px] font-medium text-utube-text-muted">Videos Watched</div>
            </div>
          </div>

          <div className="bg-utube-surface p-4 rounded-2xl border border-utube-border/60 flex items-center gap-3">
            <Clock className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <div className="text-xl font-black text-utube-text">{stats.totalHours} hrs</div>
              <div className="text-[11px] font-medium text-utube-text-muted">Total Watch Time</div>
            </div>
          </div>

          <div className="bg-utube-surface p-4 rounded-2xl border border-utube-border/60 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" />
            <div>
              <div className="text-xl font-black text-utube-text">{stats.completionRate}%</div>
              <div className="text-[11px] font-medium text-utube-text-muted">Completion Rate</div>
            </div>
          </div>

          <div className="bg-utube-surface p-4 rounded-2xl border border-utube-border/60 flex items-center gap-3">
            <BarChart2 className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <div className="text-xl font-black text-utube-text">{stats.subscriptionsCount}</div>
              <div className="text-[11px] font-medium text-utube-text-muted">Subscriptions</div>
            </div>
          </div>
        </div>
      </div>

      {/* History Header & List with Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-utube-border pb-3.5 pt-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-black text-utube-text">Watch History</h1>
          <div className="flex items-center gap-1.5 ml-4">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filterTab === 'all' 
                  ? 'bg-utube-text text-utube-card shadow-sm' 
                  : 'bg-utube-surface text-utube-text-secondary hover:bg-utube-border/60 border border-utube-border'
              }`}
            >
              All ({historyItems.length})
            </button>
            <button
              onClick={() => setFilterTab('unfinished')}
              className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filterTab === 'unfinished' 
                  ? 'bg-cyan-600 text-white shadow-sm' 
                  : 'bg-utube-surface text-utube-text-secondary hover:bg-utube-border/60 border border-utube-border'
              }`}
            >
              In Progress ({historyItems.filter(h => h.progress > 10 && h.duration > 0 && h.progress < h.duration * 0.9).length})
            </button>
            <button
              onClick={() => setFilterTab('completed')}
              className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filterTab === 'completed' 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'bg-utube-surface text-utube-text-secondary hover:bg-utube-border/60 border border-utube-border'
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
          className="text-xs font-bold text-utube-text-muted hover:text-red-600 transition-colors self-start sm:self-auto cursor-pointer"
        >
          Clear all history
        </button>
      </div>

      <div className="space-y-4">
        {filteredItems.map(item => (
          <div key={item.video.id} className="group flex flex-col sm:flex-row gap-4 p-4 bg-utube-card hover:bg-utube-surface border border-utube-border rounded-3xl transition-all shadow-sm relative">
            <div className="w-full sm:w-64 shrink-0">
              <VideoCard video={item.video} progress={item.duration > 0 ? (item.progress / item.duration) * 100 : Math.min(100, item.progress)} />
            </div>
            <div className="flex-1 flex justify-between items-start pt-1">
              <div className="max-w-xl hidden sm:block">
                <p className="text-xs text-utube-text-secondary line-clamp-3 leading-relaxed">
                  {item.video.description}
                </p>
              </div>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  removeFromHistory(item.video.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-2 text-utube-text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all rounded-full cursor-pointer"
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

