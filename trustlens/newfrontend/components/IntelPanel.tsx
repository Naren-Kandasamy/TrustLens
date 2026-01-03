import React from 'react';
import { Shield, Fingerprint, Activity, Globe, CheckCircle2, User } from 'lucide-react';
import type { ScanResult } from '../types';

export const IntelPanel: React.FC<{ scanResult: ScanResult; imageUrl: string }> = ({ scanResult, imageUrl }) => {
  return (
    <div className="h-full overflow-hidden bg-zinc-950 p-8 flex flex-col font-sans">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-6 mb-8 shrink-0">
        <div className="flex items-center gap-4">
          <Activity className="text-emerald-500 animate-pulse" size={20} />
          <h2 className="text-sm font-black uppercase tracking-[0.4em] text-zinc-100 italic">Forensic Intelligence Audit</h2>
        </div>
        <CheckCircle2 className="text-emerald-500" size={20} />
      </div>

      <div className="grid grid-cols-12 gap-8 flex-grow overflow-hidden">
        {/* LOG FEED */}
        <div className="col-span-8 space-y-6 overflow-y-auto custom-scrollbar pr-4 pb-12">
          {/* GEOSPATIAL DATA */}
          <section className="p-8 bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem]">
            <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">
              <Globe size={14} className="text-emerald-500" /> Geospatial Registry
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/60 p-5 rounded-3xl border border-zinc-800">
                <span className="text-[8px] text-zinc-600 uppercase block font-black mb-1 italic">GPS Origin</span>
                <code className="text-[11px] text-emerald-400 font-mono">{scanResult.meta?.gps || "BUFFER_CLEAN"}</code>
              </div>
              <div className="bg-black/60 p-5 rounded-3xl border border-zinc-800">
                <span className="text-[8px] text-zinc-600 uppercase block font-black mb-1 italic">Hardware ID</span>
                <code className="text-[11px] text-zinc-400 font-mono">{scanResult.meta?.model || "VIRTUAL_SENSOR"}</code>
              </div>
            </div>
          </section>

          {/* VISUAL BIOMETRIC INVENTORY */}
          <section className="p-8 bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem]">
            <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6">
              <Fingerprint size={14} className="text-emerald-500" /> Biometric Identity Log
            </div>
            <div className="grid grid-cols-1 gap-3">
              {scanResult.detections.map((f, i) => (
                <div key={i} className="flex items-center gap-6 p-4 bg-black/40 border border-zinc-800 rounded-[1.8rem] hover:bg-emerald-500/5 transition-all group">
                  {/* VISUAL FACE THUMBNAIL */}
                  <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 group-hover:border-emerald-500/50 shadow-xl">
                    {f.thumbnail ? (
                      <img src={f.thumbnail} alt={f.id} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-800 font-black">ID_{i+1}</div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-2">
                       <p className="text-[11px] font-black text-zinc-100 uppercase tracking-widest">{f.id}</p>
                       <p className="text-[9px] font-mono text-emerald-500/80">CONF: {((f.confidence || 0) * 100).toFixed(2)}%</p>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${(f.confidence || 0) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ASSET PREVIEW MODULE */}
        <div className="col-span-4 flex flex-col gap-6 h-full pb-12">
          <div className="aspect-[3/4] bg-zinc-900/60 border border-zinc-800 rounded-[2.5rem] p-3 relative overflow-hidden shadow-2xl group">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10 opacity-80" />
            <img src={imageUrl} alt="Asset Source" className="w-full h-full object-cover rounded-[1.8rem] opacity-30 grayscale group-hover:grayscale-0 transition-all duration-1000" />
            <div className="absolute bottom-8 left-8 right-8 z-20 text-center">
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 mb-2 inline-block">Source Image Map</span>
            </div>
          </div>
          
          <div className="flex-grow bg-emerald-500/5 border border-emerald-500/20 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-inner">
            <span className="text-7xl font-black text-zinc-100 tracking-tighter leading-none">{scanResult.score}</span>
            <span className="text-[10px] text-zinc-600 uppercase font-black tracking-[0.5em] mt-4 block">Security Index</span>
          </div>
        </div>
      </div>
    </div>
  );
};