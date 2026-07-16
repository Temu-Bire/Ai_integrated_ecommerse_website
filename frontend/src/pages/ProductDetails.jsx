import React, { useState } from 'react';
import { Shield, Zap, RefreshCw, ShoppingCart } from 'lucide-react';

export default function ProductDetails() {
  const [quantity, setQuantity] = useState(1);

  // Mock product detail (In production, retrieve this via product ID from API / Router params)
  const product = {
    id: 1,
    name: "NeuralBuds Pro",
    category: "Audio",
    price: 189.00,
    description: "The world's first adaptive ear canal audio optimizer. Equipped with an on-device neural processing engine, NeuralBuds Pro map your auditory response curves in real-time, delivering custom-tuned frequencies unique to your hearing profile.",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
    tag: "AI Adaptive",
    specs: ["Local NPU Core", "45-Hour Battery Life", "ANC & Spatial Mapping", "Waterproof IPX7"]
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* Left: Product Image */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden aspect-square relative">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          <span className="absolute top-4 left-4 bg-cyan-500 text-slate-950 text-xs font-bold px-3 py-1 rounded-full">
            {product.tag}
          </span>
        </div>

        {/* Right: Info & Actions */}
        <div className="flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-cyan-400 tracking-wider uppercase">{product.category}</span>
            <h1 className="text-3xl md:text-4xl font-black text-white mt-2 leading-tight">{product.name}</h1>
            <p className="text-2xl font-bold text-cyan-400 mt-4">${product.price.toFixed(2)}</p>
            <p className="text-slate-400 text-sm mt-6 leading-relaxed">{product.description}</p>

            {/* Hardware Specs */}
            <div className="mt-8">
              <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Specifications</h3>
              <ul className="grid grid-cols-2 gap-3 mt-3">
                {product.specs.map((spec, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                    {spec}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Area */}
          <div className="mt-10 pt-6 border-t border-slate-900 flex items-center gap-4">
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1.5">
              <button 
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white"
              >
                -
              </button>
              <span className="text-sm font-semibold text-white w-8 text-center">{quantity}</span>
              <button 
                onClick={() => setQuantity(q => q + 1)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white"
              >
                +
              </button>
            </div>

            <button className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2">
              <ShoppingCart className="w-4 h-4" /> Add to Workspace Setup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}