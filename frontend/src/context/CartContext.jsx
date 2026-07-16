import { createContext, useContext, useState } from "react";

const CartContext = createContext();


export function CartProvider({ children }) {

  const [cartItems, setCartItems] = useState([]);


  // Add product
  const addToCart = (product) => {

    setCartItems((prev) => [
      ...prev,
      product
    ]);

  };


  // Remove product
  const removeFromCart = (productId) => {

    setCartItems((prev) =>
      prev.filter(
        item => item.id !== productId
      )
    );

  };


  // Clear cart
  const clearCart = () => {
    setCartItems([]);
  };


  // Total price
  const totalPrice = cartItems.reduce(
    (total, item) =>
      total + item.price,
    0
  );


  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        totalPrice
      }}
    >
      {children}
    </CartContext.Provider>
  );
}


// Custom hook
export function useCart() {
  return useContext(CartContext);
}