import React from 'react';
import { Cpu, ShoppingCart, User, Menu } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-900">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 font-bold text-xl tracking-wider text-cyan-400">
          <Cpu className="w-6 h-6 animate-pulse" />
          <span>AETHER<span className="text-white">GEAR</span></span>
        </a>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="/" className="hover:text-cyan-400 transition-colors">Home</a>
          <a href="/products" className="hover:text-cyan-400 transition-colors">Explore Gear</a>
          <a href="#ai-assistant" className="hover:text-cyan-400 transition-colors">AI Assistant</a>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          {/* Cart Icon */}
          <a href="/cart" className="p-2 text-slate-400 hover:text-white transition-colors relative" aria-label="Cart">
            <ShoppingCart className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-500 rounded-full"></span>
          </a>

          {/* User Icon / Profile */}
          <a href="/login" className="p-2 text-slate-400 hover:text-white transition-colors" aria-label="Profile">
            <User className="w-5 h-5" />
          </a>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2 text-slate-400 hover:text-white transition-colors" aria-label="Menu">
            <Menu className="w-5 h-5" />
          </button>
        </div>

      </div>
    </header>
  );
}