import React from 'react';
import ProductCard from './ProductCard';

export default function ProductList({ products }) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16 bg-slate-900/20 border border-dashed border-slate-800 rounded-xl">
        <p className="text-slate-500 text-sm">No smart hardware found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}