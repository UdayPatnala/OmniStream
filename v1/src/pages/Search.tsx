import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchVideos } from '../lib/youtube';
import { SearchResult, SearchFilterType } from '../types';
import { VideoCard } from '../components/VideoCard';
import { VideoCardSkeleton } from '../components/Skeleton';
import { Search as SearchIcon, Loader2 } from 'lucide-react';

const filterTabs: { type: SearchFilterType; label: string }[] = [
  { type: 'all', label: 'All' },
  { type: 'video', label: 'Videos' },
  { type: 'channel', label: 'Channels' },
  { type: 'playlist', label: 'Playlists' },
];

export function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [activeFilter, setActiveFilter] = useState<SearchFilterType>('all');
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

  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-[#aaaaaa]">
        <SearchIcon className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-sm font-medium">Search for videos, topics, or creators</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2 max-w-[1700px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#272727] pb-3">
        <h1 className="text-lg font-bold text-[#f1f1f1]">Results for "{query}"</h1>
        
        {/* Filter Chips */}
        <div className="flex gap-2">
          {filterTabs.map(tab => (
            <button
              key={tab.type}
              onClick={() => setActiveFilter(tab.type)}
              className={`px-3.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 gap-y-8">
        {loading ? (
          Array.from({ length: 12 }).map((_, i) => <VideoCardSkeleton key={i} />)
        ) : (
          results.map((item, idx) => (
            <VideoCard key={`${item.id}-${idx}`} video={item} />
          ))
        )}
      </div>

      {nextPageToken && !loading && (
        <div className="flex justify-center pt-6">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2.5 bg-[#272727] hover:bg-[#3f3f3f] text-white font-semibold text-sm rounded-full transition-colors flex items-center gap-2"
          >
            {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
            {loadingMore ? 'Loading...' : 'Load More Results'}
          </button>
        </div>
      )}
    </div>
  );
}


