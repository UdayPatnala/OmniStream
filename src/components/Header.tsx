import { Search, Menu, Clock, X, Mic, Bell, Video as VideoIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchSearchSuggestions } from '../lib/youtube';
import { useAppStore } from '../store';
import { AnimatePresence, motion } from 'motion/react';

export function Header({ toggleSidebar }: { toggleSidebar?: () => void }) {
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

    const timer = setTimeout(loadSuggestions, 150);
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
    <header className="flex items-center justify-between sticky top-0 z-40 px-4 py-2 bg-[#0f0f0f] border-b border-[#272727]/40 h-14">
      {/* Left: Hamburger & YouTube Logo */}
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar} 
          className="p-2 text-white hover:bg-[#272727] rounded-full transition-colors" 
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/" className="flex items-center gap-1 group">
          <div className="bg-[#ff0000] text-white px-2 py-0.5 rounded-lg flex items-center justify-center shadow-md">
            <span className="font-black text-sm tracking-tighter italic">U</span>
          </div>
          <span className="text-xl font-bold tracking-tighter text-white font-sans">U Tube</span>
          <span className="text-[10px] text-[#aaa] font-medium self-start mt-0.5 ml-0.5">IN</span>
        </Link>
      </div>

      {/* Center: YouTube Search Bar & Mic */}
      <div className="flex items-center gap-3 flex-1 max-w-[720px] mx-4 justify-center">
        <div className="relative w-full max-w-[600px]">
          <form onSubmit={(e) => handleSearch(e)} className="flex items-center w-full">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search"
                value={query}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-[#121212] text-[#f1f1f1] placeholder-[#888888] rounded-l-full py-2 px-4 text-base focus:outline-none border border-[#303030] focus:border-[#1c62b9] shadow-inner"
              />
            </div>

            <button 
              type="submit" 
              className="bg-[#222222] hover:bg-[#303030] border border-l-0 border-[#303030] text-[#f1f1f1] px-6 py-2 rounded-r-full flex items-center justify-center transition-colors shrink-0"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          </form>

          {/* Autocomplete Suggestions */}
          <AnimatePresence>
            {showSuggestions && (suggestions.length > 0 || searchHistory.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute top-full left-0 right-14 mt-1 bg-[#212121] rounded-2xl shadow-2xl border border-[#383838] overflow-hidden z-50 py-2"
              >
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={`sug-${idx}`}
                    onMouseDown={() => {
                      setQuery(suggestion);
                      handleSearch(undefined, suggestion);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#383838] text-left text-sm text-[#f1f1f1]"
                  >
                    <Search className="w-4 h-4 text-[#aaa]" />
                    <span>{suggestion}</span>
                  </button>
                ))}

                {query.length === 0 && searchHistory.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 text-[11px] font-semibold text-[#aaa] uppercase tracking-wider border-t border-[#383838] mt-1">
                      Recent Searches
                    </div>
                    {searchHistory.slice(0, 5).map((item, idx) => (
                      <div
                        key={`hist-${idx}`}
                        className="w-full flex items-center justify-between px-4 py-2 hover:bg-[#383838] text-left text-sm text-[#f1f1f1]"
                      >
                        <button
                          onMouseDown={() => {
                            setQuery(item);
                            handleSearch(undefined, item);
                          }}
                          className="flex items-center gap-3 flex-1 text-left"
                        >
                          <Clock className="w-4 h-4 text-[#aaa]" />
                          <span>{item}</span>
                        </button>
                        <button
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            removeSearchHistory(item);
                          }}
                          className="p-1 text-[#aaa] hover:text-red-400 rounded-full"
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

        {/* Microphone Button */}
        <button 
          className="w-10 h-10 rounded-full bg-[#222222] hover:bg-[#303030] flex items-center justify-center text-white transition-colors shrink-0"
          aria-label="Search with voice"
          onClick={() => alert('Voice search ready')}
        >
          <Mic className="w-5 h-5" />
        </button>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-2">
        <button className="p-2 text-white hover:bg-[#272727] rounded-full transition-colors hidden sm:block">
          <VideoIcon className="w-5 h-5" />
        </button>
        <button className="p-2 text-white hover:bg-[#272727] rounded-full transition-colors hidden sm:block">
          <Bell className="w-5 h-5" />
        </button>
        <Link to="/settings" className="w-8 h-8 rounded-full bg-[#ff0000] text-white flex items-center justify-center font-bold text-sm ml-2">
          U
        </Link>
      </div>
    </header>
  );
}



