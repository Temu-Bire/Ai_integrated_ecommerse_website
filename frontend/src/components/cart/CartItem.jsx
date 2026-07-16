import React from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';

export default function CartItem({ item, onUpdateQuantity, onRemove }) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-slate-900/40 border border-slate-800 rounded-xl">
      {/* Product Image & Info */}
      <div className="flex items-center gap-4">
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-16 h-16 rounded-lg object-cover border border-slate-800 shrink-0"
        />
        <div>
          <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-widest">{item.category}</span>
          <h4 className="text-sm font-semibold text-white mt-0.5">{item.name}</h4>
          <p className="text-xs text-slate-400 mt-1">{item.price}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6">
        {/* Quantity Controls */}
        <div className="flex items-center gap-2.5 bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800">
          <button 
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            className="text-slate-400 hover:text-white transition-colors"
            disabled={item.quantity <= 1}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-semibold text-white px-1 w-4 text-center">{item.quantity}</span>
          <button 
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Delete Action */}
        <button 
          onClick={() => onRemove(item.id)}
          className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
          title="Remove item"
        >
          <Trash2 className="w-4.5 h-4.5" />
        </button>
      </div>
    </div>
  );
}