import React from 'react';
import { CreditCard } from 'lucide-react';

export default function CartSummary({ subtotal, onCheckout }) {
  const shipping = 15.00;
  const total = subtotal + shipping;

  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-5">
      <h3 className="text-base font-semibold text-white tracking-wide border-b border-slate-800 pb-3">
        Order Summary
      </h3>

      {/* Calculations */}
      <div className="flex flex-col gap-3 text-xs">
        <div className="flex justify-between text-slate-400">
          <span>Subtotal</span>
          <span className="text-slate-200 font-medium">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>AI Adaptive Shipping</span>
          <span className="text-slate-200 font-medium">${shipping.toFixed(2)}</span>
        </div>
        <div className="border-t border-slate-800 my-1"></div>
        <div className="flex justify-between items-end">
          <span className="text-sm font-semibold text-white">Total</span>
          <span className="text-lg font-bold text-cyan-400">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Checkout CTA */}
      <button 
        onClick={onCheckout}
        className="w-full mt-2 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <CreditCard className="w-4 h-4" /> Secure Checkout
      </button>
    </div>
  );
}