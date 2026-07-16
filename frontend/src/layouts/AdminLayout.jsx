import React from 'react';
import { LayoutDashboard, PackageOpen, ShoppingBag, ArrowLeft, Cpu,Users,
  LogOut, } from 'lucide-react';

export default function AdminLayout({ children }) {
  // Simple check to match active routing path visually
  const currentPath = window.location.pathname;

  const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Products", icon: PackageOpen, path: "/admin/products" },
  { label: "Orders", icon: ShoppingBag, path: "/admin/orders" },
  { label: "Customers", icon: Users, path: "/admin/customers" },
  { label: "Logout", icon: LogOut, path: "/logout" },
];

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans">
      
      {/* --- SIDEBAR PANEL --- */}
      <aside className="w-64 bg-slate-900 border-r border-slate-850 flex flex-col justify-between shrink-0">
        <div>
          {/* Admin Header Branding */}
          <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-850">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-sm tracking-widest text-slate-200">AETHER ADMIN</span>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <a
                  key={idx}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-850'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>

        {/* Return to Store Action */}
        <div className="p-4 border-t border-slate-850">
          <a 
            href="/" 
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-950 hover:bg-slate-850 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white rounded-lg border border-slate-800 hover:border-slate-700 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Client Store
          </a>
        </div>
      </aside>

      {/* --- MAIN WORKSPACE PANEL --- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Control Bar */}
        <header className="h-16 border-b border-slate-850 bg-slate-900/40 backdrop-blur-md flex items-center justify-end px-8 gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Secure Node Connection</span>
          </div>
        </header>

        {/* Dashboard Pages Mount Here */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          {children}
        </main>
      </div>

    </div>
  );
}