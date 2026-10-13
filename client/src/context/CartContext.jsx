import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { axiosInstance } from '../axiosCalls/axios'
import { useAuth } from './AuthContext'

const CartContext = createContext()

export const CartProvider = ({ children }) => {
  const { user } = useAuth()
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch cart items from backend for the authenticated user
  const fetchCart = useCallback(async () => {
    if (!user) {
      setCart([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await axiosInstance.get('/cart')
      if (res.data && res.data.success && Array.isArray(res.data.cart)) {
        setCart(res.data.cart)
      } else {
        setCart([])
      }
    } catch (err) {
      console.error('Error fetching cart:', err)
      setError(err.response?.data?.message || 'Failed to load cart')
      setCart([])
    } finally {
      setLoading(false)
    }
  }, [user])

  // Automatically fetch cart when user logs in or changes
  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  // Add product to cart (or increment quantity)
  const addToCart = async (productId) => {
    try {
      const res = await axiosInstance.post(`/cart/${productId}`)
      if (res.data && res.data.success && Array.isArray(res.data.cart)) {
        setCart(res.data.cart)
        return { success: true, message: res.data.message || 'Added to cart' }
      }
      // If no full cart returned, refresh cart
      await fetchCart()
      return { success: true, message: 'Added to cart' }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to add item to cart'
      return { success: false, message }
    }
  }

  // Update item quantity
  const updateQuantity = async (productId, quantity) => {
    try {
      const res = await axiosInstance.patch(`/cart/${productId}`, { quantity })
      if (res.data && res.data.success && Array.isArray(res.data.cart)) {
        setCart(res.data.cart)
        return { success: true, message: res.data.message || 'Cart updated' }
      }
      await fetchCart()
      return { success: true, message: 'Cart updated' }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update quantity'
      return { success: false, message }
    }
  }

  // Remove item from cart
  const removeFromCart = async (productId) => {
    try {
      const res = await axiosInstance.delete(`/cart/${productId}`)
      if (res.data && res.data.success && Array.isArray(res.data.cart)) {
        setCart(res.data.cart)
        return { success: true, message: res.data.message || 'Item removed from cart' }
      }
      await fetchCart()
      return { success: true, message: 'Item removed from cart' }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to remove item'
      return { success: false, message }
    }
  }

  // Derived calculations
  const totalCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
  }, [cart])

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const price = item.product ? Number(item.product.price) || 0 : 0
      const qty = Number(item.quantity) || 0
      return sum + price * qty
    }, 0)
  }, [cart])

  // Clear cart in local state (called after successful order placement)
  const clearCart = () => {
    setCart([])
  }

  const value = {
    cart,
    cartItems: cart,
    loading,
    error,
    totalCount,
    subtotal,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    resetCart: clearCart,
    refreshCart: fetchCart,
    fetchCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export default CartContext
