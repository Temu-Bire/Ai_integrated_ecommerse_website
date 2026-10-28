import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Tag, Sparkles, Loader2, X, Check, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';

export default function ProductsManage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Product Form
  const [form, setForm] = useState({
    title: '',
    slug: '',
    brand: 'NovaMart Labs',
    category_id: '',
    base_price_dollars: '299.00',
    description: '',
    sku: '',
    initial_stock: 50,
    features: 'Synaptic neural sync, 36hr battery, Titanium alloy chassis',
    image_url: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=600&q=80',
  });

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const [prodsData, catsData] = await Promise.all([
        api.getProducts({ limit: 50 }),
        api.getCategories(false),
      ]);
      setProducts(prodsData.items || []);
      setCategories(catsData || []);
      if (catsData.length > 0 && !form.category_id) {
        setForm((prev) => ({ ...prev, category_id: catsData[0].id }));
      }
    } catch (err) {
      console.error('Failed to load catalog:', err);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleTitleChange = (e) => {
    const title = e.target.value;
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const sku = (title.substring(0, 4) + '-' + Math.floor(1000 + Math.random() * 9000)).toUpperCase();
    setForm((prev) => ({ ...prev, title, slug, sku }));
  };

  // AI Description Generator for Admins
  const handleGenerateAIDescription = async () => {
    if (!form.title) {
      toast.error('Please enter a product title first');
      return;
    }
    try {
      setGeneratingAI(true);
      const res = await api.adminGenerateAIDescription({
        title: form.title,
        brand: form.brand || 'NovaMart',
        attributes: {
          features: form.features.split(',').map((f) => f.trim()),
        },
      });

      if (res && res.description) {
        setForm((prev) => ({ ...prev, description: res.description }));
        toast.success('AI description generated successfully!');
      }
    } catch (err) {
      console.error('AI generation error:', err);
      toast.error('AI description generation failed');
    } finally {
      setGeneratingAI(false);
    }
  };

  // Create Product Submit
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!form.title || !form.category_id || !form.sku) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const priceCents = Math.round(parseFloat(form.base_price_dollars) * 100);
      const payload = {
        title: form.title,
        slug: form.slug,
        brand: form.brand,
        category_id: form.category_id,
        description: form.description || `${form.title} built with advanced neural processing.`,
        base_price_cents: priceCents,
        is_active: true,
        is_featured: true,
        variants: [
          {
            sku: form.sku,
            name: 'Standard Edition',
            price_cents: priceCents,
            stock_quantity: parseInt(form.initial_stock, 10) || 50,
            attributes: { color: 'Cyber Black', edition: 'Standard' },
          },
        ],
        images: [
          {
            url: form.image_url,
            is_primary: true,
            display_order: 0,
          },
        ],
      };

      await api.adminCreateProduct(payload);
      toast.success('Hardware node provisioned successfully!');
      setShowModal(false);
      fetchCatalog();
    } catch (err) {
      console.error('Create product failed:', err);
      toast.error(err.message || 'Failed to provision hardware');
    } finally {
      setSubmitting(false);
    }
  };

  // Soft Delete Product
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to decommission ${title}?`)) return;
    try {
      await api.adminDeleteProduct(id);
      toast.success('Product decommissioned from grid');
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      toast.error(err.message || 'Failed to delete product');
    }
  };

  // Quick Stock Adjustment
  const handleAdjustStock = async (product, delta) => {
    const variant = product.variants?.[0];
    if (!variant) {
      toast.error('No variant found for stock adjustment');
      return;
    }
    const newQty = Math.max(0, (variant.stock_quantity || 0) + delta);
    try {
      await api.adminUpdateInventory(variant.id, newQty);
      toast.success(`Stock adjusted to ${newQty} units`);
      fetchCatalog();
    } catch (err) {
      toast.error('Stock adjustment failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Hardware Node Inventory</h1>
          <p className="text-slate-400 text-sm mt-1">
            Provision new SKUs, calibrate inventory levels, or trigger AI technical copy generation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchCatalog}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg transition-colors"
            title="Refresh Catalog"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10 transition-colors"
          >
            <Plus className="w-4 h-4" /> Provision New Hardware
          </button>
        </div>
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
                  <th className="py-4 px-6">Hardware SKU / Title</th>
                  <th className="py-4 px-6">Category & Brand</th>
                  <th className="py-4 px-6">Unit Price</th>
                  <th className="py-4 px-6">Live Inventory</th>
                  <th className="py-4 px-6 text-right">Directives</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs text-slate-300">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-500">
                      No active hardware items in database.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const primaryVariant = product.variants?.[0];
                    const stock = primaryVariant ? primaryVariant.stock_quantity : (product.stock || 0);

                    return (
                      <tr key={product.id} className="hover:bg-slate-950/30 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            {product.primary_image_url && (
                              <img
                                src={product.primary_image_url}
                                alt={product.title}
                                className="w-10 h-10 rounded-lg object-cover bg-slate-950 border border-slate-800"
                              />
                            )}
                            <div>
                              <p className="font-bold text-white text-sm">{product.title}</p>
                              <p className="text-[10px] font-mono text-cyan-400 mt-0.5">{product.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1.5 text-slate-300 font-medium">
                            <Tag className="w-3.5 h-3.5 text-cyan-500/70" /> {product.brand || 'NovaMart'}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-mono font-bold text-emerald-400 text-sm">
                          ${(product.price_cents / 100).toFixed(2)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                              stock <= 10
                                ? 'bg-amber-950/60 text-amber-400 border border-amber-500/20'
                                : 'bg-slate-800 text-slate-200'
                            }`}>
                              {stock} units
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleAdjustStock(product, -5)}
                                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs"
                                title="-5 Stock"
                              >
                                -
                              </button>
                              <button
                                onClick={() => handleAdjustStock(product, +10)}
                                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs"
                                title="+10 Stock"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleDelete(product.id, product.title)}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors"
                            title="Decommission hardware"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Provision New Hardware Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" /> Provision New Hardware Node
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter technical attributes and let the Nova AI generator synthesize marketing copy.
              </p>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Neural Bridge Pro"
                    value={form.title}
                    onChange={handleTitleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-cyan-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-cyan-500 outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Price (USD $) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.base_price_dollars}
                    onChange={(e) => setForm({ ...form, base_price_dollars: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-cyan-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Initial Stock *
                  </label>
                  <input
                    type="number"
                    required
                    value={form.initial_stock}
                    onChange={(e) => setForm({ ...form, initial_stock: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-cyan-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-cyan-400 font-mono text-sm focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Core Features (comma separated)
                </label>
                <input
                  type="text"
                  value={form.features}
                  onChange={(e) => setForm({ ...form, features: e.target.value })}
                  placeholder="e.g. 5.4GHz wireless, Active cooling, Haptic feedback"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Product Description
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateAIDescription}
                    disabled={generatingAI}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold disabled:opacity-50 transition-colors"
                  >
                    {generatingAI ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    Generate with AI Copilot
                  </button>
                </div>
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Comprehensive technical overview and customer value proposition..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-cyan-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Image CDN URL
                </label>
                <input
                  type="url"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-cyan-500 outline-none font-mono text-xs"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Deploy Hardware to Storefront
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
