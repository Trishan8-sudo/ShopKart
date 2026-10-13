import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

function CartItem({ item }) {
  const { product, quantity } = item
  const { updateQuantity, removeFromCart } = useCart()

  const [updating, setUpdating] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  if (!product) return null

  const { _id, name, price, category, image, stock } = product
  const itemTotal = Number(price) * Number(quantity)
  const isMaxStock = stock !== undefined && quantity >= stock

  const handleDecrease = async () => {
    if (quantity <= 1 || updating || removing) return
    setUpdating(true)
    setErrorMessage(null)
    const res = await updateQuantity(_id, quantity - 1)
    if (!res.success) {
      setErrorMessage(res.message)
    }
    setUpdating(false)
  }

  const handleIncrease = async () => {
    if (isMaxStock || updating || removing) return
    setUpdating(true)
    setErrorMessage(null)
    const res = await updateQuantity(_id, quantity + 1)
    if (!res.success) {
      setErrorMessage(res.message)
    }
    setUpdating(false)
  }

  const handleRemove = async () => {
    if (removing || updating) return
    setRemoving(true)
    setErrorMessage(null)
    const res = await removeFromCart(_id)
    if (!res.success) {
      setErrorMessage(res.message)
      setRemoving(false)
    }
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-slate-700 shadow-md">
      {/* Product Information Left Side */}
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <Link
          to={`/products/${_id}`}
          className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 group flex items-center justify-center"
        >
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.onerror = null
              e.target.src =
                'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80'
            }}
          />
        </Link>

        <div className="space-y-1 min-w-0 flex-1">
          {category && (
            <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
              {category}
            </span>
          )}
          <Link
            to={`/products/${_id}`}
            className="block text-sm sm:text-base font-bold text-white hover:text-indigo-400 transition-colors truncate"
            title={name}
          >
            {name}
          </Link>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>₹{Number(price).toLocaleString('en-IN')} each</span>
            {stock !== undefined && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  stock <= 2
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {stock} available
              </span>
            )}
          </div>
          {errorMessage && (
            <p className="text-[11px] text-rose-400 font-medium">{errorMessage}</p>
          )}
        </div>
      </div>

      {/* Controls & Price Right Side */}
      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 border-slate-800/80 pt-3 sm:pt-0">
        {/* Quantity Controls: [-] 2 [+] */}
        <div className="flex flex-col items-start sm:items-center gap-1">
          <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 p-1">
            <button
              onClick={handleDecrease}
              disabled={quantity <= 1 || updating || removing}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors text-sm font-bold cursor-pointer"
              title="Decrease quantity"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <span className="w-10 text-center font-bold text-sm text-white select-none">
              {updating ? (
                <span className="inline-block w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                quantity
              )}
            </span>
            <button
              onClick={handleIncrease}
              disabled={isMaxStock || updating || removing}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors text-sm font-bold cursor-pointer"
              title={isMaxStock ? 'Stock limit reached' : 'Increase quantity'}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <button
            onClick={handleRemove}
            disabled={removing || updating}
            className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
          >
            {removing ? (
              <span>Removing...</span>
            ) : (
              <span>Remove</span>
            )}
          </button>
        </div>

        {/* Item Total Price */}
        <div className="text-right min-w-[90px]">
          <span className="text-xs text-slate-400 block">Total</span>
          <span className="text-base sm:text-lg font-black text-white">
            ₹{itemTotal.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  )
}

export default CartItem
