import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchVideos } from '../services/youtube';
import { SearchResult, SearchFilterType } from '../types';
import { VideoCard } from '../components/VideoCard';
import { VideoCardSkeleton } from '@omnistream/shared/ui/Skeleton';
import { Search as SearchIcon, Loader2, Sparkles, Play } from 'lucide-react';
import { playbackService } from '../services/playbackService';

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

  const latestRequestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++latestRequestIdRef.current;
    
    async function fetchResults() {
      if (!query.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const res = await searchVideos(query.trim(), activeFilter);
        // Stale response protection: only update if this is still the latest request
        if (requestId === latestRequestIdRef.current) {
          setResults(res.results);
          setNextPageToken(res.nextPageToken);
        }
      } catch (err: any) {
        if (requestId === latestRequestIdRef.current) {
          setResults([]);
        }
      } finally {
        if (requestId === latestRequestIdRef.current) {
          setLoading(false);
        }
      }
    }

    fetchResults();
  }, [query, activeFilter]);

  const loadMore = async () => {
    if (!nextPageToken || !query || loadingMore) return;
    try {
      setLoadingMore(true);
      const res = await searchVideos(query.trim(), activeFilter, nextPageToken);
      setResults(prev => [...prev, ...res.results]);
      setNextPageToken(res.nextPageToken);
    } catch (err: any) {
      // Safe fallback
    } finally {
      setLoadingMore(false);
    }
  };

  const handlePlayTopMatch = () => {
    if (topMatch) {
      navigate(`/watch/${topMatch.id}`);
    } else if (query) {
      playbackService.executePipeline(query, navigate);
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
      <div className="flex flex-col items-center justify-center h-[50vh] text-utube-text-muted select-none">
        <SearchIcon className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-sm font-medium">Search for videos, topics, or creators</p>
      </div>
    );
  }

  const topMatch = filteredResults.length > 0 ? filteredResults[0] : null;

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto pb-12 select-none font-sans text-utube-text">
      {/* Top Relevant Match Banner */}
      {topMatch && !loading && (
        <div className="bg-utube-card border border-utube-border rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-28 aspect-video rounded-xl overflow-hidden bg-black shrink-0 relative border border-utube-border shadow-md">
              <img src={topMatch.thumbnails.medium} alt={topMatch.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Play className="w-6 h-6 text-white fill-current drop-shadow" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-utube-primary text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Top Match</span>
              </div>
              <h3 className="text-sm md:text-base font-bold text-utube-text leading-snug line-clamp-1 truncate">{topMatch.title}</h3>
              <p className="text-xs text-utube-text-secondary truncate">{topMatch.channelTitle}</p>
            </div>
          </div>

          <button
            onClick={handlePlayTopMatch}
            className="w-full md:w-auto px-6 py-2.5 rounded-full bg-utube-primary hover:bg-utube-secondary text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Play Now</span>
          </button>
        </div>
      )}

      {/* Top Banner / Filter Controls */}
      <div className="space-y-3 pb-2 border-b border-utube-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-base sm:text-lg font-bold text-utube-text truncate">
              Results for &ldquo;<span className="text-utube-primary">{query}</span>&rdquo;
            </h1>
            <span className="text-xs text-utube-text-muted font-mono">
              {!loading && `(${filteredResults.length} items)`}
            </span>
          </div>
          
          {/* Filter Type Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.type}
                onClick={() => setActiveFilter(tab.type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  activeFilter === tab.type
                    ? 'bg-utube-text text-utube-bg font-bold shadow-sm'
                    : 'bg-utube-surface text-utube-text-secondary hover:text-utube-text hover:bg-utube-border/60 border border-utube-border/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Specification Filters */}
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

      {/* Results Grid / Loading / Empty State */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 gap-y-8">
          {Array.from({ length: 12 }).map((_, i) => <VideoCardSkeleton key={i} />)}
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[40vh] text-center max-w-md mx-auto text-utube-text">
          <div className="w-16 h-16 bg-utube-surface rounded-full flex items-center justify-center mb-4 border border-utube-border">
            <SearchIcon className="w-6 h-6 text-utube-text-muted" />
          </div>
          <h2 className="text-base font-bold text-utube-text mb-1">No Results Found</h2>
          <p className="text-xs text-utube-text-muted">
            We couldn&apos;t find any matches for &ldquo;{query}&rdquo;. Try checking for typos or searching for broader topics.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 gap-y-8">
          {filteredResults.map((item, idx) => (
            <VideoCard key={`${item.id}-${idx}`} video={item} />
          ))}
        </div>
      )}

      {nextPageToken && !loading && filteredResults.length > 0 && (
        <div className="flex justify-center pt-6">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2.5 bg-utube-surface hover:bg-utube-border text-utube-text border border-utube-border font-semibold text-xs rounded-full transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{loadingMore ? 'Loading...' : 'Load More Results'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

