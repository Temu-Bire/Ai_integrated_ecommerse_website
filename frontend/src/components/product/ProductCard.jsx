import React from 'react';
import { Heart, Eye } from 'lucide-react';
import Button from '../../../../common/Button';

export default function ProductCard({ product }) {
  return (
    <div className="group bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all duration-300 flex flex-col">
      
      {/* Product Image Panel */}
      <div className="relative aspect-square bg-slate-900 overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name} 
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
        />
        {/* Pill Tag */}
        <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-cyan-400 border border-cyan-500/30 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded">
          {product.tag}
        </span>
        
        {/* Hover Quick Actions */}
        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <button className="p-2.5 bg-slate-900 hover:bg-slate-800 rounded-full border border-slate-700 text-white transition-colors">
            <Eye className="w-4 h-4" />
          </button>
          <button className="p-2.5 bg-slate-900 hover:bg-slate-800 rounded-full border border-slate-700 text-white transition-colors">
            <Heart className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{product.category}</span>
          <h3 className="text-base font-semibold text-slate-200 mt-1 group-hover:text-cyan-400 transition-colors">
            {product.name}
          </h3>
          <p className="text-slate-400 text-xs mt-2 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>
        
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-900">
          <span className="text-lg font-bold text-white">{product.price}</span>
          <Button variant="secondary" className="px-3 py-1.5 text-xs">
            Add to Cart
          </Button>
        </div>
      </div>

    </div>
  );
}