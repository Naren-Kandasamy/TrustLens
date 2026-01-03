import React from 'react';
import { motion } from 'framer-motion';
import { Download, RotateCcw, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { Card } from './ui/Card';

interface SafeModeProps {
  imageUrl: string;
  onStartOver: () => void;
}

export const SafeMode: React.FC<SafeModeProps> = ({ imageUrl, onStartOver }) => {
    
    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0, 
            transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.1 } 
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1 }
    };

  return (
    <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-4xl flex flex-col items-center text-center px-4"
    >
      {/* Success Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-3 text-emerald-400 mb-2">
        <div className="p-2 bg-emerald-500/20 rounded-full">
            <ShieldCheck size={32} />
        </div>
        <h2 className="text-4xl font-black tracking-tighter uppercase italic">Asset Secured</h2>
      </motion.div>
      
      <motion.p variants={itemVariants} className="text-zinc-500 text-sm mb-8 tracking-wide uppercase font-bold">
          All identified vulnerabilities have been neutralized.
      </motion.p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 w-full items-start">
          
          {/* Left Side: Sanitization Audit Log */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4 order-2 lg:order-1">
              <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl text-left relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                  <div className="flex items-center gap-2 mb-4 text-emerald-500">
                      <Sparkles size={16} />
                      <span className="text-xs font-black tracking-widest uppercase">Sanitization Audit</span>
                  </div>
                  
                  <ul className="space-y-4">
                      {[
                          { title: "Privacy Masking", desc: "Applied natural Gaussian falloff to biometric subjects." },
                          { title: "Metadata Purge", desc: "Successfully stripped all GPS and hardware identifiers." },
                          { title: "Digital Integrity", desc: "Re-encoded image stream to neutralize hidden markers." }
                      ].map((item, i) => (
                          <li key={i} className="flex gap-3">
                              <CheckCircle2 size={14} className="text-emerald-500 mt-1 shrink-0" />
                              <div>
                                  <p className="text-xs font-bold text-zinc-200">{item.title}</p>
                                  <p className="text-[10px] text-zinc-500 leading-relaxed">{item.desc}</p>
                              </div>
                          </li>
                      ))}
                  </ul>
              </div>

              <div className="flex flex-col gap-3">
                  <a
                    href={imageUrl}
                    download="guardian_secured_asset.png"
                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/20 active:scale-95 text-sm tracking-widest uppercase"
                  >
                    <Download size={18} />
                    Download Asset
                  </a>
                  <button
                    onClick={onStartOver}
                    className="flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 font-bold py-4 rounded-xl transition-all active:scale-95 text-sm tracking-widest uppercase"
                  >
                    <RotateCcw size={18} />
                    New Mission
                  </button>
              </div>
          </motion.div>

          {/* Right Side: Image Preview */}
          <motion.div variants={itemVariants} className="lg:col-span-3 order-1 lg:order-2">
            <Card className="p-2 bg-black border-zinc-800 shadow-2xl relative group">
                  <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <img 
                      src={imageUrl}
                      alt="Secured Asset"
                      className="w-full h-auto rounded-lg grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
                  />
                  <div className="absolute top-4 right-4 bg-emerald-500 text-black text-[10px] font-black px-2 py-1 rounded tracking-tighter">
                      VERIFIED SAFE
                  </div>
            </Card>
          </motion.div>
      </div>
    </motion.div>
  );
};