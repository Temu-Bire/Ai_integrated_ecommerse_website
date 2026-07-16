import React, { useState } from 'react';
import { ShoppingBag, Eye, CheckCircle2 } from 'lucide-react';

export default function OrdersManage() {
  const [orders, setOrders] = useState([
    { id: "AG-8942-XN", node: "user_temesgen_01", date: "July 12, 2026", status: "In Transit", total: "$338.00" },
    { id: "AG-8941-XN", node: "user_anonymous_53", date: "July 11, 2026", status: "Delivered", total: "$149.00" },
    { id: "AG-8940-XN", node: "user_developer_99", date: "July 10, 2026", status: "Pending Allocation", total: "$220.00" }
  ]);

  const updateStatus = (id, nextStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: nextStatus } : o));
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-cyan-400" /> Neural Pipeline Dispatch
        </h1>
        <p className="text-slate-500 text-sm mt-1">Oversee physical shipments of hardware and change process steps.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6">Pipeline ID</th>
                <th className="py-4 px-6">Requester Address</th>
                <th className="py-4 px-6">Timestamp</th>
                <th className="py-4 px-6">Pricing Matrix</th>
                <th className="py-4 px-6">Dispatch State</th>
                <th className="py-4 px-6 text-right">Interventions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs text-slate-300">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-950/20 transition-colors">
                  <td className="py-4 px-6 font-mono text-cyan-400 font-semibold">{order.id}</td>
                  <td className="py-4 px-6 text-slate-400">{order.node}</td>
                  <td className="py-4 px-6">{order.date}</td>
                  <td className="py-4 px-6 font-bold text-slate-200">{order.total}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      order.status === "Delivered" 
                        ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/20" 
                        : order.status === "In Transit"
                        ? "bg-cyan-950/60 text-cyan-400 border border-cyan-500/20"
                        : "bg-amber-950/60 text-amber-400 border border-amber-500/20"
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right flex justify-end gap-2">
                    <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-850 rounded-lg transition-colors" title="View details">
                      <Eye className="w-4 h-4" />
                    </button>
                    {order.status !== "Delivered" && (
                      <button 
                        onClick={() => updateStatus(order.id, "Delivered")}
                        className="p-2 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-950/20 rounded-lg transition-colors"
                        title="Mark Delivered"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
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