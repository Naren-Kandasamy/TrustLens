import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Upload, Search, Fingerprint, FileCheck } from 'lucide-react';
import { verifyImage } from '../services/api';

export const Validator: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [result, setResult] = useState<{
        status: 'idle' | 'success' | 'invalid' | 'error';
        message: string;
        signature?: string;
    }>({ status: 'idle', message: '' });

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
            setResult({ status: 'idle', message: '' });
        }
    };

    const runVerification = async () => {
        if (!file) return;
        setIsVerifying(true);
        try {
            // Call the updated API service that handles HMAC verification
            const response = await verifyImage(file);
            
            // UX delay to allow animations to play
            setTimeout(() => {
                if (response.status === 'SUCCESS') {
                    setResult({
                        status: 'success',
                        message: response.message || 'Authentic & Untampered',
                        signature: response.signature
                    });
                } else {
                    setResult({
                        status: 'invalid',
                        message: response.message || 'Verification Failed: Image may be manipulated.',
                    });
                }
                setIsVerifying(false);
            }, 800);
            
        } catch (err) {
            setResult({ status: 'error', message: 'System error during verification.' });
            setIsVerifying(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 mt-10">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/png"
            />
            
            <div className="bg-zinc-900/50 rounded-[3rem] shadow-2xl overflow-hidden border border-zinc-800">
                <div className="p-8 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-zinc-100 flex items-center gap-3">
                            <Fingerprint className="text-sky-500" />
                            Signature Validator
                        </h2>
                        <p className="text-zinc-500 text-sm font-medium mt-1">
                            Verify the cryptographic integrity of TrustLens images.
                        </p>
                    </div>
                </div>

                <div className="p-8">
                    {!preview ? (
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-zinc-800 rounded-3xl p-16 flex flex-col items-center justify-center gap-6 hover:border-sky-500/50 hover:bg-zinc-800/30 transition-all cursor-pointer group"
                        >
                            <div className="bg-zinc-800 text-zinc-400 p-5 rounded-2xl group-hover:scale-110 group-hover:text-sky-400 transition-all">
                                <Upload size={40} />
                            </div>
                            <div className="text-center">
                                <span className="font-bold text-zinc-300 block text-lg">Drop signed PNG here</span>
                                <span className="text-zinc-500 text-sm mt-1 block italic">Cryptographic LSB check</span>
                            </div>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="relative rounded-2xl overflow-hidden border border-zinc-800 aspect-square bg-black/40">
                                <img src={preview} alt="Verify" className="w-full h-full object-contain" />
                                <button 
                                    onClick={() => { setPreview(null); setFile(null); setResult({status: 'idle', message: ''}); }}
                                    className="absolute top-4 right-4 bg-zinc-900/90 backdrop-blur shadow-lg px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider text-zinc-300 hover:text-white border border-zinc-800 transition-colors"
                                >
                                    Change Image
                                </button>
                            </div>

                            <div className="flex flex-col justify-center">
                                <AnimatePresence mode="wait">
                                    {result.status === 'idle' ? (
                                        <motion.div
                                            key="idle-state"
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            className="space-y-6"
                                        >
                                            <div className="bg-zinc-800/50 p-6 rounded-2xl border border-zinc-800">
                                                <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">File Ready</p>
                                                <p className="text-sm font-mono text-sky-400 truncate">{file?.name}</p>
                                            </div>
                                            
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={runVerification}
                                                disabled={isVerifying}
                                                className="w-full bg-sky-500 text-black py-5 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-sky-500/10 disabled:opacity-50 transition-all"
                                            >
                                                {isVerifying ? (
                                                    <span className="flex items-center gap-2 animate-pulse">
                                                        <Search size={20} className="animate-bounce" />
                                                        SCANNING LSB LAYER...
                                                    </span>
                                                ) : (
                                                    <>VERIFY INTEGRITY <ShieldCheck size={20} /></>
                                                )}
                                            </motion.button>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="result-state"
                                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                            className={`p-8 rounded-[2rem] border-2 ${
                                                result.status === 'success' 
                                                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' 
                                                : 'bg-rose-500/5 border-rose-500/20 text-rose-500'
                                            }`}
                                        >
                                            <div className="flex items-center gap-5 mb-6">
                                                <div className={`p-4 rounded-2xl ${result.status === 'success' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                                                    {result.status === 'success' ? <FileCheck size={32} /> : <ShieldAlert size={32} />}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Result</p>
                                                    <p className="text-2xl font-black tracking-tight">
                                                        {result.status === 'success' ? 'AUTHENTIC' : 'TAMPERED'}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <p className={`text-sm font-medium mb-6 p-4 rounded-xl bg-black/20 border ${result.status === 'success' ? 'border-emerald-500/10' : 'border-rose-500/10'}`}>
                                                {result.message}
                                            </p>

                                            {result.signature && (
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Cryptographic Key</p>
                                                    <div className="bg-black/40 p-4 rounded-xl border border-emerald-500/10 font-mono text-xs break-all leading-relaxed">
                                                        {result.signature}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <button 
                                                onClick={() => setResult({ status: 'idle', message: '' })}
                                                className="mt-8 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors w-full text-center"
                                            >
                                                Verify Another File
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};