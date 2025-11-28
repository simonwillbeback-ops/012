import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Play, Pause, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { AppStatus, ImageSize, MeditationSession } from './types';
import * as AIService from './services/gemini'; // Keeping filename but content is now generic AI
import ChatBot from './components/ChatBot';
import Waveform from './components/Waveform';
import LoadingState from './components/LoadingState';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [topic, setTopic] = useState('');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [session, setSession] = useState<MeditationSession | null>(null);
  
  // Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'chat'>('create');
  const [error, setError] = useState<string | null>(null);

  // TTS Ref
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Cleanup TTS on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleCreateSession = async () => {
    if (!topic.trim()) return;
    
    // Stop any current audio
    window.speechSynthesis.cancel();
    setIsPlaying(false);

    setStatus(AppStatus.PROCESSING);
    setError(null);
    setSession(null);

    try {
      // 1. Generate Script (Free AI)
      const script = await AIService.generateMeditationScript(topic);
      
      // 2. Generate Image (Free AI)
      const imageUrl = await AIService.generateMeditationImage(topic, imageSize);

      setSession({
        topic,
        script,
        audioUrl: '', // Not used for TTS
        imageUrl
      });
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create your session. Please check your connection.");
      setStatus(AppStatus.ERROR);
    }
  };

  const togglePlay = () => {
    if (!session) return;

    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      } else {
        // Start fresh
        const utterance = new SpeechSynthesisUtterance(session.script);
        utterance.rate = 0.85; // Slower for meditation
        utterance.pitch = 0.9; // Slightly deeper
        
        // Try to find a good English voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes("Google US English")) || 
                               voices.find(v => v.lang.includes("en-US")) || 
                               voices[0];
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      }
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-cyan-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-cyan-500 to-indigo-600 p-1.5 md:p-2 rounded-lg shadow-lg shadow-cyan-900/20">
              <Sparkles className="text-white w-4 h-4 md:w-5 md:h-5" />
            </div>
            <h1 className="text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-200 to-indigo-300">
              MindfulGen AI
            </h1>
          </div>
          
          <nav className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
                activeTab === 'create' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
                activeTab === 'chat' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Chat
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-grow max-w-6xl w-full mx-auto p-4 md:p-8 flex flex-col items-center justify-start md:justify-center">
        
        {activeTab === 'chat' && (
          <div className="w-full flex justify-center animate-in fade-in slide-in-from-bottom-4 h-full">
            <div className="w-full max-w-md h-[70vh] min-h-[400px]">
              <ChatBot />
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="w-full max-w-4xl space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4">
            
            {/* Input Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-8 shadow-2xl relative overflow-hidden">
               {/* Background decoration */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

              <div className="relative z-10 flex flex-col md:flex-row gap-6 items-end">
                <div className="flex-grow w-full space-y-2">
                  <label className="text-sm font-medium text-slate-400 ml-1">What brings you peace?</label>
                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="E.g., A quiet morning walk in a foggy pine forest..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none h-32 transition-all placeholder-slate-600 appearance-none"
                  />
                </div>
                
                <div className="flex flex-col gap-3 w-full md:w-auto min-w-[200px]">
                   <div className="space-y-1">
                     <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <ImageIcon size={12}/> Visual Style
                     </label>
                     <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-700">
                        {(['1K', '2K', '4K'] as ImageSize[]).map((size) => (
                           <button
                             key={size}
                             onClick={() => setImageSize(size)}
                             className={`text-xs font-medium py-2 rounded-lg transition-colors ${
                               imageSize === size ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'
                             }`}
                           >
                             {size}
                           </button>
                        ))}
                     </div>
                   </div>

                   <button
                    onClick={handleCreateSession}
                    disabled={status === AppStatus.PROCESSING || !topic}
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-cyan-500/25 transition-all active:scale-95 flex items-center justify-center gap-2 w-full md:w-auto"
                  >
                    {status === AppStatus.PROCESSING ? (
                      <RefreshCw className="animate-spin w-5 h-5" />
                    ) : (
                      <Sparkles className="w-5 h-5" />
                    )}
                    Generate
                  </button>
                </div>
              </div>
              
              {/* Footer / Credits */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                 <div>
                    Powered by Open Source AI (Pollinations) & Browser TTS
                 </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-200 rounded-lg text-sm text-center">
                  <p className="font-semibold text-red-400">Error</p>
                  <p>{error}</p>
                </div>
              )}
            </div>

            {/* Loading */}
            {status === AppStatus.PROCESSING && (
              <div className="py-12">
                <LoadingState />
              </div>
            )}

            {/* Result Player */}
            {status === AppStatus.SUCCESS && session && (
              <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl group border border-slate-800">
                {/* Background Image */}
                <img 
                  src={session.imageUrl} 
                  alt={session.topic}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-[20s] ease-linear scale-100 group-hover:scale-110"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-80" />

                {/* Content */}
                <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end items-center text-center">
                  
                  <div className="mb-auto w-full flex justify-end">
                      <div className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-[10px] md:text-xs font-medium border border-white/10">
                        AI Generated
                      </div>
                  </div>

                  <h2 className="text-2xl md:text-4xl font-light text-white mb-2 drop-shadow-lg tracking-wide line-clamp-1">
                    {session.topic}
                  </h2>
                  <p className="text-slate-300 max-w-2xl text-xs md:text-base line-clamp-2 md:line-clamp-3 mb-6 md:mb-8 opacity-90 font-light hidden md:block">
                    "{session.script.slice(0, 150)}..."
                  </p>

                  <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 md:p-4 flex items-center gap-4">
                    <button 
                      onClick={togglePlay}
                      className="w-12 h-12 md:w-14 md:h-14 bg-white text-slate-950 rounded-full flex items-center justify-center hover:bg-cyan-50 transition-colors shadow-xl shrink-0"
                    >
                      {isPlaying ? <Pause className="fill-current w-5 h-5 md:w-6 md:h-6" /> : <Play className="fill-current ml-1 w-5 h-5 md:w-6 md:h-6" />}
                    </button>
                    
                    <div className="flex-grow h-10 md:h-12 flex items-center justify-center">
                       {isPlaying ? <Waveform isPlaying={true} /> : <div className="h-0.5 w-full bg-white/20 rounded-full"></div>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
