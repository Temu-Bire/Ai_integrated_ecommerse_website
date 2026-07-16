import React from 'react';
import { Package, Cpu, ArrowRight } from 'lucide-react';

export default function Orders() {
  const orders = [
    {
      id: "AG-8942-XN",
      date: "July 12, 2026",
      status: "In Transit",
      total: "$338.00",
      items: [
        { name: "NeuralBuds Pro", qty: 1 },
        { name: "Apex AI Smart Hub", qty: 1 }
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Package className="w-6 h-6 text-cyan-400" /> Order History
        </h1>
        <p className="text-slate-500 text-sm mt-1">Track updates for your local AI hardware orders.</p>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order, idx) => (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row justify-between border-b border-slate-850 pb-4 mb-4 text-xs gap-2">
                <div>
                  <p className="text-slate-500">Order ID</p>
                  <p className="text-white font-mono mt-0.5">{order.id}</p>
                </div>
                <div>
                  <p className="text-slate-500">Placed On</p>
                  <p className="text-slate-200 mt-0.5">{order.date}</p>
                </div>
                <div>
                  <p className="text-slate-500">Total Price</p>
                  <p className="text-cyan-400 font-semibold mt-0.5">{order.total}</p>
                </div>
                <div>
                  <span className="inline-block px-2.5 py-1 bg-cyan-950 text-cyan-400 border border-cyan-500/20 rounded font-semibold tracking-wider uppercase text-[10px]">
                    {order.status}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Items</h4>
                <ul className="space-y-1.5 text-sm">
                  {order.items.map((item, i) => (
                    <li key={i} className="flex justify-between text-slate-300">
                      <span>{item.name}</span>
                      <span className="text-slate-500">Qty: {item.qty}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          You haven't placed any orders yet.
        </div>
      )}
    </div>
  );
}