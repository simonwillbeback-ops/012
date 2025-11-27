import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

const LoadingState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-6 text-center animate-in fade-in zoom-in duration-300">
      <div className="relative">
        <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
        <div className="relative bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <Sparkles className="w-12 h-12 text-cyan-400 animate-pulse" />
        </div>
        <div className="absolute -top-2 -right-2">
          <Loader2 className="w-6 h-6 text-cyan-300 animate-spin" />
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-white">AI is working its magic...</h3>
        <p className="text-slate-400 max-w-md">
          Analyzing image structure, identifying watermarks, and reconstructing background details. This usually takes about 5-10 seconds.
        </p>
      </div>

      <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-cyan-500 animate-loading-slide w-1/2 rounded-full relative"></div>
      </div>
    </div>
  );
};

export default LoadingState;