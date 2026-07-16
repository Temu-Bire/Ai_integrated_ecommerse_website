import React from 'react';
import { Cpu } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] w-full gap-4">
      
      {/* Animated Glowing Loader */}
      <div className="relative flex items-center justify-center">
        {/* Outer pulsing ring */}
        <div className="absolute w-12 h-12 rounded-full border border-cyan-500/30 animate-ping"></div>
        {/* Middle spinning ring */}
        <div className="w-10 h-10 rounded-full border-2 border-slate-800 border-t-cyan-400 animate-spin"></div>
        {/* Central Core Icon */}
        <Cpu className="absolute w-5 h-5 text-cyan-400" />
      </div>

      {/* Loading Text */}
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-200 tracking-wider uppercase animate-pulse">
          Optimizing Neural Paths...
        </p>
        <p className="text-xs text-slate-500 mt-1">Loading e-commerce dashboard</p>
      </div>

    </div>
  );
}