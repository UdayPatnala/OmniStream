import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, X, Loader2, Sparkles } from 'lucide-react';
import { useUTubeStore } from '../../state/useUTubeStore';
import { youtubeService } from '../../services/youtubeService';

interface SearchBarProps {
  onSelectVideo?: (videoId: string) => void;
  className?: string;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSelectVideo,
  className = '',
  autoFocus = false,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  const { search, recentSearches, playVideo } = useUTubeStore();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isCurrent = true;
    if (query.trim().length >= 2) {
      youtubeService.getSuggestions(query).then((items) => {
        if (isCurrent) setSuggestions(items);
      });
    } else {
      setSuggestions([]);
    }
    return () => {
      isCurrent = false;
    };
  }, [query]);

  // Click outside listener to dismiss suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExecuteSearch = async (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;

    setShowSuggestions(false);
    setLoading(true);

    try {
      // Direct YouTube video ID or link
      const directId = youtubeService.extractVideoId(trimmed);
      if (directId) {
        playVideo(directId);
        onSelectVideo?.(directId);
        return;
      }

      await search(trimmed);
    } catch (err) {
      console.error('[SearchBar] Search failure:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleExecuteSearch(query);
  };

  return (
    <div ref={containerRef} className={`relative w-full max-w-2xl mx-auto ${className}`}>
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="relative w-full flex items-center bg-[#12111a]/90 border border-white/10 hover:border-red-500/40 focus-within:border-red-500/80 rounded-2xl px-4 py-2.5 shadow-xl transition-all">
          <SearchIcon className="h-4 w-4 text-gray-400 mr-2.5 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search YouTube videos, topics, or paste any video link..."
            autoFocus={autoFocus}
            className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSuggestions([]);
              }}
              className="text-gray-400 hover:text-white p-1 ml-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="ml-2 px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1.5"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Search'}
          </button>
        </div>
      </form>

      {/* Suggestions and Recent Searches Flyout */}
      {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-[#12111a]/95 border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Live Query Suggestions */}
          {suggestions.length > 0 && (
            <div className="py-2 border-b border-white/5">
              <div className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-red-400" />
                Live Suggestions
              </div>
              {suggestions.slice(0, 5).map((sugg, idx) => (
                <button
                  key={`sugg-${idx}`}
                  type="button"
                  onClick={() => {
                    setQuery(sugg);
                    handleExecuteSearch(sugg);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-gray-200 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                >
                  <SearchIcon className="h-3 w-3 text-gray-500" />
                  <span>{sugg}</span>
                </button>
              ))}
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Recent Searches
              </div>
              {recentSearches.slice(0, 4).map((recent, idx) => (
                <button
                  key={`rec-${idx}`}
                  type="button"
                  onClick={() => {
                    setQuery(recent);
                    handleExecuteSearch(recent);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                >
                  <span className="text-gray-500 text-[10px]">🕒</span>
                  <span>{recent}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
