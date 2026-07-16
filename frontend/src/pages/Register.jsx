import React from 'react';
import { Cpu } from 'lucide-react';

export default function Register() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-8">
        
        {/* Branding header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-cyan-950 border border-cyan-500/30 rounded-xl flex items-center justify-center text-cyan-400">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-xl font-black text-white mt-4 tracking-wide">Register Secure Node</h2>
          <p className="text-slate-500 text-xs mt-1 text-center">Encrypt your locally generated setups</p>
        </div>

        {/* Signup form */}
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Full Name</label>
            <input 
              type="text" 
              placeholder="Enter your name" 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-cyan-500/40"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Email Node</label>
            <input 
              type="email" 
              placeholder="yournode@domain.com" 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-cyan-500/40"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Password</label>
            <input 
              type="password" 
              placeholder="Create strong key" 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-cyan-500/40"
            />
          </div>
          <button className="w-full mt-2 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors">
            Generate Node Credentials
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Already synced? <a href="/login" className="text-cyan-400 hover:underline">Sign In</a>
        </p>

      </div>
    </div>
  );
}