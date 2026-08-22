import { Search, Menu, Clock, X, Mic, Bell, Video as VideoIcon, Sparkles, Layers, Palette, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { fetchSearchSuggestions } from '../lib/youtube';
import { useAppStore } from '../store';
import { CineMorphTheme } from '../types';
import { AnimatePresence, motion } from 'motion/react';
import { extractYouTubeId } from '../lib/utils';
import { playbackService } from '../lib/services/playbackService';
import { IntentRouter } from '../lib/services/intentRouter';

import { playbackStateMachine, PlaybackState } from '../lib/services/playbackStateMachine';

export function Header({ toggleSidebar }: { toggleSidebar?: () => void }) {
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(urlQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [pipelineState, setPipelineState] = useState<PlaybackState>('IDLE');
  const navigate = useNavigate();

  const { 
    versionMode, 
    setVersionMode, 
    cinemorphTheme, 
    setCinemorphTheme,
    instantAutoPlay,
    setInstantAutoPlay,
  } = useAppStore();

  useEffect(() => {
    return playbackStateMachine.subscribe((state) => {
      setPipelineState(state);
    });
  }, []);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

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

  const handleSearch = async (e?: React.FormEvent, explicitQuery?: string) => {
    if (e) e.preventDefault();
    const finalQuery = (explicitQuery || query).trim();
    if (finalQuery) {
      addSearchHistory(finalQuery);
      setShowSuggestions(false);

      const classified = IntentRouter.classifyIntent(finalQuery);
      if (classified.type === 'FIND_UNFINISHED') {
        navigate('/history');
        return;
      }
      if (classified.type === 'CREATE_COLLECTION') {
        const res = await IntentRouter.executeIntent(finalQuery);
        navigate('/collections');
        return;
      }

      if (instantAutoPlay) {
        // Execute fully automated Search -> Rank -> Validate -> Auto-Play Pipeline
        await playbackService.executePipeline(finalQuery, navigate);
      } else {
        const directVideoId = extractYouTubeId(finalQuery);
        if (directVideoId) {
          navigate(`/watch/${directVideoId}`);
          return;
        }
        navigate(`/search?q=${encodeURIComponent(finalQuery)}`);
      }
    }
  };

  const themesList: { id: CineMorphTheme; name: string; color: string }[] = [
    { id: 'cinematic-dark', name: 'Cinematic Dark', color: 'bg-indigo-600' },
    { id: 'cyberpunk-oled', name: 'Cyberpunk OLED', color: 'bg-cyan-500' },
    { id: 'glassmorphic-neon', name: 'Glassmorphic Neon', color: 'bg-purple-500' },
    { id: 'ambient-minimal', name: 'Ambient Minimalist', color: 'bg-emerald-500' },
    { id: 'imax-ultra', name: 'IMAX Ultra', color: 'bg-sky-500' },
    { id: 'golden-hour', name: 'Golden Hour', color: 'bg-amber-500' },
  ];

  return (
    <header className="flex items-center justify-between sticky top-0 z-40 px-4 py-2 bg-[#08080c]/90 backdrop-blur-xl border-b border-[#272727]/60 h-14 select-none">
      {/* Left: Hamburger, CineMorph Logo & Version Badge */}
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleSidebar} 
          className="p-2 text-white hover:bg-white/10 rounded-full transition-colors" 
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-gradient-to-tr from-cyan-500 via-indigo-600 to-pink-500 p-1.5 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <img src="/favicon.svg" alt="OmniStream" className="w-5 h-5 drop-shadow" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-white font-sans bg-gradient-to-r from-white via-cyan-100 to-purple-300 bg-clip-text text-transparent">
              Omni<span className="text-cyan-400">Stream</span>
            </span>
          </div>
        </Link>

        {/* Version Switcher & Instant Auto-Play Badge */}
        <div className="hidden md:flex items-center gap-2 ml-2">
          <div className="flex items-center bg-black/40 border border-white/10 rounded-full p-0.5 text-xs font-semibold shadow-inner">
            <button
              onClick={() => setVersionMode('v2')}
              className={`px-2.5 py-0.5 rounded-full transition-all ${
                versionMode === 'v2' 
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              v2 AI
            </button>
            <button
              onClick={() => setVersionMode('v1')}
              className={`px-2.5 py-0.5 rounded-full transition-all ${
                versionMode === 'v1' 
                  ? 'bg-white/20 text-white shadow-md' 
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Archived U-Tube v1 mode"
            >
              v1
            </button>
          </div>

          {/* Instant Auto-Play Mode Toggle */}
          <button
            onClick={() => setInstantAutoPlay(!instantAutoPlay)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all border shadow-md ${
              instantAutoPlay
                ? 'bg-gradient-to-r from-amber-500/20 to-purple-500/20 border-amber-500/40 text-amber-300'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
            }`}
            title="Instant Search -> Playback Automation"
          >
            <Zap className={`w-3.5 h-3.5 ${instantAutoPlay ? 'text-amber-400 animate-bounce' : ''}`} />
            <span>Instant Play {instantAutoPlay ? 'ON' : 'OFF'}</span>
          </button>

          {/* Live Pipeline State Machine Badge */}
          {pipelineState !== 'IDLE' && pipelineState !== 'PLAYING' && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-950/80 border border-purple-500/40 text-purple-300 rounded-full text-xs font-bold animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
              <span>{pipelineState}...</span>
            </div>
          )}
        </div>
      </div>

      {/* Center: Search Bar & Voice Input */}
      <div className="flex items-center gap-3 flex-1 max-w-[680px] mx-4 justify-center">
        <div className="relative w-full max-w-[560px]">
          <form onSubmit={(e) => handleSearch(e)} className="flex items-center w-full">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Ask CineMorphAI or search YouTube..."
                value={query}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-[#121218]/80 text-[#f1f1f1] placeholder-[#777788] rounded-l-full py-2 px-4 text-sm focus:outline-none border border-[#2d2d3a] focus:border-indigo-500 shadow-inner backdrop-blur-md"
              />
            </div>

            <button 
              type="submit" 
              className="bg-[#1c1c28] hover:bg-[#28283a] border border-l-0 border-[#2d2d3a] text-[#f1f1f1] px-5 py-2 rounded-r-full flex items-center justify-center transition-colors shrink-0"
              aria-label="Search"
            >
              <Search className="w-4 h-4 text-indigo-300" />
            </button>
          </form>

          {/* Autocomplete Suggestions */}
          <AnimatePresence>
            {showSuggestions && (suggestions.length > 0 || searchHistory.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute top-full left-0 right-14 mt-1 bg-[#161622]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50 py-2"
              >
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={`sug-${idx}`}
                    onMouseDown={() => {
                      setQuery(suggestion);
                      handleSearch(undefined, suggestion);
                    }}
                    className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/10 text-left text-sm text-[#f1f1f1]"
                  >
                    <div className="flex items-center gap-3">
                      <Search className="w-4 h-4 text-indigo-400" />
                      <span>{suggestion}</span>
                    </div>
                  </button>
                ))}

                {query.length === 0 && searchHistory.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 text-[11px] font-semibold text-indigo-300 uppercase tracking-wider border-t border-white/10 mt-1 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> Recent & Frequent Searches
                    </div>
                    {searchHistory.slice(0, 6).map((item, idx) => (
                      <div
                        key={`hist-${idx}`}
                        className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/10 text-left text-sm text-[#f1f1f1]"
                      >
                        <button
                          onMouseDown={() => {
                            setQuery(item);
                            handleSearch(undefined, item);
                          }}
                          className="flex items-center gap-3 flex-1 text-left"
                        >
                          <Clock className="w-4 h-4 text-[#888]" />
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

        {/* Voice Search Button */}
        <button 
          className="w-9 h-9 rounded-full bg-[#1c1c28] hover:bg-[#28283a] flex items-center justify-center text-indigo-300 transition-colors shrink-0 border border-[#2d2d3a]"
          aria-label="Search with voice"
          onClick={() => alert('CineMorph Voice Engine Ready')}
        >
          <Mic className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Theme Selector & User Controls */}
      <div className="flex items-center gap-2">
        {/* Theme Selector */}
        <div className="relative">
          <button 
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-2 text-indigo-300 hover:bg-white/10 rounded-full transition-colors"
            title="Morph Aesthetic Theme"
          >
            <Palette className="w-5 h-5" />
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-[#161622] border border-white/10 rounded-2xl shadow-2xl p-2 z-50">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 px-3 py-1 border-b border-white/10 mb-1">
                Aesthetic Mode
              </div>
              {themesList.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setCinemorphTheme(t.id);
                    setShowThemeMenu(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                    cinemorphTheme === t.id ? 'bg-indigo-600 text-white font-semibold' : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${t.color}`} />
                  <span>{t.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="p-2 text-white hover:bg-white/10 rounded-full transition-colors hidden sm:block">
          <Layers className="w-5 h-5 text-indigo-300" />
        </button>
        <button className="p-2 text-white hover:bg-white/10 rounded-full transition-colors hidden sm:block">
          <Bell className="w-5 h-5 text-gray-300" />
        </button>
        <Link to="/settings" className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-xs ml-1 shadow-lg shadow-indigo-500/30">
          U
        </Link>
      </div>
    </header>
  );
}



