import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Truck,
  RotateCcw,
  Star,
  Cpu
} from 'lucide-react';
import { api } from '../lib/api';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.getProducts({ is_featured: true, limit: 4 }),
          api.getCategories(false),
        ]);
        setFeaturedProducts(prodRes?.items || []);
        setCategories(Array.isArray(catRes) ? catRes.slice(0, 4) : []);
      } catch (err) {
        console.error('Error loading homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen">
      
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden border-b border-slate-900">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-20 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-sm animate-pulse">
            <Sparkles className="w-4 h-4" />
            Next-Generation AI E-Commerce
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight md:leading-tight">
            Curated High-Performance Electronics, Engineered with{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
              Intelligence
            </span>
          </h1>

          <p className="mt-6 text-base md:text-lg text-slate-400 max-w-2xl mx-auto">
            Explore studio acoustics, creator workstations, and next-gen wearables. Backed by our streaming AI shopping assistant for grounded, real-time comparisons.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/products"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
            >
              Browse Catalog <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => {
                const btn = document.getElementById('chat-trigger-btn');
                if (btn) btn.click();
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Cpu className="w-4 h-4 text-cyan-400" /> Ask AI Assistant
            </button>
          </div>

          {/* Value Badges */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto pt-8 border-t border-slate-900 text-left">
            <div className="flex items-start gap-3 p-3 bg-slate-900/40 rounded-xl border border-slate-800/60">
              <Truck className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">Free Express Shipping</h4>
                <p className="text-xs text-slate-400">On all orders over $100</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-900/40 rounded-xl border border-slate-800/60">
              <Shield className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">2-Year Warranty</h4>
                <p className="text-xs text-slate-400">Comprehensive hardware protection</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-900/40 rounded-xl border border-slate-800/60">
              <RotateCcw className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">30-Day Free Returns</h4>
                <p className="text-xs text-slate-400">Zero restocking fees</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-900/40 rounded-xl border border-slate-800/60">
              <Zap className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">Instant AI Guidance</h4>
                <p className="text-xs text-slate-400">Grounded tool-calling assistant</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Explore Categories</h2>
            <p className="text-sm text-slate-400">Precision hardware across industry verticals</p>
          </div>
          <Link to="/products" className="text-sm text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug}`}
              className="group relative rounded-2xl overflow-hidden bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition-all shadow-md"
            >
              <div className="h-44 overflow-hidden bg-slate-950">
                <img
                  src={cat.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">{cat.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{cat.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-slate-900/30 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-1 text-xs uppercase font-bold text-cyan-400 tracking-wider mb-1">
                <Star className="w-3.5 h-3.5 fill-cyan-400" /> Handpicked
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Featured Hardware</h2>
            </div>
            <Link to="/products" className="text-sm text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1">
              Explore Catalog <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-80 bg-slate-900 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <div
                  key={product.id}
                  className="group bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 hover:shadow-xl transition-all flex flex-col"
                >
                  <Link to={`/products/${product.slug}`} className="h-48 overflow-hidden bg-slate-950 block">
                    <img
                      src={product.primary_image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                        <span className="font-medium text-cyan-400">{product.brand}</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span>{product.rating_avg.toFixed(1)}</span>
                        </div>
                      </div>

                      <Link to={`/products/${product.slug}`}>
                        <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors line-clamp-2 text-sm">
                          {product.title}
                        </h3>
                      </Link>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                      <span className="text-lg font-bold text-white">
                        ${(product.base_price_cents / 100).toFixed(2)}
                      </span>
                      <Link
                        to={`/products/${product.slug}`}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-xs font-semibold text-slate-200 transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
