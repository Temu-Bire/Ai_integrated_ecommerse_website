import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Filter,
  SlidersHorizontal,
  Star,
  Search,
  ChevronRight,
  X,
  ShoppingBag
} from 'lucide-react';
import { api } from '../lib/api';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasNext, setHasNext] = useState(false);

  // Active filters from URL query
  const currentCategory = searchParams.get('category') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentSort = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const currentBrand = searchParams.get('brand') || '';

  // Load categories
  useEffect(() => {
    api.getCategories(false).then((data) => {
      if (Array.isArray(data)) setCategories(data);
    }).catch(() => {});
  }, []);

  // Fetch products or hybrid search based on URL params
  useEffect(() => {
    async function fetchCatalog() {
      setLoading(true);
      try {
        if (currentSearch.trim()) {
          // Use hybrid search
          const searchRes = await api.search(currentSearch.trim(), {
            category: currentCategory || undefined,
            min_price: minPrice ? parseInt(minPrice) * 100 : undefined,
            max_price: maxPrice ? parseInt(maxPrice) * 100 : undefined,
            mode: 'hybrid',
          });
          setProducts(searchRes.items || []);
          setHasNext(false);
          setNextCursor(null);
        } else {
          // Use catalog cursor query
          const catalogRes = await api.getProducts({
            category_slug: currentCategory || undefined,
            brand: currentBrand || undefined,
            min_price: minPrice ? parseInt(minPrice) * 100 : undefined,
            max_price: maxPrice ? parseInt(maxPrice) * 100 : undefined,
            sort: currentSort,
            limit: 20,
          });
          setProducts(catalogRes.items || []);
          setHasNext(catalogRes.has_next);
          setNextCursor(catalogRes.next_cursor);
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCatalog();
  }, [currentCategory, currentSearch, currentSort, minPrice, maxPrice, currentBrand]);

  const updateParam = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val) {
      next.set(key, val);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Breadcrumb & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-900">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Link to="/" className="hover:text-cyan-400">Home</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-white">Catalog</span>
              {currentCategory && (
                <>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span className="text-cyan-400 capitalize">{currentCategory.replace('-', ' ')}</span>
                </>
              )}
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {currentSearch ? `Search results for "${currentSearch}"` : 'All Hardware & Devices'}
            </h1>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Sort By:</span>
            <select
              value={currentSort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating_desc">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Layout Grid: Sidebar + Product Grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Filters Sidebar */}
          <aside className="space-y-6">
            <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-cyan-400" /> Filters
                </span>
                {(currentCategory || minPrice || maxPrice || currentSearch || currentBrand) && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-cyan-400 hover:text-cyan-300"
                  >
                    Reset all
                  </button>
                )}
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Category</h4>
                <div className="space-y-1">
                  <button
                    onClick={() => updateParam('category', '')}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      !currentCategory ? 'bg-cyan-500/10 text-cyan-400 font-semibold' : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => updateParam('category', c.slug)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        currentCategory === c.slug ? 'bg-cyan-500/10 text-cyan-400 font-semibold' : 'text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Price Range ($)</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => updateParam('min_price', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-slate-600">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => updateParam('max_price', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <main className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-80 bg-slate-900 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="py-20 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl">
                <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white">No products match your criteria</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                  Try clearing your search query or adjusting your category/price filter.
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-400 rounded-lg"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="group bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden hover:shadow-xl transition-all flex flex-col"
                  >
                    <Link to={`/products/${product.slug}`} className="h-52 overflow-hidden bg-slate-950 block relative">
                      <img
                        src={product.primary_image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {product.match_type && (
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 backdrop-blur-md">
                          {product.match_type} match
                        </span>
                      )}
                    </Link>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                          <span className="font-semibold text-cyan-400">{product.brand}</span>
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span>{product.rating_avg.toFixed(1)}</span>
                          </div>
                        </div>

                        <Link to={`/products/${product.slug}`}>
                          <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors line-clamp-2 text-sm leading-snug">
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
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-xs font-semibold text-slate-200 transition-colors"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
