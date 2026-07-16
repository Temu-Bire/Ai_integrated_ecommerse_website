import React from 'react';
import {
  Laptop,
  ShoppingCart,
  User,
  Menu
} from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-900">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <a
          href="/"
          className="flex items-center gap-2 font-bold text-xl tracking-wide text-cyan-400"
        >
          <Laptop className="w-6 h-6" />
          <span>
            X <span className="text-white">Electronics</span>
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">

          <a
            href="/"
            className="hover:text-cyan-400 transition-colors"
          >
            Home
          </a>

          <a
            href="/products"
            className="hover:text-cyan-400 transition-colors"
          >
            Products
          </a>

          <a
            href="/categories"
            className="hover:text-cyan-400 transition-colors"
          >
            Categories
          </a>

          <a
            href="/about"
            className="hover:text-cyan-400 transition-colors"
          >
            About
          </a>

          <a
            href="/contact"
            className="hover:text-cyan-400 transition-colors"
          >
            Contact
          </a>

        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-4">

          {/* Cart */}
          <a
            href="/cart"
            className="relative p-2 text-slate-400 hover:text-white transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />

            {/* Cart Count */}
            <span className="absolute -top-1 -right-1 bg-cyan-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
              0
            </span>
          </a>

          {/* Login/Profile */}
          <a
            href="/login"
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <User className="w-5 h-5" />
          </a>

          {/* Mobile Menu */}
          <button
            className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

        </div>

      </div>
    </header>
  );
}