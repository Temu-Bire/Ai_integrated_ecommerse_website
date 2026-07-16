import React from 'react';
import { Shield, Cpu, RefreshCw, Users, Heart } from 'lucide-react';

export default function About() {
 const values = [
  {
    icon: Shield,
    title: "Quality Products",
    description:
      "We carefully select trusted brands and reliable electronic products to ensure quality and customer satisfaction."
  },
  {
    icon: Users,
    title: "Customer First",
    description:
      "Our customers are at the center of everything we do. We provide excellent support before and after every purchase."
  },
  {
    icon: Heart,
    title: "Affordable Prices",
    description:
      "We believe everyone deserves access to quality technology at fair and competitive prices."
  }
];

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen py-16">
      <div className="max-w-5xl mx-auto px-6">
        
        {/* Header Hero */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 bg-cyan-950/40 px-3 py-1 rounded-full border border-cyan-500/20">
            About Us
          </span>
          <h1 className="text-4xl font-black tracking-tight text-white mt-4 mb-6 leading-tight">
            Your Trusted <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Destination for</span> Quality Electronics.
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
        X Electronics is committed to providing high-quality electronic products at affordable prices. From laptops and smartphones to accessories and home electronics, we help customers find reliable technology for work, learning, and everyday life.          </p>
        </div>

        {/* Dynamic Philosophy Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {values.map((val, idx) => {
            const Icon = val.icon;
            return (
              <div key={idx} className="bg-slate-900/40 border border-slate-850 rounded-xl p-6 hover:border-slate-800 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{val.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{val.description}</p>
              </div>
            );
          })}
        </div>

        {/* Operational Scope Panel */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-850 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl font-black text-white">Why Choose X Electronics?</h2>
            <p className="text-slate-400 text-sm mt-3 max-w-xl leading-relaxed">
              Our goal is to make shopping for electronics simple, secure, and convenient. Whether you're looking for the latest gadgets, computer accessories, home electronics, or mobile devices, we are dedicated to delivering quality products backed by excellent customer service.
            </p>
          </div>
          <div className="flex gap-4 shrink-0">
            <div className="text-center p-4 bg-slate-950 border border-slate-850 rounded-xl min-w-[100px]">
              <span className="text-2xl font-black text-cyan-400">1000+</span>
              <p className="text-[10px] uppercase font-bold text-slate-500 mt-1">Products</p>
            </div>
            <div className="text-center p-4 bg-slate-950 border border-slate-850 rounded-xl min-w-[100px]">
              <span className="text-2xl font-black text-cyan-400">24/7</span>
              <p className="text-[10px] uppercase font-bold text-slate-500 mt-1">Customer Support</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}