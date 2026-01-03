import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, RotateCcw, Fingerprint, Trash2, ShieldAlert, Loader2, Zap, Lock, EyeOff, CheckCircle2, Paintbrush, FileWarning, Undo2 } from 'lucide-react';
import { ImageCanvas } from './ImageCanvas';
import { IntelPanel } from './IntelPanel';
import { Card } from './ui/Card';
import { protectImage } from '../services/api';
import type { ScanResult } from '../types';

export const CommandCenter: React.FC<{ imageUrl: string; scanResult: ScanResult; selectedIndices: number[]; onToggleIndex: (i: number) => void; onProtect: (a: string) => void; onStartOver: () => void; isLoading: boolean; }> = 
({ imageUrl, scanResult, selectedIndices, onToggleIndex, onProtect, onStartOver, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'intel'>('visual');
  const [actions, setActions] = useState<string[]>([]);
  
  // Brush Tool State
  const [brushMode, setBrushMode] = useState(false);
  const [brushPoints, setBrushPoints] = useState<number[]>([]);

  const toggleAction = (a: string) => setActions(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const handleBrushStroke = (x: number, y: number) => {
    setBrushPoints(prev => [...prev, x, y]);
    if (!actions.includes('manual_brush')) {
        setActions(prev => [...prev, 'manual_brush']);
    }
  };
  
  const handleUndoBrush = () => {
      // Remove last x,y pair
      setBrushPoints(prev => prev.slice(0, -2));
      // If empty, remove the action
      if (brushPoints.length <= 2) { // checks before slice applied
         setActions(prev => prev.filter(a => a !== 'manual_brush'));
      }
  };
  
  const handleExecute = async () => {
      // @ts-ignore
      onProtect(actions.join(','), brushPoints);
  };

  const toolClass = (a: string, color: string) => `
    w-full flex items-center justify-between p-5 rounded-[2rem] border transition-all duration-300
    ${actions.includes(a) ? `bg-${color}-500/10 border-${color}-500/50 shadow-[0_0_20px_rgba(0,0,0,0.3)]` : 'bg-zinc-800/30 border-zinc-800 hover:border-zinc-700'}
  `;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-7xl grid grid-cols-12 gap-8 h-[calc(100vh-140px)] items-start">
      <div className="col-span-8 flex flex-col gap-4 h-full">
        <div className="flex items-center justify-between px-2">
          <div className="flex bg-zinc-900/80 p-2 rounded-2xl border border-zinc-800 shadow-xl gap-2">
            <button onClick={() => { setActiveTab('visual'); setBrushMode(false); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'visual' && !brushMode ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}>Map</button>
            <button onClick={() => { setActiveTab('visual'); setBrushMode(true); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${brushMode ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}>
                <Paintbrush size={12} /> Brush {brushPoints.length > 0 && `(${brushPoints.length/2})`}
            </button>
            {brushMode && brushPoints.length > 0 && (
                 <button onClick={handleUndoBrush} className="px-3 py-2.5 rounded-xl text-zinc-500 hover:text-rose-400 transition-colors">
                     <Undo2 size={16} />
                 </button>
            )}
            <button onClick={() => { setActiveTab('intel'); setBrushMode(false); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'intel' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}>Intel</button>
          </div>
          <button onClick={onStartOver} className="text-zinc-600 hover:text-rose-400 text-[10px] font-black uppercase flex items-center gap-2 transition-colors"><RotateCcw size={14} /> Discard</button>
        </div>
        <div className="flex-grow bg-zinc-950 rounded-[3rem] border border-zinc-800 overflow-hidden shadow-2xl relative">
          <AnimatePresence mode="wait">
            {activeTab === 'visual' ? (
              <motion.div key="v" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full w-full">
                <ImageCanvas 
                    imageUrl={imageUrl} 
                    detections={scanResult.detections} 
                    selectedIndices={selectedIndices} 
                    onToggleIndex={onToggleIndex}
                    brushMode={brushMode}
                    brushPoints={brushPoints}
                    onBrushStroke={handleBrushStroke}
                />
              </motion.div>
            ) : (
              <motion.div key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full w-full">
                <IntelPanel scanResult={scanResult} imageUrl={imageUrl} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="col-span-4 h-full flex flex-col">
        <Card className="p-10 bg-zinc-900/40 border-zinc-800 flex-grow flex flex-col rounded-[3rem]">
          <div className="flex items-center gap-4 mb-10 shrink-0">
            <Fingerprint className="text-emerald-500" size={24} />
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-100 italic">TrustLens  </h3>
          </div>
          
          <div className="space-y-4 overflow-y-auto custom-scrollbar flex-grow pr-1">
            <button onClick={() => toggleAction('visible_blur')} className={toolClass('visible_blur', 'rose')}>
              <div className="flex flex-col items-start"><span className="text-[11px] font-black text-zinc-100 uppercase tracking-widest">Oval Blur</span><span className="text-[9px] text-zinc-500 font-bold uppercase">{selectedIndices.length} Subjects</span></div>
              {actions.includes('visible_blur') ? <CheckCircle2 size={18} className="text-rose-500" /> : <EyeOff size={18} className="text-zinc-600" />}
            </button>
            
            <button onClick={() => toggleAction('redact_data')} className={toolClass('redact_data', 'red')}>
              <div className="flex flex-col items-start"><span className="text-[11px] font-black text-zinc-100 uppercase tracking-widest">Redact Data</span><span className="text-[9px] text-zinc-500 font-bold uppercase">Barcodes / PII</span></div>
              {actions.includes('redact_data') ? <CheckCircle2 size={18} className="text-red-500" /> : <FileWarning size={18} className="text-zinc-600" />}
            </button>

            <button onClick={() => toggleAction('ai_cloak')} className={toolClass('ai_cloak', 'sky')}>
              <div className="flex flex-col items-start"><span className="text-[11px] font-black text-zinc-100 uppercase tracking-widest">AI Cloak</span><span className="text-[9px] text-zinc-500 font-bold uppercase">Anti-Recognition</span></div>
              {actions.includes('ai_cloak') ? <CheckCircle2 size={18} className="text-sky-500" /> : <ShieldAlert size={18} className="text-zinc-600" />}
            </button>
            <button onClick={() => toggleAction('secure_sign')} className={toolClass('secure_sign', 'violet')}>
              <div className="flex flex-col items-start"><span className="text-[11px] font-black text-zinc-100 uppercase tracking-widest">Secure Sign</span><span className="text-[9px] text-zinc-500 font-bold uppercase">Digital Integrity</span></div>
              {actions.includes('secure_sign') ? <CheckCircle2 size={18} className="text-violet-500" /> : <Lock size={18} className="text-zinc-600" />}
            </button>
            <button onClick={() => toggleAction('strip_metadata')} className={toolClass('strip_metadata', 'amber')}>
              <div className="flex flex-col items-start"><span className="text-[11px] font-black text-zinc-100 uppercase tracking-widest">Scrub Meta</span><span className="text-[9px] text-zinc-500 font-bold uppercase">Exif Cleanse</span></div>
              {actions.includes('strip_metadata') ? <CheckCircle2 size={18} className="text-amber-500" /> : <Zap size={18} className="text-zinc-600" />}
            </button>
          </div>
          
          <div className="pt-10 mt-auto shrink-0">
            <button onClick={handleExecute} disabled={isLoading || (actions.length === 0 && selectedIndices.length === 0 && brushPoints.length === 0)} className="w-full bg-emerald-500 py-6 rounded-[2rem] flex items-center justify-center gap-3 transition-all uppercase tracking-[0.3em] text-[11px] font-black text-black shadow-2xl shadow-emerald-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />} Execute Protocol
            </button>
          </div>
        </Card>
      </div>
    </motion.div>
  );
};