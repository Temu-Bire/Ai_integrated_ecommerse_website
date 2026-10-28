import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const refreshCart = async () => {
    try {
      const data = await api.getCart();
      setCart(data);
    } catch (err) {
      console.warn('Error fetching cart:', err);
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  const addToCart = async (variantId, quantity = 1) => {
    setLoading(true);
    try {
      const updated = await api.addToCart(variantId, quantity);
      setCart(updated);
      return updated;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (quantity <= 0) {
      return removeFromCart(itemId);
    }
    setLoading(true);
    try {
      const updated = await api.updateCartItem(itemId, quantity);
      setCart(updated);
      return updated;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId) => {
    setLoading(true);
    try {
      const updated = await api.removeFromCart(itemId);
      setCart(updated);
      return updated;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    setLoading(true);
    try {
      await api.clearCart();
      setCart({
        items: [],
        total_quantity: 0,
        subtotal_cents: 0,
        currency: 'USD',
      });
    } finally {
      setLoading(false);
    }
  };

  const totalQuantity = cart?.total_quantity || 0;
  const subtotalCents = cart?.subtotal_cents || 0;
  const subtotalDollars = (subtotalCents / 100).toFixed(2);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        totalQuantity,
        subtotalCents,
        subtotalDollars,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
