import React from 'react';

interface WaveformProps {
  isPlaying: boolean;
}

const Waveform: React.FC<WaveformProps> = ({ isPlaying }) => {
  return (
    <div className="flex items-center justify-center gap-1 h-12 w-full max-w-xs mx-auto overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className={`w-1 bg-cyan-400 rounded-full transition-all duration-300 ease-in-out ${
            isPlaying ? 'animate-music-bar' : 'h-1 opacity-50'
          }`}
          style={{
            animationDelay: `${i * 0.05}s`,
            height: isPlaying ? undefined : '4px'
          }}
        />
      ))}
      <style>{`
        @keyframes music-bar {
          0%, 100% { height: 10%; opacity: 0.5; }
          50% { height: 100%; opacity: 1; }
        }
        .animate-music-bar {
          animation: music-bar 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Waveform;
