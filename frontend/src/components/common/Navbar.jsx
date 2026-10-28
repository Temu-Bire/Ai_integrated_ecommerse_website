import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ShoppingCart,
  User,
  Search,
  Menu,
  X,
  LogOut,
  Package,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { api } from '../../lib/api';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { totalQuantity } = useCart();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [categories, setCategories] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const searchRef = useRef(null);

  // Fetch categories for mega-nav
  useEffect(() => {
    api.getCategories(false).then((data) => {
      if (Array.isArray(data)) setCategories(data.slice(0, 5));
    }).catch(() => {});
  }, []);

  // Debounced autocomplete query
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.autocomplete(searchQuery);
        setSuggestions(res.suggestions || []);
        setShowSuggestions(true);
      } catch (e) {
        setSuggestions([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener for search suggestions
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/90 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-white group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span>
            Nova<span className="text-cyan-400">Mart</span>
          </span>
        </Link>

        {/* Global Search Bar with Autocomplete Dropdown */}
        <div ref={searchRef} className="relative flex-1 max-w-lg hidden md:block">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search products, brands, or ask in plain English..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-full text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
          </form>

          {/* Autocomplete Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="p-2 divide-y divide-slate-800/60">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setShowSuggestions(false);
                      if (s.slug && s.type === 'product') {
                        navigate(`/products/${s.slug}`);
                      } else {
                        navigate(`/products?search=${encodeURIComponent(s.text)}`);
                      }
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/60 hover:text-cyan-400 rounded-lg flex items-center justify-between transition-colors"
                  >
                    <span>{s.text}</span>
                    <span className="text-xs uppercase tracking-wider text-slate-500 bg-slate-950 px-2 py-0.5 rounded">
                      {s.type}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
          <Link to="/" className="hover:text-cyan-400 transition-colors">Home</Link>
          <Link to="/products" className="hover:text-cyan-400 transition-colors">All Products</Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/products?category=${c.slug}`}
              className="hover:text-cyan-400 transition-colors hidden xl:block"
            >
              {c.name}
            </Link>
          ))}
        </nav>

        {/* User Account & Cart Controls */}
        <div className="flex items-center gap-3">
          {/* Cart Icon with Counter */}
          <Link
            to="/cart"
            aria-label="Shopping Cart"
            className="relative p-2.5 text-slate-300 hover:text-cyan-400 hover:bg-slate-900 rounded-full transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            {totalQuantity > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-cyan-500 text-slate-950 text-xs font-bold rounded-full flex items-center justify-center shadow-md animate-pulse">
                {totalQuantity}
              </span>
            )}
          </Link>

          {/* Account Dropdown */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 pl-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-full text-sm font-medium text-slate-200 transition-all"
              >
                <span>{user?.full_name?.split(' ')[0] || 'Account'}</span>
                <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-800">
                    <p className="text-xs text-slate-400">Signed in as</p>
                    <p className="text-sm font-semibold text-white truncate">{user?.email}</p>
                  </div>

                  <Link
                    to="/orders"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-cyan-400"
                  >
                    <Package className="w-4 h-4" /> My Orders
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin/Dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-amber-400 hover:bg-slate-800"
                    >
                      <ShieldCheck className="w-4 h-4" /> Admin Portal
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-800 text-left"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-sm"
            >
              <User className="w-4 h-4" /> Sign In
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white lg:hidden"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800/80 bg-slate-950 px-6 py-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-full text-sm text-slate-200 focus:outline-none"
            />
          </form>
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300">Home</Link>
          <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300">All Products</Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/products?category=${c.slug}`}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-slate-400 hover:text-cyan-400"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
