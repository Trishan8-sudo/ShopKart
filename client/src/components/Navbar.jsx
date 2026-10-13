import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { axiosInstance } from '../axiosCalls/axios'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

function Navbar({ customer: propCustomer }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user: authUser, setUser } = useAuth()
  const { totalCount } = useCart()
  const customer = propCustomer || authUser
  const [loggingOut, setLoggingOut] = useState(false)
  const [wishlistCount, setWishlistCount] = useState(0)

  // Fetch current wishlist count from backend
  const fetchWishlistCount = async () => {
    try {
      const wishRes = await axiosInstance.get('/wishlist')
      if (wishRes.data && typeof wishRes.data.count === 'number') {
        setWishlistCount(wishRes.data.count)
      } else if (wishRes.data && Array.isArray(wishRes.data.wishlist)) {
        setWishlistCount(wishRes.data.wishlist.length)
      }
    } catch {
      // Unauthenticated or network error, ignore
    }
  }

  useEffect(() => {
    fetchWishlistCount()

    const handleWishlistUpdated = () => {
      fetchWishlistCount()
    }

    window.addEventListener('wishlist-updated', handleWishlistUpdated)
    return () => {
      window.removeEventListener('wishlist-updated', handleWishlistUpdated)
    }
  }, [customer])

  const handleLogout = async () => {
    try {
      setLoggingOut(true)
      await axiosInstance.post('/customers/logout')
      if (setUser) setUser(null)
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setLoggingOut(false)
      navigate('/login')
    }
  }

  const isHomeActive = location.pathname === '/home'
  const isProductsActive = location.pathname.startsWith('/products')
  const isWishlistActive = location.pathname === '/wishlist'
  const isCartActive = location.pathname === '/cart'
  const isOrdersActive = location.pathname.startsWith('/orders')

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-slate-900/80 border-b border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/home" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
              🛒
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Shop<span className="text-indigo-400">Kart</span>
              </span>
            </div>
          </Link>

          {/* Quick Nav Links */}
          <nav className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium">
            <Link
              to="/home"
              className={`transition-colors ${
                isHomeActive
                  ? 'text-indigo-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Home
            </Link>
            <Link
              to="/products"
              className={`transition-colors ${
                isProductsActive
                  ? 'text-indigo-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Products
            </Link>
            <Link
              to="/orders"
              className={`transition-colors ${
                isOrdersActive
                  ? 'text-indigo-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Orders
            </Link>
            <Link
              to="/wishlist"
              className={`inline-flex items-center gap-1.5 transition-colors ${
                isWishlistActive
                  ? 'text-rose-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Wishlist</span>
              {wishlistCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link
              to="/cart"
              className={`inline-flex items-center gap-1.5 transition-colors ${
                isCartActive
                  ? 'text-indigo-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Cart</span>
              {totalCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
                  {totalCount}
                </span>
              )}
            </Link>
          </nav>

          {/* Right Action Area: User Info + Logout */}
          <div className="flex items-center gap-3 sm:gap-4">
            {customer && (
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-200">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
                  {customer.fullName ? customer.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="font-medium max-w-[120px] truncate">{customer.fullName}</span>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-slate-200 bg-slate-800 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 border border-slate-700 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              title="Logout from ShopKart"
            >
              {loggingOut ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-rose-400" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Logging out...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Logout</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
