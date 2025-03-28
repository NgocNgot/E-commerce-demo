"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";

interface CartItem {
  id: number;
  quantity: number;
  title: string;
  price: number;
  image: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: any, quantity?: number) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser(); // Fetch useruser

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const cartRes = await fetch("http://localhost:1337/api/carts?populate=*");
        const cartData = await cartRes.json();

        if (!cartData.data || cartData.data.length === 0) {
          setCart([]);
          return;
        }

        const updatedCart = cartData.data
          .map((item: any) => {
            if (!item.products || item.products.length === 0) return null;

            const product = item.products[0];
            return {
              id: item.id,
              quantity: item.quantity,
              title: product.title,
              price: product.pricing?.price || 0,
              image: product.media?.[0]?.url
                ? `http://localhost:1337${product.media[0].url}`
                : "/placeholder.jpg",
            };
          })
          .filter(Boolean);

        setCart(updatedCart);
      } catch (error) {
        console.error("Error fetching cart:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  const addToCart = async (product: any, quantity: number = 1) => {
    if (!user) {
      alert("Please login to add items to the cart.");
      return;
    }

    try {
      const res = await fetch("http://localhost:1337/api/carts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.jwt}`, // Add token to request
        },
        body: JSON.stringify({
          data: {
            products: [product.id],
            quantity,
            users_permissions_user: user.id,
          },
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to add product to cart");
      }

      const newCartItem = {
        id: product.id,
        quantity,
        title: product.title,
        price: product.pricing?.price || 0,
        image: product.media?.[0]?.url
          ? `http://localhost:1337${product.media[0].url}`
          : "/placeholder.jpg",
      };

      setCart((prevCart) => [...prevCart, newCartItem]);
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const removeFromCart = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:1337/api/carts/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to remove item from cart");
      }

      setCart((prevCart) => prevCart.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  const updateQuantity = (id: number, quantity: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
