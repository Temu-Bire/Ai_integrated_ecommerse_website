import React from 'react';
import { DollarSign, Package, ShoppingCart, Activity, ArrowUpRight, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    { label: "Total Revenue", value: "$45,231.89", change: "+12.4%", icon: DollarSign, color: "text-emerald-400" },
    { label: "Hardware Sales", value: "312 Units", change: "+8.2%", icon: Package, color: "text-cyan-400" },
    { label: "Active Sessions", value: "1,204", change: "+23.1%", icon: Activity, color: "text-purple-400" },
  ];

  const recentActivity = [
    { id: "AG-9021", user: "Michael K.", item: "NeuralBuds Pro", total: "$189.00", status: "Success" },
    { id: "AG-9020", user: "Sarah T.", item: "Apex AI Smart Hub", total: "$149.00", status: "Success" },
    { id: "AG-9019", user: "David L.", item: "Aether Watch v4", total: "$299.00", status: "Pending" }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Admin Control Room</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time performance of your neural-hardware storefront.</p>
        </div>
        <span className="text-xs bg-cyan-950/60 border border-cyan-500/20 text-cyan-400 font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-pulse">
          <Activity className="w-3.5 h-3.5" /> Core Systems Online
        </span>
      </div>

      {/* Grid KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-2xl font-black text-white mt-1.5">{stat.value}</h3>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5 mt-2">
                  <TrendingUp className="w-3 h-3" /> {stat.change} <span className="text-slate-500 font-normal">vs last week</span>
                </span>
              </div>
              <div className={`p-4 bg-slate-950 border border-slate-800 rounded-xl ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Split Activity Details Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            Recent System Handshakes
          </h3>
          <button className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1">
            Audit Logs <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-850 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Session Key</th>
                <th className="py-3 px-4">Node / User</th>
                <th className="py-3 px-4">Item Cataloged</th>
                <th className="py-3 px-4">Total Price</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/50 text-xs text-slate-300">
              {recentActivity.map((log) => (
                <tr key={log.id} className="hover:bg-slate-950/20">
                  <td className="py-3 px-4 font-mono text-cyan-400">{log.id}</td>
                  <td className="py-3 px-4 font-semibold">{log.user}</td>
                  <td className="py-3 px-4">{log.item}</td>
                  <td className="py-3 px-4 font-semibold text-slate-100">{log.total}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.status === "Success" 
                        ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/20" 
                        : "bg-amber-950/60 text-amber-400 border border-amber-500/20"
                    }`}>
                      {log.status}
                    </span>
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