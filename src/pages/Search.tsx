import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchVideos } from '../lib/youtube';
import { useAppStore } from '../store';
import { SearchResult, SearchFilterType } from '../types';
import { VideoCard } from '../components/VideoCard';
import { VideoCardSkeleton } from '../components/Skeleton';
import { AlertCircle, Search as SearchIcon, Loader2 } from 'lucide-react';

const filterTabs: { type: SearchFilterType; label: string }[] = [
  { type: 'all', label: 'All' },
  { type: 'video', label: 'Videos' },
  { type: 'channel', label: 'Channels' },
  { type: 'playlist', label: 'Playlists' },
];

export function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const apiKey = useAppStore(state => state.apiKey);
  
  const [activeFilter, setActiveFilter] = useState<SearchFilterType>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchResults() {
      if (!query || !apiKey) return;
      
      try {
        setLoading(true);
        setError('');
        const res = await searchVideos(query, apiKey, activeFilter);
        setResults(res.results);
        setNextPageToken(res.nextPageToken);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [query, apiKey, activeFilter]);

  const loadMore = async () => {
    if (!nextPageToken || !query || !apiKey || loadingMore) return;
    try {
      setLoadingMore(true);
      const res = await searchVideos(query, apiKey, activeFilter, nextPageToken);
      setResults(prev => [...prev, ...res.results]);
      setNextPageToken(res.nextPageToken);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-[#938F99]">
        <SearchIcon className="w-16 h-16 mb-4 opacity-20" />
        <p>Type something in the search bar to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <h1 className="text-xl font-medium text-[#E6E1E5]">Search results for "{query}"</h1>
        
        {/* Filter Tabs */}
        <div className="flex gap-2 bg-[#1C1B1F] p-1 rounded-2xl border border-white/5 self-start">
          {filterTabs.map(tab => (
            <button
              key={tab.type}
              onClick={() => setActiveFilter(tab.type)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                activeFilter === tab.type
                  ? 'bg-[#4F378B] text-[#EADDFF]'
                  : 'text-[#CAC4D0] hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {error && (
        <div className="p-4 bg-red-900/20 text-red-400 rounded-2xl border border-red-500/20 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 12 }).map((_, i) => <VideoCardSkeleton key={i} />)
        ) : (
          results.map((item, idx) => (
            <VideoCard key={`${item.id}-${idx}`} video={item} />
          ))
        )}
      </div>

      {nextPageToken && !loading && (
        <div className="flex justify-center pt-8">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-8 py-3 bg-[#1C1B1F] hover:bg-[#2B2930] text-[#D0BCFF] border border-white/5 font-semibold text-sm rounded-full transition-colors flex items-center gap-2"
          >
            {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
            {loadingMore ? 'Loading...' : 'Load More Results'}
          </button>
        </div>
      )}
    </div>
  );
}

