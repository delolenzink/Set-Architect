import React from 'react';
import { ListMusic, Compass, Zap, Bot, Download, Plus } from 'lucide-react';

interface MobileBottomNavProps {
  onOpenAddTrack: () => void;
  onOpenCamelot: () => void;
  onOpenDualDeck: () => void;
  onOpenAIMixer: () => void;
  onOpenExport: () => void;
  trackCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenAddTrack,
  onOpenCamelot,
  onOpenDualDeck,
  onOpenAIMixer,
  onOpenExport,
  trackCount,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 px-2 py-1.5 flex items-center justify-around pb-safe">
      <button
        onClick={onOpenAddTrack}
        className="flex flex-col items-center gap-1 text-[10px] font-mono text-[#ff4e00] hover:text-[#ff6e20] p-1.5 transition"
      >
        <div className="p-1 rounded-lg bg-[#ff4e00]/10 border border-[#ff4e00]/30">
          <Plus className="w-4 h-4 stroke-[3]" />
        </div>
        <span>Add</span>
      </button>

      <button
        onClick={onOpenCamelot}
        className="flex flex-col items-center gap-1 text-[10px] font-mono text-cyan-400 hover:text-cyan-300 p-1.5 transition"
      >
        <Compass className="w-4 h-4" />
        <span>Camelot</span>
      </button>

      <button
        onClick={onOpenDualDeck}
        className="flex flex-col items-center gap-1 text-[10px] font-mono text-violet-400 hover:text-violet-300 p-1.5 transition"
      >
        <div className="p-1 rounded-lg bg-violet-500/20 border border-violet-500/40">
          <Zap className="w-4 h-4" />
        </div>
        <span>Decks</span>
      </button>

      <button
        onClick={onOpenAIMixer}
        className="flex flex-col items-center gap-1 text-[10px] font-mono text-blue-400 hover:text-blue-300 p-1.5 transition"
      >
        <Bot className="w-4 h-4" />
        <span>AI Mixer</span>
      </button>

      <button
        onClick={onOpenExport}
        className="flex flex-col items-center gap-1 text-[10px] font-mono text-amber-400 hover:text-amber-300 p-1.5 transition"
      >
        <Download className="w-4 h-4" />
        <span>Export</span>
      </button>
    </nav>
  );
};
