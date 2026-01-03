import React from 'react';
import { motion } from 'framer-motion';
import { EyeOff, Waves, Loader2, Eraser, Sparkles } from 'lucide-react';

interface ActionBarProps {
  onProtect: (action: 'blur_selected' | 'cloak' | 'strip_metadata' | 'auto_fix') => void;
  isLoading: boolean;
  selectedCount: number;
  hasFaceDetections: boolean;
}

const ActionButton: React.FC<{
    onClick: () => void;
    disabled?: boolean;
    isLoading: boolean;
    icon: React.ReactNode;
    children: React.ReactNode;
    className: string;
}> = ({ onClick, disabled, isLoading, icon, children, className }) => (
    <button
        onClick={onClick}
        disabled={disabled || isLoading}
        className={`flex items-center gap-2 font-bold px-4 py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-95 ${className}`}
    >
        {isLoading ? <Loader2 className="animate-spin" size={18} /> : icon}
        <span className="text-sm whitespace-nowrap">{children}</span>
    </button>
);


export const ActionBar: React.FC<ActionBarProps> = ({ onProtect, isLoading, selectedCount, hasFaceDetections }) => {
    
    const barVariants = {
        hidden: { opacity: 0, y: 100 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20, delay: 0.2 } }
    };
    
  return (
    <motion.div
        variants={barVariants}
        initial="hidden"
        animate="visible"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-5xl px-4 pointer-events-none"
    >
      <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-3 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 p-3 rounded-2xl shadow-2xl mx-auto w-fit">
        
        {/* 1. BLUR SELECTED */}
        <ActionButton
            onClick={() => onProtect('blur_selected')}
            disabled={selectedCount === 0}
            isLoading={isLoading}
            icon={<EyeOff size={18} />}
            className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
        >
            Blur ({selectedCount})
        </ActionButton>

        {/* 2. CLOAK FACES */}
        <ActionButton
            onClick={() => onProtect('cloak')}
            disabled={!hasFaceDetections}
            isLoading={isLoading}
            icon={<Waves size={18} />}
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
        >
            Cloak AI
        </ActionButton>

        <div className="w-px h-8 bg-zinc-700 mx-1 hidden sm:block"></div>

        {/* 3. SCRUB METADATA */}
        <ActionButton
            onClick={() => onProtect('strip_metadata')}
            isLoading={isLoading}
            icon={<Eraser size={18} />}
            className="bg-amber-600 hover:bg-amber-500 text-white"
        >
            Scrub Meta
        </ActionButton>

        {/* 4. AUTO FIX ALL */}
        <ActionButton
            onClick={() => onProtect('auto_fix')}
            isLoading={isLoading}
            icon={<Sparkles size={18} />}
            className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20"
        >
            Auto Sanitize
        </ActionButton>

      </div>
    </motion.div>
  );
};