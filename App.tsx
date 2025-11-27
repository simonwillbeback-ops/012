import React, { useState, useRef } from 'react';
import { Upload, X, Wand2, Download, AlertCircle, Image as ImageIcon, Eraser } from 'lucide-react';
import { AppStatus, ProcessedImage } from './types';
import { resizeImage, downloadImage } from './services/imageUtils';
import { removeWatermark } from './services/geminiService';
import ComparisonSlider from './components/ComparisonSlider';
import LoadingState from './components/LoadingState';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [images, setImages] = useState<ProcessedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }

    try {
      setError(null);
      // Resize immediately for performance/preview
      const base64 = await resizeImage(file);
      setImages({ original: base64, result: '' });
      setStatus(AppStatus.IDLE); // Ready to process
    } catch (err) {
      setError('Failed to process image file.');
      console.error(err);
    }
  };

  const handleProcess = async () => {
    if (!images?.original) return;

    setStatus(AppStatus.PROCESSING);
    setError(null);

    try {
      const resultBase64 = await removeWatermark(images.original, customPrompt);
      setImages(prev => prev ? { ...prev, result: resultBase64 } : null);
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      setStatus(AppStatus.ERROR);
      setError(err.message || 'An unexpected error occurred while processing with Gemini.');
    }
  };

  const handleReset = () => {
    setImages(null);
    setStatus(AppStatus.IDLE);
    setError(null);
    setCustomPrompt('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = () => {
    if (images?.result) {
      downloadImage(images.result, 'clearview-result.jpg');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-2 rounded-lg">
              <Eraser className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
              ClearView AI
            </h1>
          </div>
          <div className="text-sm text-slate-400 font-medium">
            Powered by Gemini 2.5 Flash
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center p-4 md:p-8">
        <div className="w-full max-w-5xl space-y-8">
          
          {/* Hero / Introduction */}
          {!images && (
            <div className="text-center space-y-4 py-12">
              <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                Vanish Watermarks in <span className="text-cyan-400">Seconds</span>
              </h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                Upload your image and let our AI intelligent model detect and remove unwanted watermarks, logos, and text overlays while preserving the background.
              </p>
            </div>
          )}

          {/* Upload Section */}
          {!images && (
            <div 
              className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 hover:bg-slate-900/50 transition-all rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer group bg-slate-900/30"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-xl">
                <Upload className="w-10 h-10 text-cyan-400" />
              </div>
              <p className="text-xl font-semibold text-white mb-2">Click to upload or drag and drop</p>
              <p className="text-slate-500">Supported formats: JPG, PNG, WEBP</p>
            </div>
          )}

          {/* Processing Area */}
          {images && status !== AppStatus.SUCCESS && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ImageIcon size={20} className="text-cyan-400"/> Original Image
                </h3>
                <button 
                  onClick={handleReset} 
                  className="text-slate-400 hover:text-red-400 transition-colors"
                  title="Remove image"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Image Preview Container */}
              <div className="relative w-full h-96 bg-slate-950 rounded-xl overflow-hidden mb-6 flex items-center justify-center border border-slate-800">
                 {status === AppStatus.PROCESSING ? (
                   <LoadingState />
                 ) : (
                   <img 
                    src={images.original} 
                    alt="Original" 
                    className="max-h-full max-w-full object-contain"
                   />
                 )}
              </div>

              {/* Controls */}
              {status !== AppStatus.PROCESSING && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Custom Instructions (Optional)
                    </label>
                    <input
                      type="text"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="e.g. Remove the logo in the bottom right corner..."
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-slate-600 transition-all"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Leave empty for auto-detection.
                    </p>
                  </div>

                  <button
                    onClick={handleProcess}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-cyan-500/20 active:scale-[0.99]"
                  >
                    <Wand2 className="w-5 h-5" />
                    Remove Watermark
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {status === AppStatus.ERROR && error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl flex items-center gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <p>{error}</p>
              <button 
                onClick={() => setStatus(AppStatus.IDLE)} 
                className="ml-auto text-sm font-semibold hover:underline"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Success / Result View */}
          {status === AppStatus.SUCCESS && images?.result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">Result</h3>
                <div className="flex gap-3">
                  <button 
                    onClick={handleReset}
                    className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors font-medium"
                  >
                    Upload Another
                  </button>
                  <button 
                    onClick={handleDownload}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg transition-all"
                  >
                    <Download size={18} />
                    Download Result
                  </button>
                </div>
              </div>

              <div className="bg-slate-900 p-1 rounded-2xl border border-slate-800 shadow-2xl">
                <ComparisonSlider beforeImage={images.original} afterImage={images.result} />
              </div>
              
              <div className="text-center text-slate-500 text-sm">
                Drag the slider to compare before and after
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500">
          <p>&copy; {new Date().getFullYear()} ClearView AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
