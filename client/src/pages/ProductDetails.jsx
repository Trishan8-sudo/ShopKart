import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { axiosInstance } from '../axiosCalls/axios'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import Navbar from '../components/Navbar'

function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: authCustomer } = useAuth()
  const { cart, addToCart } = useCart()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [addingToCart, setAddingToCart] = useState(false)
  const [cartMessage, setCartMessage] = useState(null)

  // Wishlist state
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [wishlistMessage, setWishlistMessage] = useState(null)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const wishRes = await axiosInstance.get('/wishlist')
        if (wishRes.data && wishRes.data.wishlist) {
          const hasItem = wishRes.data.wishlist.some(
            (item) => (item._id || item).toString() === id
          )
          setIsWishlisted(hasItem)
        }
      } catch(err) {
        console.error(err.response.data.message)
      }
    }

    const fetchProduct = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await axiosInstance.get(`/products/${id}`)
        if (res.data && res.data.product) {
          setProduct(res.data.product)
        } else {
          setError('Product not found')
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setError('Product not found.')
        } else if (err.response && err.response.status === 400) {
          setError('Invalid Product ID.')
        } else {
          setError('Something went wrong while loading product details.')
        }
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchProduct()
      fetchUserData()
    }
  }, [id, authCustomer])

  const cartItem = cart.find(
    (item) => (item.product?._id || item.product)?.toString() === id?.toString()
  )
  const isInCart = Boolean(cartItem)
  const isMaxStock =
    product && product.stock !== undefined && cartItem && cartItem.quantity >= product.stock

  const handleAddToCart = async () => {
    if (addingToCart || !product || product.stock <= 0 || isMaxStock) return

    setAddingToCart(true)
    setCartMessage(null)

    const result = await addToCart(id)
    if (result.success) {
      setCartMessage({
        type: 'success',
        text: isInCart ? 'Added another unit to cart!' : '🛒 Added to Cart successfully!',
      })
    } else {
      setCartMessage({
        type: 'error',
        text: result.message || 'Unable to add to cart.',
      })
    }

    setAddingToCart(false)
    setTimeout(() => {
      setCartMessage(null)
    }, 3500)
  }

  const handleWishlistToggle = async () => {
    if (wishlistLoading) return
    setWishlistLoading(true)
    setWishlistMessage(null)

    try {
      if (isWishlisted) {
        const res = await axiosInstance.delete(`/wishlist/${id}`)
        if (res.data && res.data.success) {
          setIsWishlisted(false)
          setWishlistMessage({ type: 'success', text: 'Removed from Wishlist' })
          window.dispatchEvent(new Event('wishlist-updated'))
        }
      } else {
        const res = await axiosInstance.post(`/wishlist/${id}`)
        if (res.data && res.data.success) {
          setIsWishlisted(true)
          setWishlistMessage({ type: 'success', text: '♥ Added to Wishlist' })
          window.dispatchEvent(new Event('wishlist-updated'))
        }
      }
    } catch (err) {
      console.error('Wishlist error in details:', err)
      if (err.response && err.response.status === 401) {
        setWishlistMessage({ type: 'error', text: 'Please log in to save items.' })
      } else if (err.response && err.response.status === 409) {
        setIsWishlisted(true)
        setWishlistMessage({ type: 'success', text: '♥ Already in Wishlist' })
      } else {
        setWishlistMessage({
          type: 'error',
          text: err.response?.data?.message || 'Unable to update wishlist. Please try again.',
        })
      }
    } finally {
      setWishlistLoading(false)
      setTimeout(() => setWishlistMessage(null), 3500)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-indigo-500 selection:text-white relative">
      <Navbar customer={authCustomer} />

      {/* Background Accent Gradients */}
      <div className="fixed top-24 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
          <Link to="/home" className="hover:text-slate-200 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link to="/products" className="hover:text-slate-200 transition-colors">
            Products
          </Link>
          <span>/</span>
          <span className="text-slate-200 truncate max-w-xs sm:max-w-md">
            {product ? product.name : 'Details'}
          </span>
        </div>

        {/* Dynamic States */}
        {loading ? (
          /* Loading State */
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <p className="text-sm font-medium text-slate-400">Loading product details...</p>
          </div>
        ) : error ? (
          /* Error State */
          <div className="py-20 text-center space-y-4 max-w-md mx-auto p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center text-2xl">
              ⚠️
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Unable to Load Product</h3>
              <p className="text-xs sm:text-sm text-rose-300">{error}</p>
            </div>
            <button
              onClick={() => navigate('/products')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-md shadow-indigo-600/20"
            >
              ← Back to Product Catalogue
            </button>
          </div>
        ) : product ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
            {/* Left: Large Product Image */}
            <div className="lg:col-span-6 space-y-4">
              <div className="relative aspect-square sm:aspect-4/3 w-full rounded-2xl bg-slate-950 border border-slate-800/80 overflow-hidden shadow-inner flex items-center justify-center group">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src =
                      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'
                  }}
                />
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/85 backdrop-blur-md text-indigo-400 border border-slate-700/60 shadow-md">
                  {product.category}
                </span>

                {/* Heart badge overlay */}
                <button
                  onClick={handleWishlistToggle}
                  disabled={wishlistLoading}
                  className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition-all cursor-pointer shadow-lg ${
                    isWishlisted
                      ? 'bg-rose-500 text-white border-rose-400 shadow-rose-500/30'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-rose-400 border-slate-700'
                  }`}
                  title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                >
                  {wishlistLoading ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                  ) : isWishlisted ? (
                    <span className="text-lg">♥</span>
                  ) : (
                    <span className="text-lg">♡</span>
                  )}
                </button>
              </div>

              {/* Shopping Assurance Perks */}
              <div className="grid grid-cols-3 gap-3 text-center text-[11px] text-slate-400 pt-2">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                  🚚 Free Fast Delivery
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                  🛡️ 1-Year Warranty
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                  🔄 7-Day Replacement
                </div>
              </div>
            </div>

            {/* Right: Info & Purchase Controls */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
                    {product.category}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                      product.stock > 0
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {product.stock > 0 ? `In Stock (${product.stock} left)` : 'Out of stock'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-snug">
                  {product.name}
                </h1>
              </div>

              {/* Price Banner */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  ₹{Number(product.price).toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-400">Inclusive of all taxes</span>
              </div>

              {/* Feedback toasts */}
              {cartMessage && (
                <div
                  className={`p-3 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    cartMessage.type === 'success'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {cartMessage.text}
                </div>
              )}

              {wishlistMessage && (
                <div
                  className={`p-3 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    wishlistMessage.type === 'success'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {wishlistMessage.text}
                </div>
              )}

              {/* Description Section */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Product Description
                </h3>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800/50 whitespace-pre-line">
                  {product.description}
                </p>
              </div>

              {/* Stock Details */}
              <div className="flex items-center justify-between text-xs sm:text-sm text-slate-400 border-t border-slate-800/80 pt-4">
                <span>Availability:</span>
                <span className="font-semibold text-slate-200">
                  {product.stock > 0 ? `${product.stock} units in warehouse` : 'Currently unavailable'}
                </span>
              </div>

              {/* Action Buttons: Add to Cart + Wishlist */}
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={product.stock <= 0 || isMaxStock || addingToCart}
                    className={`py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:cursor-not-allowed ${
                      product.stock <= 0
                        ? 'bg-slate-800 text-slate-500 border border-slate-700/50'
                        : isMaxStock
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-indigo-600/25'
                    }`}
                  >
                    {addingToCart ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                        <span>Adding...</span>
                      </>
                    ) : isMaxStock ? (
                      <span>Max in Cart ({cartItem?.quantity})</span>
                    ) : isInCart ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <span>+ Add Another ({cartItem?.quantity})</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleWishlistToggle}
                    disabled={wishlistLoading}
                    className={`py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base transition-all duration-200 flex items-center justify-center gap-2 border cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
                      isWishlisted
                        ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    {wishlistLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-indigo-400" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                        <span>Saving...</span>
                      </>
                    ) : isWishlisted ? (
                      <>
                        <span className="text-rose-400">♥</span>
                        <span>In Wishlist</span>
                      </>
                    ) : (
                      <>
                        <span className="text-slate-400">♡</span>
                        <span>Add to Wishlist</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Link
                    to="/products"
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 transition-colors"
                  >
                    ← Back to all products
                  </Link>

                  <Link
                    to="/wishlist"
                    className="text-xs text-rose-400 hover:text-rose-300 font-medium inline-flex items-center gap-1 transition-colors"
                  >
                    View Wishlist →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-500">
        <p>© 2026 ShopKart Inc. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default ProductDetails
