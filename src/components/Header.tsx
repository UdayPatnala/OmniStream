import { Search, Menu, Clock, X, Mic, Bell, Video as VideoIcon, Sparkles, Layers, Palette, Zap, Settings2 } from 'lucide-react';
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
import { OMSLogo } from './common/OMSLogo';

export function Header({ toggleSidebar }: { toggleSidebar?: () => void }) {
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(urlQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [pipelineState, setPipelineState] = useState<PlaybackState>('IDLE');
  const [isListening, setIsListening] = useState(false);
  const navigate = useNavigate();

  const { 
    versionMode, 
    setVersionMode, 
    cinemorphTheme, 
    setCinemorphTheme,
    instantAutoPlay,
    setInstantAutoPlay,
    setRootLandingPreference,
  } = useAppStore();

  const startVoiceSearch = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const fallbackQuery = 'IMAX 4K Cinematic Trailers';
      setQuery(fallbackQuery);
      handleSearch(undefined, fallbackQuery);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);
      recognition.onstart = () => {
        setIsListening(true);
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setQuery(transcript);
          handleSearch(undefined, transcript);
        }
        setIsListening(false);
      };
      recognition.onerror = () => {
        setIsListening(false);
      };
      recognition.onend = () => {
        setIsListening(false);
      };
      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

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

      const directVideoId = extractYouTubeId(finalQuery);
      if (directVideoId) {
        navigate(`/watch/${directVideoId}`);
        return;
      }
      navigate(`/search?q=${encodeURIComponent(finalQuery)}`);
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

        <Link to="/" className="flex items-center gap-2.5 group">
          <OMSLogo variant="light" size="sm" animated={true} />
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-gray-900 font-sans flex items-center gap-1 group-hover:text-red-600 transition-colors">
              Omni<span className="text-red-500">Stream</span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-red-50 text-red-600 border border-red-200 tracking-wider hidden sm:block">
                OMS
              </span>
            </span>
          </div>
        </Link>

        {/* Instant Auto-Play Badge */}
        <div className="hidden md:flex items-center gap-2 ml-2">
          <button 
            onClick={() => setInstantAutoPlay(!instantAutoPlay)}
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
              instantAutoPlay ? 'bg-red-50 border-red-200 text-red-600' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Settings2 className="w-3 h-3" />
            <span>Instant Play {instantAutoPlay ? 'ON' : 'OFF'}</span>
          </button>

          {/* Live Pipeline State Machine Badge */}
          {pipelineState !== 'IDLE' && pipelineState !== 'PLAYING' && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 rounded-full text-xs font-bold animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-spin" />
              <span>{pipelineState}...</span>
            </div>
          )}
        </div>
      </div>

      {/* Center: Search Bar & Voice Input */}
      <div className="flex items-center gap-3 flex-1 max-w-[680px] mx-4 justify-center">
        <div className="relative w-full max-w-[560px]">
          <form onSubmit={(e) => handleSearch(e)} className="flex items-center w-full shadow-sm">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Ask CineMorphAI or search YouTube..."
                value={query}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-gray-50 text-gray-900 placeholder-gray-500 rounded-l-full py-2 px-4 text-sm focus:outline-none border border-gray-300 focus:border-red-500 transition-colors"
              />
            </div>

            <button 
              type="submit" 
              className="bg-gray-100 hover:bg-gray-200 border border-l-0 border-gray-300 text-gray-600 px-5 py-2 rounded-r-full flex items-center justify-center transition-colors shrink-0"
              aria-label="Search"
            >
              <Search className="w-4 h-4 text-red-500" />
            </button>
          </form>

          {/* Autocomplete Suggestions */}
          <AnimatePresence>
            {showSuggestions && (suggestions.length > 0 || searchHistory.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute top-full left-0 right-14 mt-1 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50 py-2"
              >
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={`sug-${idx}`}
                    onMouseDown={() => {
                      setQuery(suggestion);
                      handleSearch(undefined, suggestion);
                    }}
                    className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 text-left text-sm text-gray-900"
                  >
                    <div className="flex items-center gap-3">
                      <Search className="w-4 h-4 text-red-500" />
                      <span>{suggestion}</span>
                    </div>
                  </button>
                ))}

                {query.length === 0 && searchHistory.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-t border-gray-100 mt-1 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> Recent & Frequent Searches
                    </div>
                    {searchHistory.slice(0, 6).map((item, idx) => (
                      <div
                        key={`hist-${idx}`}
                        className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 text-left text-sm text-gray-900"
                      >
                        <button
                          onMouseDown={() => {
                            setQuery(item);
                            handleSearch(undefined, item);
                          }}
                          className="flex items-center gap-3 flex-1 text-left"
                        >
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{item}</span>
                        </button>
                        <button
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            removeSearchHistory(item);
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 rounded-full"
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
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 border cursor-pointer ${
            isListening 
              ? 'bg-red-500 text-white border-red-600 shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse' 
              : 'bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-red-600 border-gray-300'
          }`}
          aria-label={isListening ? 'Listening to voice...' : 'Search with voice'}
          title={isListening ? 'Listening...' : 'Voice Search'}
          onClick={startVoiceSearch}
        >
          <Mic className={`w-4 h-4 ${isListening ? 'animate-bounce' : ''}`} />
        </button>
      </div>

      {/* Right: Theme Selector & User Controls */}
      <div className="flex items-center gap-2">
        {/* Experience Gateway Switcher */}
        <Link 
          to="/landing"
          onClick={() => setRootLandingPreference('ask')}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 text-gray-600 hover:text-red-600 text-xs font-bold transition-all"
          title="Switch between U-Tube V1 and CineMorph V2"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gateway</span>
        </Link>

        {/* Theme Selector */}
        <div className="relative">
          <button 
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            title="Morph Aesthetic Theme"
          >
            <Palette className="w-5 h-5" />
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-2xl shadow-xl p-2 z-50">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 px-3 py-1 border-b border-gray-100 mb-1">
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
                    cinemorphTheme === t.id ? 'bg-red-600 text-white font-semibold' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${t.color}`} />
                  <span>{t.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors hidden sm:block">
          <Layers className="w-5 h-5 text-gray-600" />
        </button>
        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors hidden sm:block">
          <Bell className="w-5 h-5 text-gray-600" />
        </button>
        <Link to="/settings" className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center font-bold text-xs ml-1 shadow-sm transition-colors">
          U
        </Link>
      </div>
    </header>
  );



}
