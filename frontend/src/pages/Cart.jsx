import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw
} from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { cart, loading, updateQuantity, removeFromCart, clearCart, subtotalDollars, subtotalCents, totalQuantity } = useCart();
  const navigate = useNavigate();

  const items = cart?.items || [];
  const freeShippingThreshold = 10000; // $100 in cents
  const progressToFreeShipping = Math.min(100, (subtotalCents / freeShippingThreshold) * 100);
  const remainingForFreeShipping = Math.max(0, (freeShippingThreshold - subtotalCents) / 100);

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        <div className="flex items-center justify-between pb-6 border-b border-slate-900 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Shopping Cart</h1>
              <p className="text-xs text-slate-400">{totalQuantity} item{totalQuantity !== 1 ? 's' : ''} in your workspace</p>
            </div>
          </div>

          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Clear entire cart
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="py-24 text-center bg-slate-900/40 border border-slate-800/80 rounded-3xl max-w-2xl mx-auto">
            <ShoppingBag className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white">Your cart is currently empty</h2>
            <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
              Looking for cutting-edge audio, creator gear, or smart wearables? Explore our curated catalog.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-colors shadow-lg shadow-cyan-500/20"
            >
              Browse Catalog <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Free Shipping Progress Meter */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-slate-300">
                    {remainingForFreeShipping > 0
                      ? `Add $${remainingForFreeShipping.toFixed(2)} more to qualify for Free Express Shipping!`
                      : '🎉 You have unlocked Free Express Shipping!'}
                  </span>
                  <span className="text-cyan-400 font-bold">{Math.round(progressToFreeShipping)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressToFreeShipping}%` }}
                  />
                </div>
              </div>

              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 bg-slate-900/70 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center gap-4 sm:gap-6 justify-between"
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="w-20 h-20 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex-shrink-0">
                      <img
                        src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"
                        alt={item.variant?.title || 'Product'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">
                        {item.variant?.title || 'Hardware Variant'}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">SKU: {item.variant?.sku}</p>
                      <p className="text-sm font-bold text-cyan-400 mt-1">
                        ${(item.unit_price_cents / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Quantity & Delete */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-sm font-bold text-white min-w-[70px] text-right">
                      ${(item.total_price_cents / 100).toFixed(2)}
                    </span>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary Sidebar */}
            <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-6">
              <h2 className="text-lg font-bold text-white">Order Summary</h2>

              <div className="space-y-3 text-sm border-b border-slate-800 pb-4">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal</span>
                  <span className="font-semibold text-white">${subtotalDollars}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Estimated Shipping</span>
                  <span className="font-semibold text-white">
                    {subtotalCents >= freeShippingThreshold ? (
                      <span className="text-emerald-400">Free</span>
                    ) : (
                      '$10.00'
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Estimated Tax (8%)</span>
                  <span className="font-semibold text-white">
                    ${((subtotalCents * 0.08) / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-base font-extrabold text-white">
                <span>Estimated Total</span>
                <span className="text-xl text-cyan-400">
                  ${(
                    (subtotalCents + (subtotalCents >= freeShippingThreshold ? 0 : 1000) + subtotalCents * 0.08) /
                    100
                  ).toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-4 px-6 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-sm transition-all shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2"
              >
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </button>

              <div className="space-y-2 pt-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>256-bit encrypted checkout</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-cyan-400" />
                  <span>30-day money-back guarantee</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
