"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useUser } from "@/context/UserContext"
import { createPortal } from "react-dom"

interface CartItem {
  id: number
  quantity: number
  title: string
  price: number
  image: string
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (product: any, quantity?: number) => void
  removeFromCart: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  clearCart: () => void
  assignCartToUser: (userId: number, token: string) => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useUser() // Fetch useruser
  const [toast, setToast] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  const showToast = (message: string) => {
    setToast(message)
    setIsVisible(true)

    setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => setToast(null), 500)
    }, 2500)
  }

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const cartRes = await fetch("http://localhost:1337/api/carts?populate=*")
        const cartData = await cartRes.json()

        if (!cartData.data || cartData.data.length === 0) {
          setCart([])
          return
        }

        const updatedCart = cartData.data
          .map((item: any) => {
            if (!item.products || item.products.length === 0) return null

            const product = item.products[0]
            return {
              id: item.id,
              quantity: item.quantity,
              title: product.title,
              price: product.pricing?.price || 0,
              image: product.media?.[0]?.url ? `http://localhost:1337${product.media[0].url}` : "/placeholder.jpg",
            }
          })
          .filter(Boolean)

        setCart(updatedCart)
      } catch (error) {
        console.error("Error fetching cart:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCart()
  }, [])

  useEffect(() => {
    // When user logs in and we have cart items, assign them to the user
    if (user && user.id && user.jwt && cart.length > 0) {
      assignCartToUser(user.id, user.jwt)
    }
  }, [user])

  const addToCart = async (product: any, quantity = 1) => {
    // Use product.quantity if available, otherwise use the provided quantity parameter
    const finalQuantity = product.quantity || quantity

    try {
      const res = await fetch("http://localhost:1337/api/carts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(user && user.jwt ? { Authorization: `Bearer ${user.jwt}` } : {}),
        },
        body: JSON.stringify({
          data: {
            products: [product.id],
            quantity: finalQuantity,
            ...(user ? { users_permissions_user: user.id } : {}),
          },
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to add product to cart")
      }

      const newCartItem = {
        id: product.id,
        quantity: finalQuantity,
        title: product.title,
        price: product.pricing?.price || 0,
        image: product.media?.[0]?.url ? `http://localhost:1337${product.media[0].url}` : "/placeholder.jpg",
      }

      setCart((prevCart) => [...prevCart, newCartItem])
      console.log("Added to cart:", newCartItem)
      showToast("Add to cart successfully!")
    } catch (error) {
      console.error("Error adding to cart:", error)
      showToast("Failed to add to cart!")
    }
  }

  const removeFromCart = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:1337/api/carts/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        throw new Error("Failed to remove item from cart")
      }

      setCart((prevCart) => prevCart.filter((item) => item.id !== id))
    } catch (error) {
      console.error("Error removing from cart:", error)
    }
  }

  const updateQuantity = (id: number, quantity: number) => {
    setCart((prevCart) =>
      prevCart.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item)),
    )
  }

  const clearCart = () => {
    setCart([])
  }

  const assignCartToUser = async (userId: number, token: string) => {
    if (!cart.length) return

    try {
      // For each cart item, update it to associate with the user
      const updatePromises = cart.map(async (item) => {
        const res = await fetch(`http://localhost:1337/api/carts/${item.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            data: {
              users_permissions_user: userId,
            },
          }),
        })

        if (!res.ok) {
          throw new Error(`Failed to assign cart item ${item.id} to user`)
        }

        return res.json()
      })

      await Promise.all(updatePromises)
      console.log("All cart items assigned to user:", userId)
      showToast("Cart synchronized with your account!")
    } catch (error) {
      console.error("Error assigning cart to user:", error)
      showToast("Failed to sync cart with your account")
    }
  }

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, assignCartToUser }}>
      {children}
      {toast &&
        createPortal(
          <div
            className={`fixed top-20 right-5 px-6 py-2 rounded-full shadow-2xl text-rose-500 border border-2 border-rose-400 text-sm font-semibold bg-white transition-all duration-700
            ${isVisible ? "animate-bounce opacity-100 scale-105 translate-y-0 ease-out" : "opacity-0 scale-95 translate-y-4 ease-in"}`}
          >
            {toast}
          </div>,
          document.body,
        )}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

