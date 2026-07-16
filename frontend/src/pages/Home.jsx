import React, { useState } from 'react';
import { Sparkles, ArrowRight, Search } from 'lucide-react';
import Button from '../components/common/Button';
import ProductCard from '../components/product/ProductCard';

// Sample AI Electronics Data
const FEATURED_PRODUCTS = [
  {
    id: 1,
    name: "NeuralBuds Pro",
    category: "Audio",
    price: "$189",
    description: "Adaptive AI noise cancellation that maps your ear canal in real-time.",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80",
    tag: "AI Adaptive"
  },
  {
    id: 2,
    name: "Aether Watch v4",
    category: "Wearables",
    price: "$299",
    description: "Predictive health monitoring powered by on-device machine learning.",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
    tag: "Predictive Health"
  },
  {
    id: 3,
    name: "Apex AI Smart Hub",
    category: "Smart Home",
    price: "$149",
    description: "Learns your daily routine to fully automate home climate and lighting.",
    image: "https://images.unsplash.com/photo-1558089687-f282ffcbd1d5?auto=format&fit=crop&w=600&q=80",
    tag: "Self-Learning"
  },
  {
    id: 4,
    name: "Cognitive Vision Webcam",
    category: "Work",
    price: "$220",
    description: "AI framing and auto-lighting adjustment with neural processing unit.",
    image: "https://images.unsplash.com/photo-1600541519463-f60ab4ac3528?auto=format&fit=crop&w=600&q=80",
    tag: "NPU Enabled"
  }
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = FEATURED_PRODUCTS.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen">
      
      {/* --- HERO SECTION --- */}
      <section className="relative py-20 md:py-32 overflow-hidden border-b border-slate-900">
        {/* Tech Grid Backdrop */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none"></div>

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-6">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Next-Gen AI Integrated Gear
          </span>
          
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-6 leading-tight">
            Electronics That Think. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              Hardware Powered by AI.
            </span>
          </h1>
          
          <p className="text-slate-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Discover consumer devices embedded with local neural processors designed to actively adapt to your lifestyle.
          </p>

          {/* Clean Search Input */}
          <div className="max-w-md mx-auto relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Search smart devices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all text-sm"
            />
          </div>
        </div>
      </section>

      {/* --- AI SETUP RECOMMENDER BANNER --- */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-cyan-950 border border-cyan-500/30 rounded-xl text-cyan-400 shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Let our local AI construct your ecosystem</h3>
              <p className="text-slate-400 text-sm mt-1 max-w-md">
                Answer three simple questions to curate the perfect layout for your workspace.
              </p>
            </div>
          </div>
          <Button variant="primary" className="flex items-center gap-2">
            Start AI Advisor <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* --- FEATURED PRODUCTS SECTION --- */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Our Core Collection</h2>
            <p className="text-slate-500 text-sm mt-1">Smart hardware embedded with local neural engines.</p>
          </div>
        </div>

        {/* Dynamic Responsive Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            No smart hardware found matching your criteria.
          </div>
        )}
      </section>

    </div>
  );
}