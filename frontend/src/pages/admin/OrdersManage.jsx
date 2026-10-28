import React, { useEffect, useState } from 'react';
import { ShoppingBag, Eye, CheckCircle2, Truck, RefreshCw, Loader2, AlertCircle, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';

export default function OrdersManage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async (status = '') => {
    try {
      setLoading(true);
      const data = await api.adminGetOrders(status === 'all' ? '' : status);
      setOrders(data || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
      toast.error('Failed to fetch orders from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(activeTab);
  }, [activeTab]);

  const handleUpdateStatus = async (orderId, nextStatus) => {
    try {
      setUpdatingId(orderId);
      let trackingNumber = undefined;
      if (nextStatus === 'shipped') {
        trackingNumber = prompt('Enter tracking code for shipment:', `TRK-${Math.floor(100000000 + Math.random() * 900000000)}`);
        if (!trackingNumber) {
          setUpdatingId(null);
          return;
        }
      }

      await api.adminUpdateOrderStatus(orderId, {
        status: nextStatus,
        tracking_number: trackingNumber,
      });

      toast.success(`Order marked as ${nextStatus.toUpperCase()}`);
      fetchOrders(activeTab);
    } catch (err) {
      console.error('Order update error:', err);
      toast.error(err.message || 'Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const tabs = [
    { id: 'all', label: 'All Dispatches' },
    { id: 'pending', label: 'Pending' },
    { id: 'processing', label: 'Processing' },
    { id: 'shipped', label: 'In Transit' },
    { id: 'delivered', label: 'Delivered' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-7 h-7 text-cyan-400" /> Neural Pipeline Dispatch
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Oversee fulfillment batches, assign courier tracking numbers, and advance delivery state.
          </p>
        </div>
        <button
          onClick={() => fetchOrders(activeTab)}
          className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg flex items-center gap-2 text-xs font-semibold self-start sm:self-auto transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Grid
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-4 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 flex justify-center text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Pipeline ID</th>
                  <th className="py-4 px-6">Customer Node</th>
                  <th className="py-4 px-6">Total Amount</th>
                  <th className="py-4 px-6">Items Ordered</th>
                  <th className="py-4 px-6">Tracking / Timestamp</th>
                  <th className="py-4 px-6">Current State</th>
                  <th className="py-4 px-6 text-right">Fulfillment Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs text-slate-300">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500">
                      No orders match the selected filter.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const isUpdating = updatingId === order.id;

                    return (
                      <tr key={order.id} className="hover:bg-slate-950/30 transition-colors">
                        <td className="py-4 px-6 font-mono font-bold text-cyan-400">
                          {order.order_number}
                        </td>
                        <td className="py-4 px-6 text-slate-300">
                          <p className="font-semibold">{order.user_email || 'Customer'}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{order.user_id?.substring(0, 8)}...</p>
                        </td>
                        <td className="py-4 px-6 font-mono font-bold text-white text-sm">
                          ${order.total_amount_dollars.toFixed(2)}
                        </td>
                        <td className="py-4 px-6 text-slate-400">
                          {order.items_count} units
                        </td>
                        <td className="py-4 px-6">
                          {order.tracking_number ? (
                            <span className="font-mono text-[11px] text-cyan-400 bg-cyan-950/40 border border-cyan-500/20 px-2 py-0.5 rounded">
                              {order.tracking_number}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Unassigned</span>
                          )}
                          <p className="text-[10px] text-slate-500 mt-0.5">{order.created_at?.substring(0, 10)}</p>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                            order.status === 'delivered'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/20'
                              : order.status === 'shipped'
                              ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/20'
                              : order.status === 'processing'
                              ? 'bg-indigo-950/60 text-indigo-400 border border-indigo-500/20'
                              : 'bg-amber-950/60 text-amber-400 border border-amber-500/20'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-1.5">
                            {order.status === 'pending' && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, 'processing')}
                                disabled={isUpdating}
                                className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-lg text-xs font-bold transition-colors"
                              >
                                {isUpdating ? '...' : 'Process'}
                              </button>
                            )}
                            {order.status === 'processing' && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, 'shipped')}
                                disabled={isUpdating}
                                className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                {isUpdating ? '...' : 'Dispatch'}
                              </button>
                            )}
                            {order.status === 'shipped' && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, 'delivered')}
                                disabled={isUpdating}
                                className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {isUpdating ? '...' : 'Complete'}
                              </button>
                            )}
                            {order.status === 'delivered' && (
                              <span className="text-[11px] text-slate-500 font-semibold px-2">Archived</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
