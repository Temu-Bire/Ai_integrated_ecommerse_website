import React from 'react';
import { Cpu } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-900 bg-slate-950 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        
        {/* Logo Frame */}
        <div className="flex items-center gap-2 font-bold text-base tracking-wider text-slate-400">
          <Cpu className="w-5 h-5 text-cyan-500" />
          <span>AETHER<span className="text-white">GEAR</span></span>
        </div>

        {/* Copyright and Privacy Promise */}
        <p className="text-xs text-slate-500 text-center sm:text-right leading-relaxed">
          &copy; {new Date().getFullYear()} AetherGear Inc. <br className="sm:hidden" />
          <span className="text-slate-600">All smart engines run securely on-device.</span>
        </p>

      </div>
    </footer>
  );
}