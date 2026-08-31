import { Search, Menu, Clock, X, Mic, Layers, Settings2, Film } from 'lucide-react';
import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { fetchSearchSuggestions } from '../lib/youtube';
import { useAppStore } from '../store';
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
  const [pipelineState, setPipelineState] = useState<PlaybackState>('IDLE');
  const [isListening, setIsListening] = useState(false);
  const navigate = useNavigate();

  const {
    instantAutoPlay,
    setInstantAutoPlay,
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

  const handleSearch = async (e?: FormEvent, explicitQuery?: string) => {
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

  return (
    <header className="flex items-center justify-between sticky top-0 z-40 px-4 py-2 bg-utube-card/90 backdrop-blur-xl border-b border-utube-border h-14 select-none">
      {/* Left: Hamburger, CineMorph Logo & Version Badge */}
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleSidebar} 
          className="p-2 text-utube-text hover:bg-utube-surface rounded-full transition-colors" 
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/" className="flex items-center gap-2.5 group">
          <OMSLogo variant="light" size="sm" animated={true} />
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-utube-text font-sans flex items-center gap-1 group-hover:text-utube-primary transition-colors">
              Omni<span className="text-utube-primary">Stream</span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-utube-surface text-utube-primary border border-utube-border tracking-wider hidden sm:block">
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
              instantAutoPlay ? 'bg-utube-surface border-utube-border text-utube-primary' : 'bg-utube-bg border-utube-border text-utube-text-secondary hover:bg-utube-surface'
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
                className="w-full bg-utube-bg text-utube-text placeholder-utube-text-muted rounded-l-full py-2 px-4 text-sm focus:outline-none border border-utube-border focus:border-utube-primary transition-colors"
              />
            </div>

            <button 
              type="submit" 
              className="bg-utube-surface hover:bg-utube-border border border-l-0 border-utube-border text-utube-text-secondary px-5 py-2 rounded-r-full flex items-center justify-center transition-colors shrink-0"
              aria-label="Search"
            >
              <Search className="w-4 h-4 text-utube-primary" />
            </button>
          </form>

          {/* Autocomplete Suggestions */}
          <AnimatePresence>
            {showSuggestions && (suggestions.length > 0 || searchHistory.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute top-full left-0 right-14 mt-1 bg-utube-card rounded-2xl shadow-xl border border-utube-border overflow-hidden z-50 py-2"
              >
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={`sug-${idx}`}
                    onMouseDown={() => {
                      setQuery(suggestion);
                      handleSearch(undefined, suggestion);
                    }}
                    className="w-full flex items-center justify-between px-4 py-2 hover:bg-utube-surface text-left text-sm text-utube-text"
                  >
                    <div className="flex items-center gap-3">
                      <Search className="w-4 h-4 text-utube-primary" />
                      <span>{suggestion}</span>
                    </div>
                  </button>
                ))}

                {query.length === 0 && searchHistory.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 text-[11px] font-semibold text-utube-text-secondary uppercase tracking-wider border-t border-utube-border mt-1 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> Recent & Frequent Searches
                    </div>
                    {searchHistory.slice(0, 6).map((item, idx) => (
                      <div
                        key={`hist-${idx}`}
                        className="w-full flex items-center justify-between px-4 py-2 hover:bg-utube-surface text-left text-sm text-utube-text"
                      >
                        <button
                          onMouseDown={() => {
                            setQuery(item);
                            handleSearch(undefined, item);
                          }}
                          className="flex items-center gap-3 flex-1 text-left"
                        >
                          <Clock className="w-4 h-4 text-utube-text-muted" />
                          <span>{item}</span>
                        </button>
                        <button
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            removeSearchHistory(item);
                          }}
                          className="p-1 text-utube-text-muted hover:text-utube-primary rounded-full"
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
              ? 'bg-utube-primary text-white border-utube-primary shadow-[0_0_12px_rgba(184,58,75,0.4)] animate-pulse' 
              : 'bg-utube-bg hover:bg-utube-surface text-utube-text-secondary hover:text-utube-primary border-utube-border'
          }`}
          aria-label={isListening ? 'Listening to voice...' : 'Search with voice'}
          title={isListening ? 'Listening...' : 'Voice Search'}
          onClick={startVoiceSearch}
        >
          <Mic className={`w-4 h-4 ${isListening ? 'animate-bounce' : ''}`} />
        </button>
      </div>

      {/* Right: Cross-engine navigation + profile */}
      <div className="flex items-center gap-2">
        {/* OmniStream home — permitted cross-product escape #1 */}
        <Link
          to="/"
          title="Return to OmniStream gateway"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-utube-surface hover:bg-utube-border/50 text-utube-text-secondary hover:text-utube-text border border-utube-border text-xs font-semibold transition-all"
        >
          <Layers className="w-3.5 h-3.5 text-utube-text-muted" />
          <span>OmniStream</span>
        </Link>

        {/* CineMorph — permitted cross-product escape #2 */}
        <Link
          to="/cinemorph"
          title="Launch CineMorph Virtual Theater"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-bold transition-all shadow-sm group"
        >
          <Film className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="font-cinematic">CineMorph</span>
        </Link>

        {/* User/settings avatar */}
        <Link to="/settings" title="Preferences" className="w-8 h-8 rounded-full bg-utube-primary hover:bg-utube-secondary text-white flex items-center justify-center font-bold text-xs ml-1 shadow-sm transition-colors">
          U
        </Link>
      </div>
    </header>
  );



}
