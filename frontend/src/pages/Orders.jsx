import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCcw,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Orders() {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.getMyOrders({ limit: 20 });
      setOrders(res.items || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [isAuthenticated]);

  const handleCancelOrder = async (orderId) => {
    if (!confirm('Are you sure you wish to cancel this order and restore stock?')) return;
    try {
      await api.cancelOrder(orderId);
      toast.success('Order cancelled successfully.');
      fetchOrders();
    } catch (err) {
      toast.error(err.message || 'Could not cancel order');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/20">Paid</span>;
      case 'shipped':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-950 text-sky-400 border border-sky-500/20">Shipped</span>;
      case 'delivered':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-950 text-indigo-400 border border-indigo-500/20">Delivered</span>;
      case 'cancelled':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-950 text-rose-400 border border-rose-500/20">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-slate-400 border border-slate-800">{status}</span>;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white">Please sign in to view your orders</h2>
        <p className="text-sm text-slate-400 mt-2">Sign in with your account to view order fulfillment tracking.</p>
        <Link to="/login?redirect=/orders" className="inline-block mt-6 px-6 py-2.5 bg-cyan-500 text-slate-950 font-bold rounded-full">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        <div className="flex items-center justify-between pb-6 border-b border-slate-900 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Package className="w-7 h-7 text-cyan-400" /> My Orders & Shipments
            </h1>
            <p className="text-xs text-slate-400 mt-1">Real-time status updates and order fulfillment details</p>
          </div>
          <button
            onClick={() => {
              const btn = document.getElementById('chat-trigger-btn');
              if (btn) {
                btn.click();
                window.dispatchEvent(
                  new CustomEvent('ai-ask-product', {
                    detail: { prompt: 'Can you show me the current status of my latest orders?' },
                  })
                );
              }
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-medium text-cyan-400 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" /> Ask AI about orders
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 bg-slate-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/40 border border-slate-800 rounded-3xl">
            <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No orders placed yet</h3>
            <p className="text-sm text-slate-400 mt-1">When you complete a checkout, your items will appear here.</p>
            <Link to="/products" className="inline-block mt-4 px-6 py-2.5 bg-cyan-500 text-slate-950 font-bold rounded-full text-xs">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                  <div>
                    <span className="text-xs font-mono font-bold text-cyan-400">{order.order_number}</span>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Placed on {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                    <span className="text-base font-extrabold text-white">
                      ${(order.total_amount_cents / 100).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-slate-800/40">
                  {order.items?.map((item) => (
                    <div key={item.id} className="py-2.5 flex justify-between text-xs">
                      <div>
                        <span className="font-semibold text-white">{item.product_title}</span>
                        <span className="text-slate-400 block font-mono text-[11px]">SKU: {item.variant_sku}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400">Qty: {item.quantity} × ${(item.unit_price_cents / 100).toFixed(2)}</span>
                        <span className="block font-bold text-white">${(item.total_price_cents / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-400">
                    Shipping to: <strong className="text-white">{order.shipping_address?.full_name}</strong>
                  </span>

                  {(order.status === 'paid' || order.status === 'pending') && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="text-red-400 hover:text-red-300 font-medium"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
