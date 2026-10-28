import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useCart } from '../context/CartContext';

export default function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const data = await api.getProduct(id);
        setProduct(data);
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
        if (data.images && data.images.length > 0) {
          setSelectedImage(data.images[0].url);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    setAddingToCart(true);
    try {
      await addToCart(selectedVariant.id, quantity);
      toast.success(`Added ${quantity} × ${selectedVariant.title} to your cart!`);
    } catch (err) {
      toast.error(err.message || 'Failed to add item to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const triggerAskAI = () => {
    const chatBtn = document.getElementById('chat-trigger-btn');
    if (chatBtn) {
      chatBtn.click();
      window.dispatchEvent(
        new CustomEvent('ai-ask-product', {
          detail: {
            prompt: `Can you explain the main highlights of ${product?.title} and what distinguishes it from competitors?`,
          },
        })
      );
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="h-96 bg-slate-900 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-8 bg-slate-900 w-3/4 rounded" />
            <div className="h-6 bg-slate-900 w-1/4 rounded" />
            <div className="h-32 bg-slate-900 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-white">Product not found</h2>
        <p className="text-slate-400 mt-2">The product you are looking for may have been removed or is unavailable.</p>
        <Link to="/products" className="inline-block mt-4 px-6 py-2.5 bg-cyan-500 text-slate-950 font-bold rounded-full">
          Back to Catalog
        </Link>
      </div>
    );
  }

  const currentPriceCents = selectedVariant ? selectedVariant.price_cents : product.base_price_cents;
  const currentPriceDollars = (currentPriceCents / 100).toFixed(2);
  const availableStock = selectedVariant?.inventory?.available_quantity ?? 10;

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-8">
          <Link to="/" className="hover:text-cyan-400">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/products" className="hover:text-cyan-400">Products</Link>
          {product.category && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link to={`/products?category=${product.category.slug}`} className="hover:text-cyan-400">
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-white truncate max-w-xs">{product.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Product Image Gallery */}
          <div className="space-y-4">
            <div className="h-[460px] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden relative shadow-2xl">
              <img
                src={selectedImage || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'}
                alt={product.title}
                className="w-full h-full object-cover"
              />
              {product.is_featured && (
                <span className="absolute top-4 left-4 px-3 py-1 bg-cyan-500 text-slate-950 text-xs font-bold rounded-full shadow-lg">
                  Featured
                </span>
              )}
            </div>

            {/* Thumbnail Row */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img.url)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                      selectedImage === img.url ? 'border-cyan-400 scale-95 shadow-md' : 'border-slate-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Information & Purchase Area */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">
                  {product.brand}
                </span>
                <div className="flex items-center gap-1 text-xs text-amber-400 ml-auto">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="font-bold">{product.rating_avg.toFixed(1)}</span>
                  <span className="text-slate-500">({product.review_count} reviews)</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                {product.title}
              </h1>

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-3xl font-black text-white">${currentPriceDollars}</span>
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {availableStock > 0 ? `In Stock (${availableStock} units)` : 'Out of Stock'}
                </span>
              </div>

              {/* Description */}
              <p className="mt-6 text-sm text-slate-300 leading-relaxed">
                {product.description}
              </p>

              {/* Variant Selector */}
              {product.variants && product.variants.length > 0 && (
                <div className="mt-8 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Edition / Variant</h3>
                  <div className="flex flex-wrap gap-2.5">
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          selectedVariant?.id === v.id
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md font-bold'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {v.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Ask Assistant Shortcut */}
              <div className="mt-8 p-4 bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Have questions about this hardware?</h4>
                    <p className="text-[11px] text-slate-400">Ask compatibility, specs, or comparison with alternatives</p>
                  </div>
                </div>
                <button
                  onClick={triggerAskAI}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Ask AI
                </button>
              </div>
            </div>

            {/* Actions: Quantity + Add to Cart */}
            <div className="mt-10 pt-6 border-t border-slate-900 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                    disabled={quantity >= availableStock}
                    className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart || availableStock <= 0}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 text-sm"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {addingToCart ? 'Adding to Cart...' : 'Add to Cart'}
                </button>
              </div>

              {/* Confidence badges */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[11px] text-slate-400">
                <div className="flex items-center justify-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-cyan-400" /> Free Shipping
                </div>
                <div className="flex items-center justify-center gap-1">
                  <RotateCcw className="w-3.5 h-3.5 text-indigo-400" /> 30-Day Returns
                </div>
                <div className="flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 2-Yr Warranty
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
