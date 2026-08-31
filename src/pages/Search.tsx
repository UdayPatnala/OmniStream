import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchVideos } from '../lib/youtube';
import { SearchResult, SearchFilterType } from '../types';
import { VideoCard } from '../components/VideoCard';
import { VideoCardSkeleton } from '../components/Skeleton';
import { Search as SearchIcon, Loader2, Zap, Play } from 'lucide-react';
import { playbackService } from '../lib/services/playbackService';

const filterTabs: { type: SearchFilterType; label: string }[] = [
  { type: 'all', label: 'All' },
  { type: 'video', label: 'Videos' },
  { type: 'channel', label: 'Channels' },
  { type: 'playlist', label: 'Playlists' },
];

export function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();
  
  const [activeFilter, setActiveFilter] = useState<SearchFilterType>('all');
  const [uploadDateFilter, setUploadDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [durationFilter, setDurationFilter] = useState<'all' | 'short' | 'long'>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'viewCount'>('relevance');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    async function fetchResults() {
      if (!query) return;
      
      try {
        setLoading(true);
        const res = await searchVideos(query, activeFilter);
        setResults(res.results);
        setNextPageToken(res.nextPageToken);
      } catch (err: any) {
        // Safe silent fallback handled by youtube.ts
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [query, activeFilter]);

  const loadMore = async () => {
    if (!nextPageToken || !query || loadingMore) return;
    try {
      setLoadingMore(true);
      const res = await searchVideos(query, activeFilter, nextPageToken);
      setResults(prev => [...prev, ...res.results]);
      setNextPageToken(res.nextPageToken);
    } catch (err: any) {
      // Safe fallback
    } finally {
      setLoadingMore(false);
    }
  };

  const handleInstantAutoPlayHero = async () => {
    if (query) {
      await playbackService.executePipeline(query, navigate);
    }
  };

  const filteredResults = results.filter(item => {
    if (uploadDateFilter !== 'all' && item.publishedAt) {
      const pubTime = new Date(item.publishedAt).getTime();
      const now = Date.now();
      const diffHours = (now - pubTime) / (1000 * 60 * 60);
      if (uploadDateFilter === 'today' && diffHours > 24) return false;
      if (uploadDateFilter === 'week' && diffHours > 24 * 7) return false;
      if (uploadDateFilter === 'month' && diffHours > 24 * 30) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'date' && a.publishedAt && b.publishedAt) {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    }
    return 0;
  });

  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-[#aaaaaa]">
        <SearchIcon className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-sm font-medium">Search for videos, topics, or creators</p>
      </div>
    );
  }

  const topMatch = filteredResults.length > 0 ? filteredResults[0] : null;

  return (
    <div className="space-y-6 py-2 max-w-[1700px] mx-auto">
      {/* Instant Play Best Match Banner */}
      {topMatch && !loading && (
        <div className="bg-gradient-to-r from-purple-900/60 via-indigo-900/60 to-cyan-900/40 border border-purple-500/30 rounded-3xl p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-28 aspect-video rounded-xl overflow-hidden bg-black shrink-0 relative border border-white/10 shadow-lg">
              <img src={topMatch.thumbnails.medium} alt={topMatch.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Play className="w-6 h-6 text-white fill-current drop-shadow" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
                <Zap className="w-4 h-4 text-amber-400" />
                Top Relevant Match Identified
              </div>
              <h3 className="text-sm md:text-base font-bold text-white leading-snug line-clamp-1">{topMatch.title}</h3>
              <p className="text-xs text-gray-400">{topMatch.channelTitle}</p>
            </div>
          </div>

          <button
            onClick={handleInstantAutoPlayHero}
            className="w-full md:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xl shadow-purple-950/50 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" /> Instant In-App Playback
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3 border-b border-[#272727] pb-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-lg font-bold text-[#f1f1f1]">Results for "{query}"</h1>
          
          {/* Main Content Type Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {filterTabs.map(tab => (
              <button
                key={tab.type}
                onClick={() => setActiveFilter(tab.type)}
                className={`px-3.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeFilter === tab.type
                    ? 'bg-white text-black font-bold'
                    : 'bg-[#272727] text-[#f1f1f1] hover:bg-[#3f3f3f]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Specification Filters (Upload Date, Duration, Sort By) */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-utube-text-secondary">
          <span className="font-bold text-utube-text-muted">Filters:</span>
          
          <select 
            className="bg-utube-card border border-utube-border text-xs text-utube-text rounded-xl px-3 py-1.5 focus:outline-none focus:border-utube-primary shadow-sm cursor-pointer"
            value={uploadDateFilter}
            onChange={(e) => setUploadDateFilter(e.target.value as any)}
          >
            <option value="all">Any Upload Date</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          <select 
            className="bg-utube-card border border-utube-border text-xs text-utube-text rounded-xl px-3 py-1.5 focus:outline-none focus:border-utube-primary shadow-sm cursor-pointer"
            value={durationFilter}
            onChange={(e) => setDurationFilter(e.target.value as any)}
          >
            <option value="all">Any Duration</option>
            <option value="short">Short (&lt; 4 mins)</option>
            <option value="long">Long (&gt; 20 mins)</option>
          </select>

          <select 
            className="bg-utube-card border border-utube-border text-xs text-utube-text rounded-xl px-3 py-1.5 focus:outline-none focus:border-utube-primary shadow-sm cursor-pointer"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="relevance">Sort by Relevance</option>
            <option value="date">Sort by Date</option>
            <option value="viewCount">Sort by View Count</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 gap-y-8">
        {loading ? (
          Array.from({ length: 12 }).map((_, i) => <VideoCardSkeleton key={i} />)
        ) : (
          filteredResults.map((item, idx) => (
            <VideoCard key={`${item.id}-${idx}`} video={item} />
          ))
        )}
      </div>

      {nextPageToken && !loading && (
        <div className="flex justify-center pt-6">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2.5 bg-[#272727] hover:bg-[#3f3f3f] text-white font-semibold text-sm rounded-full transition-colors flex items-center gap-2 cursor-pointer"
          >
            {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
            {loadingMore ? 'Loading...' : 'Load More Results'}
          </button>
        </div>
      )}
    </div>
  );
}


