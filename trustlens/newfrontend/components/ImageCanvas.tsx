import React from 'react';
import { motion } from 'framer-motion';

interface ImageCanvasProps {
  imageUrl: string;
  detections: any[];
  selectedIndices: number[];
  onToggleIndex: (index: number) => void;
  brushMode: boolean;
  brushPoints?: number[]; // Added prop
  onBrushStroke: (x: number, y: number) => void;
}

export const ImageCanvas: React.FC<ImageCanvasProps> = ({ 
  imageUrl, 
  detections, 
  selectedIndices, 
  onToggleIndex,
  brushMode,
  brushPoints = [], // Default empty
  onBrushStroke
}) => {
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!brushMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onBrushStroke(x, y);
  };

  const [isDrawing, setIsDrawing] = React.useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!brushMode || !isDrawing) return;
    handleCanvasClick(e);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center p-8 bg-black/20 overflow-hidden">
      <div 
        className={`relative inline-block group ${brushMode ? 'cursor-crosshair' : ''}`}
        onMouseDown={() => setIsDrawing(true)}
        onMouseUp={() => setIsDrawing(false)}
        onMouseLeave={() => setIsDrawing(false)}
        onMouseMove={handleMouseMove}
        onClick={handleCanvasClick}
      >
        {/* THE MAIN ASSET */}
        <img 
          src={imageUrl} 
          alt="Scan Target" 
          className="rounded-[2.5rem] shadow-2xl max-h-[70vh] w-auto object-contain border border-zinc-800 pointer-events-none select-none"
        />

        {/* BRUSH STROKES LAYER */}
        <div className="absolute inset-0 pointer-events-none z-10">
            {/* Render brush points as simple circles */}
            {/* We group points x,y so we iterate by 2 */}
            {Array.from({ length: brushPoints.length / 2 }).map((_, i) => {
                const x = brushPoints[i * 2];
                const y = brushPoints[i * 2 + 1];
                return (
                    <div 
                        key={i}
                        className="absolute w-8 h-8 bg-rose-500/50 rounded-full blur-sm transform -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${x}%`, top: `${y}%` }}
                    />
                );
            })}
        </div>

        {/* INTERACTIVE DETECTION OVERLAY */}
        <div className="absolute inset-0 z-20">
          {!brushMode && detections.map((face, i) => {
            const [x, y, w, h] = face.box;
            const isSelected = selectedIndices.includes(i);

            return (
              <div
                key={i}
                onClick={(e) => { e.stopPropagation(); onToggleIndex(i); }}
                className="absolute cursor-pointer group/box transition-all duration-300"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: `${w}%`,
                  height: `${h}%`,
                }}
              >
                {/* Visual Bounding Box */}
                <div className={`absolute inset-0 rounded-xl border-2 transition-all duration-300 ${
                  isSelected 
                    ? 'border-rose-500 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.3)]' 
                    : 'border-emerald-500/40 group-hover/box:border-emerald-400 group-hover/box:bg-emerald-500/5'
                }`} />

                {/* ID Tag Label */}
                <div className={`absolute -top-7 left-0 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border transition-all ${
                  isSelected 
                    ? 'bg-rose-500 border-rose-400 text-white' 
                    : 'bg-zinc-900 border-zinc-800 text-emerald-500 group-hover/box:text-emerald-400'
                }`}>
                  {face.id || `FACE_${i+1}`}
                </div>
              </div>
            );
          })}
          
          {/* BRUSH CURSOR HINT */}
          {brushMode && (
            <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-rose-500/30 rounded-[2.5rem] bg-rose-500/5" />
          )}
        </div>
      </div>
    </div>
  );
};