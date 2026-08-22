import React, { useState, useEffect } from 'react';
import { Video, AISummary, VideoScriptChunk, VideoClip, AIChatMessage, SceneHighlight } from '../types';
import { useAppStore } from '../store';
import { askCineMorphAI, generateSceneHighlights, telemetryEngine } from '../lib/cinemorph';
import { observabilityService } from '../lib/services/observabilityService';
import { 
  Sparkles, MessageSquare, FileText, Film, Activity, Send, Play, Check, 
  Copy, Clock, Zap, Flame, Bookmark, ArrowRight, Gauge, Cpu, HardDrive
} from 'lucide-react';

interface CineMorphAIStudioProps {
  video: Video;
  aiSummary: AISummary | null;
  scriptChunks: VideoScriptChunk[];
  onSeekTo: (seconds: number) => void;
}

export const CineMorphAIStudio: React.FC<CineMorphAIStudioProps> = ({
  video,
  aiSummary,
  scriptChunks,
  onSeekTo,
}) => {
  const { savedClips, saveClip, removeClip } = useAppStore();

  const [activeTab, setActiveTab] = useState<'copilot' | 'script' | 'clips' | 'telemetry'>('copilot');

  // Copilot Chat State
  const [chatMessages, setChatMessages] = useState<AIChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: `✨ Hello! I am **CineMorph AI v2**. Ask me anything about "${video.title}" or choose a quick prompt below to jump to specific insights!`,
      timestamp: Date.now()
    }
  ]);
  const [userQuery, setUserQuery] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [copied, setCopied] = useState(false);

  // Remix Clips State
  const [clipStart, setClipStart] = useState<number>(30);
  const [clipEnd, setClipEnd] = useState<number>(120);
  const [clipNote, setClipNote] = useState<string>('Highlight scene breakdown');

  // Highlights State
  const [highlights, setHighlights] = useState<SceneHighlight[]>([]);

  // Telemetry state
  const [telemetry, setTelemetry] = useState(telemetryEngine.getStats(true, true));

  useEffect(() => {
    setHighlights(generateSceneHighlights(video));
  }, [video]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry(telemetryEngine.getStats(true, true));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSendChat = async (queryText?: string) => {
    const textToSend = queryText || userQuery.trim();
    if (!textToSend || aiThinking) return;

    if (!queryText) setUserQuery('');

    const userMsg: AIChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: Date.now()
    };

    const updatedHistory = [...chatMessages, userMsg];
    setChatMessages(updatedHistory);
    setAiThinking(true);

    const reply = await askCineMorphAI(textToSend, video, updatedHistory);

    setAiThinking(false);
    setChatMessages((prev) => [
      ...prev,
      {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: reply,
        timestamp: Date.now()
      }
    ]);
  };

  const handleCreateClip = (e: React.FormEvent) => {
    e.preventDefault();
    if (clipStart >= clipEnd) return;

    const newClip: VideoClip = {
      id: `clip-${Date.now()}`,
      videoId: video.id,
      videoTitle: video.title,
      channelTitle: video.channelTitle,
      thumbnail: video.thumbnails?.high || video.thumbnails?.medium || '',
      startTime: clipStart,
      endTime: clipEnd,
      startTimeFormatted: formatSeconds(clipStart),
      endTimeFormatted: formatSeconds(clipEnd),
      note: clipNote || 'CineMorph AI Clip Highlight',
      createdAt: Date.now()
    };

    saveClip(newClip);
    setClipNote('');
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const copySummary = () => {
    if (!aiSummary) return;
    navigator.clipboard.writeText(`${aiSummary.executiveSummary}\n\nKey Takeaways:\n${aiSummary.keyTakeaways.join('\n')}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#14121D]/90 backdrop-blur-xl border border-purple-500/20 rounded-2xl shadow-2xl flex flex-col h-full min-h-[500px] overflow-hidden text-xs">
      {/* AI Studio Header Navigation Tabs */}
      <div className="flex items-center border-b border-purple-500/20 bg-[#0E0C16] p-1.5 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('copilot')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium transition-all ${
            activeTab === 'copilot'
              ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow-md'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>AI Copilot</span>
        </button>

        <button
          onClick={() => setActiveTab('script')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium transition-all ${
            activeTab === 'script'
              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-md'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-indigo-400" />
          <span>Script & Timeline</span>
        </button>

        <button
          onClick={() => setActiveTab('clips')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium transition-all ${
            activeTab === 'clips'
              ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 shadow-md'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          <Film className="w-3.5 h-3.5 text-cyan-400" />
          <span>Remix Clips</span>
          {savedClips.length > 0 && (
            <span className="px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 text-[10px] rounded-full font-bold">
              {savedClips.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('telemetry')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium transition-all ${
            activeTab === 'telemetry'
              ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-md'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Telemetry</span>
        </button>
      </div>

      {/* Tab 1: AI Copilot */}
      {activeTab === 'copilot' && (
        <div className="flex-1 flex flex-col p-4 overflow-hidden space-y-4">
          {/* Executive Summary Card */}
          {aiSummary && (
            <div className="bg-[#1C1929] border border-purple-500/30 rounded-2xl p-4 space-y-2 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-300 font-bold">
                  <Zap className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span>Executive AI Summary</span>
                </div>
                <button
                  onClick={copySummary}
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all flex items-center gap-1 text-[11px]"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-gray-300 leading-relaxed">{aiSummary.executiveSummary}</p>
              
              <div className="flex items-center gap-2 pt-1">
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                  Sentiment: {aiSummary.sentiment}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                  AI Score: {aiSummary.aiScore}/100
                </span>
              </div>
            </div>
          )}

          {/* Quick Action Suggestion Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              'Summarize key points',
              'Show timestamps',
              'Explain audio EQ tips',
              'Suggest 21:9 UltraWide reframe',
              'Who created this?'
            ].map((promptText, idx) => (
              <button
                key={idx}
                onClick={() => handleSendChat(promptText)}
                className="px-3 py-1.5 rounded-xl bg-[#1D1B2A] hover:bg-purple-900/40 border border-purple-500/20 text-purple-200 whitespace-nowrap transition-all hover:scale-105"
              >
                {promptText}
              </button>
            ))}
          </div>

          {/* Chat Transcript Window */}
          <div className="flex-1 bg-[#0D0B14] border border-white/5 rounded-2xl p-4 overflow-y-auto space-y-3 max-h-[300px]">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[90%] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-purple-600 text-white rounded-br-none'
                      : 'bg-[#181625] text-gray-200 border border-purple-500/20 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {aiThinking && (
              <div className="flex items-center gap-2 text-purple-400 p-2 bg-[#181625] rounded-xl w-max border border-purple-500/20">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>CineMorph AI is thinking...</span>
              </div>
            )}
          </div>

          {/* Chat Input Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleSendChat(); }} className="flex gap-2">
            <input
              type="text"
              placeholder="Ask CineMorph AI anything about this video..."
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              className="flex-1 bg-[#151322] border border-purple-500/30 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
            />
            <button
              type="submit"
              disabled={!userQuery.trim() || aiThinking}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Script & Timeline */}
      {activeTab === 'script' && (
        <div className="flex-1 flex flex-col p-4 overflow-hidden space-y-4">
          {/* Scene Importance Highlights Header */}
          <div className="space-y-2">
            <div className="font-bold text-gray-300 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Scene Importance Graph & Highlights</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {highlights.map((hl) => (
                <button
                  key={hl.id}
                  onClick={() => onSeekTo(hl.timestamp)}
                  className="p-2 bg-[#1C1A2B] hover:bg-purple-900/40 border border-white/5 hover:border-purple-500/40 rounded-xl text-left transition-all"
                >
                  <div className="flex items-center justify-between text-purple-400 font-mono font-bold">
                    <span>{formatSeconds(hl.timestamp)}</span>
                    <span className="text-[10px] text-amber-400 font-bold">{hl.importanceScore}%</span>
                  </div>
                  <div className="text-gray-200 truncate font-medium">{hl.title}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Script List */}
          <div className="flex-1 bg-[#0D0B14] border border-white/5 rounded-2xl p-3 overflow-y-auto space-y-2 max-h-[300px]">
            {scriptChunks.map((chunk) => (
              <div
                key={chunk.id}
                onClick={() => onSeekTo(chunk.timestamp)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 hover:scale-[1.01] ${
                  chunk.highlighted
                    ? 'bg-purple-950/40 border-purple-500/40 text-purple-100'
                    : 'bg-[#161423] border-white/5 text-gray-300 hover:bg-white/5'
                }`}
              >
                <div className="px-2 py-1 bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-lg font-mono font-bold text-xs whitespace-nowrap">
                  {chunk.timestampFormatted}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="font-semibold text-white flex items-center justify-between">
                    <span>{chunk.topic || chunk.speaker}</span>
                    {chunk.highlighted && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                        Key Segment
                      </span>
                    )}
                  </div>
                  <p className="text-gray-300 leading-relaxed">{chunk.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Remix Clips */}
      {activeTab === 'clips' && (
        <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
          {/* Create Clip Card */}
          <form onSubmit={handleCreateClip} className="bg-[#1B192A] border border-cyan-500/30 rounded-2xl p-4 space-y-3">
            <div className="font-bold text-cyan-300 flex items-center gap-2">
              <Film className="w-4 h-4 text-cyan-400" />
              <span>Smart Clip Snippet Excerpt Generator</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 block mb-1">Start Time (sec)</label>
                <input
                  type="number"
                  min="0"
                  value={clipStart}
                  onChange={(e) => setClipStart(Number(e.target.value))}
                  className="w-full bg-[#100E19] border border-white/10 rounded-xl p-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-gray-400 block mb-1">End Time (sec)</label>
                <input
                  type="number"
                  min="1"
                  value={clipEnd}
                  onChange={(e) => setClipEnd(Number(e.target.value))}
                  className="w-full bg-[#100E19] border border-white/10 rounded-xl p-2 text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-gray-400 block mb-1">Clip Description / Note</label>
              <input
                type="text"
                placeholder="e.g. Deep dive technical excerpt"
                value={clipNote}
                onChange={(e) => setClipNote(e.target.value)}
                className="w-full bg-[#100E19] border border-white/10 rounded-xl p-2 text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2"
            >
              <Bookmark className="w-4 h-4" /> Save & Export Clip Snippet
            </button>
          </form>

          {/* Saved Clips List */}
          <div className="space-y-2">
            <div className="font-bold text-gray-300">Saved Video Clips ({savedClips.length})</div>
            {savedClips.length === 0 ? (
              <div className="p-6 bg-[#0E0C16] rounded-2xl text-center text-gray-500 border border-white/5">
                No saved clips yet. Generate your first video snippet above!
              </div>
            ) : (
              <div className="space-y-2">
                {savedClips.map((clip) => (
                  <div
                    key={clip.id}
                    className="p-3 bg-[#181625] border border-white/5 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onSeekTo(clip.startTime)}
                        className="p-2.5 rounded-xl bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600 hover:text-white transition-all"
                      >
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                      <div>
                        <div className="font-semibold text-white">{clip.note}</div>
                        <div className="text-gray-400 font-mono text-[11px]">
                          {clip.startTimeFormatted} - {clip.endTimeFormatted}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => removeClip(clip.id)}
                      className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all text-[11px]"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Telemetry */}
      {activeTab === 'telemetry' && (
        <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
          <div className="bg-[#181625] border border-emerald-500/30 rounded-2xl p-4 space-y-4">
            <div className="font-bold text-emerald-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>CineMorph Telemetry & Real-Time Performance Monitor</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#0E0C16] rounded-xl border border-white/5 flex items-center gap-3">
                <Gauge className="w-6 h-6 text-emerald-400" />
                <div>
                  <div className="text-gray-400 text-[10px] uppercase">Frame Rate Target</div>
                  <div className="text-lg font-bold text-emerald-300 font-mono">{telemetry.fps} FPS</div>
                </div>
              </div>

              <div className="p-3 bg-[#0E0C16] rounded-xl border border-white/5 flex items-center gap-3">
                <Cpu className="w-6 h-6 text-cyan-400" />
                <div>
                  <div className="text-gray-400 text-[10px] uppercase">CPU Load Estimate</div>
                  <div className="text-lg font-bold text-cyan-300 font-mono">{telemetry.cpuLoadPercent}%</div>
                </div>
              </div>

              <div className="p-3 bg-[#0E0C16] rounded-xl border border-white/5 flex items-center gap-3">
                <HardDrive className="w-6 h-6 text-purple-400" />
                <div>
                  <div className="text-gray-400 text-[10px] uppercase">JS Heap Memory</div>
                  <div className="text-lg font-bold text-purple-300 font-mono">{telemetry.memoryMb} MB</div>
                </div>
              </div>

              <div className="p-3 bg-[#0E0C16] rounded-xl border border-white/5 flex items-center gap-3">
                <Zap className="w-6 h-6 text-amber-400" />
                <div>
                  <div className="text-gray-400 text-[10px] uppercase">WebGL Ambient Shader</div>
                  <div className="text-lg font-bold text-amber-300 font-mono">ACTIVE (60fps)</div>
                </div>
              </div>
            </div>

            {/* Autonomous Discovery Pipeline Observability Logs */}
            <div className="border-t border-white/10 pt-3 space-y-2">
              <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Autonomous Discovery Diagnostics</div>
              {observabilityService.getRecords().slice(0, 3).map((rec) => (
                <div key={rec.id} className="p-2.5 bg-[#0A0912] rounded-xl border border-white/5 text-[11px] font-mono space-y-1">
                  <div className="flex items-center justify-between text-purple-300 font-bold">
                    <span>Query: "{rec.query}"</span>
                    <span className="text-emerald-400">{rec.finalStatus}</span>
                  </div>
                  <div className="grid grid-cols-2 text-gray-400 text-[10px] gap-1">
                    <span>Latency: {rec.searchLatencyMs}ms</span>
                    <span>Candidates: {rec.candidateCount}</span>
                    <span>Language: {rec.detectedLanguage}</span>
                    <span>Strategy: {rec.strategyUsed}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
