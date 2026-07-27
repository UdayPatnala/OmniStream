import { Search, Menu, Clock, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSearchSuggestions } from '../lib/youtube';
import { useAppStore } from '../store';
import { AnimatePresence, motion } from 'motion/react';

export function Header() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();

  const searchHistory = useAppStore(state => state.searchHistory);
  const addSearchHistory = useAppStore(state => state.addSearchHistory);
  const removeSearchHistory = useAppStore(state => state.removeSearchHistory);

  useEffect(() => {
    let active = true;

    async function loadSuggestions() {
      if (!query.trim() || query.length < 2) {
        setSuggestions([]);
        return;
      }
      const results = await fetchSearchSuggestions(query);
      if (active) {
        setSuggestions(results);
      }
    }

    const timer = setTimeout(loadSuggestions, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const handleSearch = (e?: React.FormEvent, explicitQuery?: string) => {
    if (e) e.preventDefault();
    const finalQuery = explicitQuery || query;
    if (finalQuery.trim()) {
      addSearchHistory(finalQuery.trim());
      setShowSuggestions(false);
      navigate(`/search?q=${encodeURIComponent(finalQuery.trim())}`);
    }
  };

  return (
    <header className="flex items-center justify-between sticky top-0 z-40 pb-4 bg-[#0F0D13]">
      <div className="flex items-center gap-4 md:hidden">
        <button className="p-2 text-[#CAC4D0]" aria-label="Open menu">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <div className="relative w-full max-w-lg mx-auto hidden md:block">
        <form onSubmit={(e) => handleSearch(e)}>
          <input
            type="text"
            placeholder="Search U Tube"
            value={query}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#2B2930] rounded-full py-3 pl-12 pr-12 text-sm text-[#CAC4D0] focus:outline-none border border-white/5 shadow-lg"
          />
          <button type="submit" className="absolute left-4 top-3 text-[#938F99]" aria-label="Search">
            <Search className="w-5 h-5" />
          </button>
        </form>

        <AnimatePresence>
          {showSuggestions && (suggestions.length > 0 || searchHistory.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-[#2B2930] rounded-2xl shadow-2xl border border-white/5 overflow-hidden z-50 py-2"
            >
              {/* Query suggestions */}
              {suggestions.map((suggestion, idx) => (
                <button
                  key={`sug-${idx}`}
                  onMouseDown={() => {
                    setQuery(suggestion);
                    handleSearch(undefined, suggestion);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-left text-sm text-[#E6E1E5]"
                >
                  <Search className="w-4 h-4 text-[#938F99]" />
                  <span>{suggestion}</span>
                </button>
              ))}

              {/* Recent Search History */}
              {query.length === 0 && searchHistory.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-[10px] uppercase font-semibold text-[#938F99] tracking-wider border-t border-white/5 mt-1 pt-2">
                    Recent Searches
                  </div>
                  {searchHistory.slice(0, 5).map((item, idx) => (
                    <div
                      key={`hist-${idx}`}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 text-left text-sm text-[#CAC4D0]"
                    >
                      <button
                        onMouseDown={() => {
                          setQuery(item);
                          handleSearch(undefined, item);
                        }}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        <Clock className="w-4 h-4 text-[#938F99]" />
                        <span>{item}</span>
                      </button>
                      <button
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          removeSearchHistory(item);
                        }}
                        className="p-1 text-[#938F99] hover:text-red-400 rounded-full"
                        aria-label="Remove search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="w-8"></div>
    </header>
  );
}


