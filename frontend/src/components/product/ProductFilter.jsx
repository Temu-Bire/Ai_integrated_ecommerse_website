import React from 'react';
import { Search } from 'lucide-react';

const CATEGORIES = ["All", "Audio", "Wearables", "Smart Home", "Work"];

export default function ProductFilter({ searchQuery, setSearchQuery, selectedCategory, setSelectedCategory }) {
  return (
    <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 border border-slate-800 rounded-xl mb-8">
      {/* Search Input */}
      <div className="relative w-full md:max-w-xs">
        <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          placeholder="Filter smart devices..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 text-sm"
        />
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2 w-full md:w-auto">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border ${
              selectedCategory === category
                ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}