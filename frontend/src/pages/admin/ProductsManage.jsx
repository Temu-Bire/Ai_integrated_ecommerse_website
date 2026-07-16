import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';

export default function ProductsManage() {
  const [products, setProducts] = useState([
    { id: 1, name: "NeuralBuds Pro", category: "Audio", price: "$189", stock: 45 },
    { id: 2, name: "Aether Watch v4", category: "Wearables", price: "$299", stock: 24 },
    { id: 3, name: "Apex AI Smart Hub", category: "Smart Home", price: "$149", stock: 12 }
  ]);

  const handleDelete = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Manage Hardware Node Inventory</h1>
          <p className="text-slate-500 text-sm mt-1">Instantly edit specs, toggle price metrics, or append new batches.</p>
        </div>
        <button className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Provision New Hardware
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6">Hardware Name</th>
                <th className="py-4 px-6">Domain Category</th>
                <th className="py-4 px-6">Cost Vector</th>
                <th className="py-4 px-6">Stock Nodes</th>
                <th className="py-4 px-6 text-right">Operational Directives</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs text-slate-300">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-950/20 transition-colors">
                  <td className="py-4 px-6 font-semibold text-white">{product.name}</td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1.5 text-slate-400">
                      <Tag className="w-3.5 h-3.5 text-cyan-500/60" /> {product.category}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-mono font-medium text-cyan-400">{product.price}</td>
                  <td className="py-4 px-6 font-semibold">{product.stock} units</td>
                  <td className="py-4 px-6 text-right flex justify-end gap-2">
                    <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-850 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}