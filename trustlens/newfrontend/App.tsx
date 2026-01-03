import React, { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldCheck, ServerCrash, SearchCheck, ScanFace } from 'lucide-react';

// Import our custom components
import { Scanner } from './components/Scanner';
import { CommandCenter } from './components/CommandCenter';
import { SafeMode } from './components/SafeMode';
import { Validator } from './components/Validator';

// Import Services & Types
import { scanImage, protectImage } from './services/api';
import type { ScanResult } from './types';

type AppState = 'scanner' | 'command_center' | 'safe_mode';
type NavView = 'protect' | 'verify';

const App: React.FC = () => {
  // Navigation State
  const [navView, setNavView] = useState<NavView>('protect');
  
  // App Logic State
  const [appState, setAppState] = useState<AppState>('scanner');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Image & Result State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [protectedImageUrl, setProtectedImageUrl] = useState<string | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  // Cleanup URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (protectedImageUrl) URL.revokeObjectURL(protectedImageUrl);
    };
  }, [previewUrl, protectedImageUrl]);

  const handleFileSelect = useCallback((file: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setUploadedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setError(null);
  }, [previewUrl]);

  const handleScan = async () => {
    if (!uploadedFile) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await scanImage(uploadedFile);
      setScanResult(result);
      setAppState('command_center');
    } catch (err) {
      console.error(err);
      setError('Failed to scan. Ensure backend is running on port 8000.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProtection = async (action: string, brushData?: number[]) => {
    if (!scanResult?.session_id) {
        setError("Session expired. Please upload again.");
        return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Cast the action string to the expected union type for TS, assuming validation is loose or handled
      // Actually, let's fix the type safety if we can, or just cast it.
      const blob = await protectImage(
        action as any, 
        selectedIndices, 
        scanResult.session_id,
        brushData
      );
      
      if (protectedImageUrl) URL.revokeObjectURL(protectedImageUrl);
      // Create object URL from the PNG blob
      const url = URL.createObjectURL(blob);
      setProtectedImageUrl(url);
      setAppState('safe_mode');
    } catch (err) {
      console.error(err);
      setError('Protection process failed.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (protectedImageUrl) URL.revokeObjectURL(protectedImageUrl);

    setAppState('scanner');
    setIsLoading(false);
    setError(null);
    setUploadedFile(null);
    setPreviewUrl(null);
    setScanResult(null);
    setProtectedImageUrl(null);
    setSelectedIndices([]);
  };
  
  const toggleIndex = (index: number) => {
    setSelectedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-emerald-500/30">
      
      {/* 1. TOP NAVIGATION BAR */}
      <nav className="border-b border-zinc-800 bg-black/60 backdrop-blur-xl sticky top-0 z-[100] h-16">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={handleReset}
          >
            <div className="p-1.5 bg-emerald-500 rounded-lg group-hover:rotate-12 transition-transform">
                <ShieldCheck className="text-black" size={20} />
            </div>
            <h1 className="text-lg font-black tracking-tighter uppercase italic text-zinc-100">
                TrustLens
            </h1>
          </div>
          
          <div className="flex gap-2 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
            <button 
              onClick={() => { setNavView('protect'); handleReset(); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all ${
                navView === 'protect' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              <ScanFace size={14} />
              Protect Asset
            </button>
            <button 
              onClick={() => setNavView('verify')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all ${
                navView === 'verify' ? 'bg-sky-500 text-black shadow-lg shadow-sky-500/20' : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              <SearchCheck size={14} />
              Verify Signature
            </button>
          </div>
        </div>
      </nav>

      {/* 2. MAIN CONTENT AREA */}
      <main className="relative max-w-7xl mx-auto p-6 min-h-[calc(100vh-64px)] flex items-center justify-center">
        <AnimatePresence mode="wait">
          
          {/* VIEW A: SIGNATURE VALIDATOR */}
          {navView === 'verify' ? (
            <Validator key="validator-view" />
          ) : (
            
            /* VIEW B: PROTECTION WORKFLOW */
            <React.Fragment key="protect-view">
                {appState === 'scanner' && (
                    <Scanner 
                        onFileSelect={handleFileSelect} 
                        onScan={handleScan}
                        previewUrl={previewUrl}
                        isLoading={isLoading}
                    />
                )}
                
                {appState === 'command_center' && previewUrl && scanResult && (
                    <CommandCenter
                        imageUrl={previewUrl}
                        scanResult={scanResult}
                        selectedIndices={selectedIndices}
                        onToggleIndex={toggleIndex}
                        onProtect={handleProtection}
                        onStartOver={handleReset}
                        isLoading={isLoading}
                    />
                )}
                
                {appState === 'safe_mode' && protectedImageUrl && (
                    <SafeMode
                        imageUrl={protectedImageUrl}
                        onStartOver={handleReset}
                    />
                )}
            </React.Fragment>
          )}
        </AnimatePresence>
      </main>

      {/* 3. GLOBAL ERROR TOAST */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] w-full max-w-md px-4"
          >
            <div className="bg-rose-500 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-rose-400">
                <div className="bg-white/20 p-2 rounded-lg">
                    <ServerCrash size={20} />
                </div>
                <div>
                    <p className="text-xs font-black uppercase tracking-tight">System Interrupt</p>
                    <p className="text-sm font-medium opacity-90">{error}</p>
                </div>
                <button 
                    onClick={() => setError(null)}
                    className="ml-auto text-xs font-bold hover:underline"
                >
                    Dismiss
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;