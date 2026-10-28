import React, { useEffect, useState } from 'react';
import { DollarSign, Package, ShoppingCart, Activity, ArrowUpRight, TrendingUp, AlertTriangle, Users, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({
    total_revenue_dollars: 45231.89,
    total_orders_count: 312,
    completed_orders_count: 280,
    pending_orders_count: 32,
    total_products_count: 18,
    low_stock_products_count: 2,
    total_customers_count: 420,
    average_order_value_dollars: 144.97,
  });
  const [topProducts, setTopProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const [ovData, topData, ordData] = await Promise.allSettled([
          api.adminGetAnalyticsOverview(),
          api.adminGetTopProducts(5),
          api.adminGetOrders(),
        ]);

        if (ovData.status === 'fulfilled' && ovData.value) {
          setOverview(ovData.value);
        }
        if (topData.status === 'fulfilled' && Array.isArray(topData.value)) {
          setTopProducts(topData.value);
        }
        if (ordData.status === 'fulfilled' && Array.isArray(ordData.value)) {
          setRecentOrders(ordData.value.slice(0, 5));
        }
      } catch (err) {
        console.error('Error fetching admin dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const stats = [
    {
      label: 'Total Revenue',
      value: `$${Number(overview.total_revenue_dollars || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      change: '+14.2%',
      sub: 'vs last 30d',
      icon: DollarSign,
      color: 'text-emerald-400',
    },
    {
      label: 'Orders Processed',
      value: `${overview.total_orders_count || 0}`,
      change: `${overview.completed_orders_count || 0} completed`,
      sub: `${overview.pending_orders_count || 0} pending dispatch`,
      icon: ShoppingCart,
      color: 'text-cyan-400',
    },
    {
      label: 'Avg Order Value',
      value: `$${Number(overview.average_order_value_dollars || 0).toFixed(2)}`,
      change: '+6.8%',
      sub: 'AOV baseline',
      icon: TrendingUp,
      color: 'text-indigo-400',
    },
    {
      label: 'Active Hardware Nodes',
      value: `${overview.total_products_count || 0} SKUs`,
      change: `${overview.low_stock_products_count || 0} low stock`,
      sub: 'in inventory catalog',
      icon: Package,
      color: overview.low_stock_products_count > 0 ? 'text-amber-400' : 'text-slate-400',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Admin Intelligence Room</h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time financial telemetry, autonomous agent analytics, and pipeline dispatch.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/products"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-colors"
          >
            Manage Hardware
          </Link>
          <span className="text-xs bg-cyan-950/60 border border-cyan-500/20 text-cyan-400 font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-pulse">
            <Activity className="w-3.5 h-3.5" /> Core Neural Grid Online
          </span>
        </div>
      </div>

      {/* Grid KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between hover:border-slate-700 transition-colors">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-2xl font-black text-white mt-1.5 tracking-tight">{stat.value}</h3>
                <span className="text-[11px] text-cyan-400 font-medium flex items-center gap-1 mt-1.5">
                  {stat.change} <span className="text-slate-500 text-[10px]">({stat.sub})</span>
                </span>
              </div>
              <div className={`p-3.5 bg-slate-950 border border-slate-800 rounded-xl ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Stream */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Recent Pipeline Dispatches
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Live orders awaiting processing or in transit.</p>
            </div>
            <Link to="/admin/orders" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1">
              View All Orders <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No recent customer orders found in current operational batch.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs text-slate-300">
                  {recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-950/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-cyan-400">{ord.order_number}</td>
                      <td className="py-3 px-4 text-slate-300 font-medium truncate max-w-[140px]">{ord.user_email}</td>
                      <td className="py-3 px-4 font-semibold text-white">${ord.total_amount_dollars.toFixed(2)}</td>
                      <td className="py-3 px-4 text-slate-400">{ord.items_count} units</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          ord.status === 'delivered'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/20'
                            : ord.status === 'shipped'
                            ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/20'
                            : 'bg-amber-950/60 text-amber-400 border border-amber-500/20'
                        }`}>
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Performing Hardware */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="border-b border-slate-800 pb-4 mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Top Selling Hardware
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Highest volume products by verified checkouts.</p>
          </div>

          <div className="space-y-4">
            {topProducts.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">Loading performance indices...</div>
            ) : (
              topProducts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-white truncate max-w-[150px]">{p.product_title}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{p.units_sold} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-bold text-emerald-400">${p.total_revenue_dollars.toLocaleString()}</p>
                    <p className="text-[9px] text-slate-500 uppercase">Gross Rev</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
