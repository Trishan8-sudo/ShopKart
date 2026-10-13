import { useState } from 'react'
import { Link } from 'react-router-dom'
import { axiosInstance } from '../axiosCalls/axios'
import { useCart } from '../context/CartContext'

function WishlistCard({ product, onRemoveSuccess }) {
  const { _id, name, price, category, image, stock } = product
  const { cart, addToCart } = useCart()

  const [removing, setRemoving] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const isOutOfStock = stock <= 0
  const cartItem = cart.find(
    (item) => (item.product?._id || item.product)?.toString() === _id?.toString()
  )
  const isInCart = Boolean(cartItem)
  const isMaxStock = stock !== undefined && cartItem && cartItem.quantity >= stock

  const handleRemove = async () => {
    if (removing) return
    setRemoving(true)
    setFeedback(null)
    try {
      const res = await axiosInstance.delete(`/wishlist/${_id}`)
      if (res.data && res.data.success) {
        if (onRemoveSuccess) {
          onRemoveSuccess(_id)
        }
        window.dispatchEvent(new Event('wishlist-updated'))
      }
    } catch (err) {
      console.error('Failed to remove from wishlist:', err)
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Unable to remove product.',
      })
    } finally {
      setRemoving(false)
    }
  }

  const handleAddToCart = async () => {
    if (addingToCart || isOutOfStock || isMaxStock) return

    setAddingToCart(true)
    setFeedback(null)

    const result = await addToCart(_id)
    if (result.success) {
      setFeedback({
        type: 'success',
        message: isInCart ? 'Added another to cart!' : '🛒 Added to cart!',
      })
    } else {
      setFeedback({
        type: 'error',
        message: result.message || 'Could not add to cart.',
      })
    }

    setAddingToCart(false)
    setTimeout(() => setFeedback(null), 3000)
  }

  return (
    <div className="group flex flex-col justify-between bg-slate-900/80 border border-slate-800/90 hover:border-indigo-500/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-indigo-500/10 transition-all duration-300">
      <div>
        {/* Product Image */}
        <div className="relative aspect-video w-full bg-slate-950 overflow-hidden flex items-center justify-center border-b border-slate-800/60">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.onerror = null
              e.target.src =
                'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80'
            }}
          />
          {/* Category Chip */}
          <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900/85 backdrop-blur-md text-indigo-400 border border-slate-700/60 shadow-sm">
            {category}
          </span>
          {/* Heart Badge */}
          <span className="absolute top-3 right-3 w-7 h-7 rounded-full bg-rose-500/20 backdrop-blur-md border border-rose-500/40 text-rose-400 flex items-center justify-center text-xs shadow-sm">
            ❤️
          </span>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-2.5">
          <h3
            className="font-bold text-slate-100 text-base line-clamp-1 group-hover:text-indigo-400 transition-colors"
            title={name}
          >
            {name}
          </h3>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-xl font-extrabold text-white">
              ₹{Number(price).toLocaleString('en-IN')}
            </span>

            {/* Stock status */}
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                isOutOfStock
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : stock < 5
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}
            >
              {isOutOfStock ? 'Out of stock' : `${stock} units left`}
            </span>
          </div>

          {feedback && (
            <p
              className={`text-[11px] font-medium pt-1 ${
                feedback.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {feedback.message}
            </p>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 sm:p-5 pt-0 space-y-2">
        <button
          onClick={handleAddToCart}
          disabled={addingToCart || isOutOfStock || isMaxStock}
          className={`w-full py-2 px-3 rounded-xl font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:cursor-not-allowed ${
            isOutOfStock
              ? 'bg-slate-800/60 text-slate-500 border border-slate-700/50'
              : isMaxStock
              ? 'bg-slate-800 text-slate-400 border border-slate-700'
              : isInCart
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20 border border-indigo-500'
              : 'bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30'
          }`}
        >
          {addingToCart ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-current" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>Adding...</span>
            </>
          ) : isOutOfStock ? (
            <span>Out of Stock</span>
          ) : isMaxStock ? (
            <span>Max in Cart ({cartItem?.quantity})</span>
          ) : isInCart ? (
            <span>+ Add Another ({cartItem?.quantity})</span>
          ) : (
            <span>Add to Cart</span>
          )}
        </button>

        <div className="grid grid-cols-2 gap-2">
          <Link
            to={`/products/${_id}`}
            className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-all duration-200 border border-slate-700 shadow-sm cursor-pointer text-center"
          >
            <span>Details</span>
          </Link>

          <button
            onClick={handleRemove}
            disabled={removing}
            className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-semibold transition-all duration-200 border border-rose-500/30 hover:border-rose-500/50 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {removing ? <span>Removing...</span> : <span>Remove ♥</span>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default WishlistCard
