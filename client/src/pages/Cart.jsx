import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import CartItem from '../components/CartItem'

function Cart() {
  const { user: authCustomer } = useAuth()
  const { cart, loading, error, totalCount, subtotal, refreshCart } = useCart()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-indigo-500 selection:text-white relative">
      <Navbar customer={authCustomer} />

      {/* Subtle Background Glow */}
      <div className="fixed top-24 left-1/3 -translate-x-1/2 w-[550px] h-[350px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-6">
        {/* Page Title */}
        <div className="border-b border-slate-800/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl sm:text-3xl">🛒</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                My Cart
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Review your items and proceed to checkout.
            </p>
          </div>

          {!loading && !error && cart.length > 0 && (
            <span className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-indigo-400 self-start sm:self-auto shadow-sm">
              {totalCount} {totalCount === 1 ? 'item' : 'items'} in cart
            </span>
          )}
        </div>

        {/* 1. Loading State */}
        {loading && cart.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <p className="text-sm font-medium text-slate-300">Loading your cart...</p>
          </div>
        ) : error && cart.length === 0 ? (
          /* 2. Error State */
          <div className="py-20 text-center space-y-4 max-w-md mx-auto p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-2xl backdrop-blur-xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center text-2xl">
              ⚠️
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Unable to load your cart.</h3>
              <p className="text-xs sm:text-sm text-rose-300">{error}</p>
            </div>
            <button
              onClick={refreshCart}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-md shadow-indigo-600/20"
            >
              Try Again
            </button>
          </div>
        ) : cart.length === 0 ? (
          /* 3. Empty State */
          <div className="py-20 text-center space-y-5 max-w-md mx-auto p-8 sm:p-10 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-2xl backdrop-blur-xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center text-3xl">
              🛒
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Your cart is empty 🛒</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Looks like you haven't added anything yet.
              </p>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <span>Browse Products</span>
              <span>&rarr;</span>
            </Link>
          </div>
        ) : (
          /* 4. Cart Items and Order Summary Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Cart Items List */}
            <div className="lg:col-span-8 space-y-4">
              <div className="space-y-3">
                {cart.map((item) => (
                  <CartItem
                    key={item.product?._id || item._id}
                    item={item}
                  />
                ))}
              </div>

              <div className="pt-2">
                <Link
                  to="/products"
                  className="text-xs sm:text-sm text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>&larr;</span>
                  <span>Continue Shopping</span>
                </Link>
              </div>
            </div>

            {/* Order Summary Card */}
            <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl sticky top-24">
              <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
                Order Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Total Items</span>
                  <span className="text-slate-200 font-medium">{totalCount} units</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Delivery</span>
                  <span className="text-emerald-400 font-medium">FREE</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Taxes</span>
                  <span className="text-slate-400 font-medium">Included</span>
                </div>
                <div className="border-t border-slate-800 pt-3 flex justify-between items-baseline">
                  <span className="text-base font-bold text-white">Subtotal</span>
                  <span className="text-2xl font-black text-white">
                    ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <Link
                to="/checkout"
                className="w-full py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer text-center"
              >
                <span>Proceed to Checkout</span>
                <span>&rarr;</span>
              </Link>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-center text-xs text-slate-400">
                🔒 Safe & Secure 256-Bit SSL Checkout
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-500">
        <p>© 2026 ShopKart Inc. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default Cart
