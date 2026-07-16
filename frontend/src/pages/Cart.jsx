import React, { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';

export default function Cart() {
  // Mock cart items (integrated with CartContext later)
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "NeuralBuds Pro",
      category: "Audio",
      price: "$189",
      numericPrice: 189.00,
      quantity: 1,
      image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: 3,
      name: "Apex AI Smart Hub",
      category: "Smart Home",
      price: "$149",
      numericPrice: 149.00,
      quantity: 1,
      image: "https://images.unsplash.com/photo-1558089687-f282ffcbd1d5?auto=format&fit=crop&w=600&q=80"
    }
  ]);

  const handleUpdateQuantity = (id, newQty) => {
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity: newQty } : item));
  };

  const handleRemoveItem = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cartItems.reduce((acc, curr) => acc + (curr.numericPrice * curr.quantity), 0);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8 flex items-center gap-2">
        <ShoppingBag className="w-6 h-6 text-cyan-400" />
        <h1 className="text-2xl font-black text-white">Your Workspace Cart</h1>
      </div>

      {cartItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart List */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map(item => (
              <CartItem 
                key={item.id} 
                item={item} 
                onUpdateQuantity={handleUpdateQuantity} 
                onRemove={handleRemoveItem} 
              />
            ))}
          </div>

          {/* Cart Summary Panel */}
          <div>
            <CartSummary subtotal={subtotal} onCheckout={() => alert("Redirecting to secure local payment engine...")} />
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-900/20 border border-dashed border-slate-800 rounded-xl">
          <p className="text-slate-500 text-sm">Your cart is empty. Add smart devices to build your setup.</p>
        </div>
      )}
    </div>
  );
}