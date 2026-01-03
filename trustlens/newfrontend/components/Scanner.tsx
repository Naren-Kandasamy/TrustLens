import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Image as ImageIcon, Scan, Loader2, ShieldCheck, ScanFace } from 'lucide-react';
import { Card } from './ui/Card';

interface ScannerProps {
  onFileSelect: (file: File) => void;
  onScan: () => void;
  previewUrl: string | null;
  isLoading: boolean;
}

export const Scanner: React.FC<ScannerProps> = ({ onFileSelect, onScan, previewUrl, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-2xl"
    >
      <div className="text-center mb-10">
        <h2 className="text-5xl font-black tracking-tighter mb-4 text-white uppercase italic">
          Secure Your Snapshot
        </h2>
        <p className="text-zinc-500 text-sm font-medium max-w-md mx-auto leading-relaxed">
          Upload an image to detect hidden metadata, faces, and potential manipulations before you share it.
        </p>
      </div>

      <Card className="p-8 bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
        {!previewUrl ? (
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 rounded-2xl p-16 transition-all cursor-pointer group text-center"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])} 
              accept="image/*"
            />
            <div className="bg-zinc-800 p-4 rounded-full w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Upload className="text-zinc-400 group-hover:text-emerald-500" size={32} />
            </div>
            <p className="text-zinc-300 font-bold uppercase tracking-widest text-xs">Drop Image or Click to Browse</p>
            <p className="text-zinc-600 text-[10px] mt-2 font-mono">PNG, JPG, WEBP • MAX 10MB</p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative w-40 h-40 shrink-0">
                <img 
                  src={previewUrl} 
                  className="w-full h-full object-cover rounded-xl border border-zinc-700 shadow-2xl" 
                  alt="Preview" 
                />
                <div className="absolute inset-0 bg-emerald-500/10 rounded-xl" />
            </div>
            
            <div className="flex-grow text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2 text-emerald-400">
                    <ImageIcon size={18} />
                    <span className="font-black text-xs uppercase tracking-widest">Image Ready</span>
                </div>
                <p className="text-zinc-400 text-sm mb-6 font-medium">
                    Your image is loaded and ready for privacy analysis.
                </p>
                
                <button
                  onClick={onScan}
                  disabled={isLoading}
                  className="w-full sm:w-auto flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 text-black font-black py-4 px-8 rounded-xl transition-all shadow-lg shadow-emerald-500/20 uppercase tracking-widest text-xs active:scale-95"
                >
                  {isLoading ? (
                    <>
                        <Loader2 className="animate-spin" size={20} />
                        Scanning...
                    </>
                  ) : (
                    <>
                        <Scan size={20} />
                        Scan Image
                    </>
                  )}
                </button>
            </div>
          </div>
        )}
      </Card>

      <div className="mt-8 flex justify-center gap-8 opacity-30 grayscale">
          <div className="flex items-center gap-2">
              <ShieldCheck size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Metadata Scrub</span>
          </div>
          <div className="flex items-center gap-2">
              <ScanFace size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Face Anonymize</span>
          </div>
      </div>
    </motion.div>
  );
};