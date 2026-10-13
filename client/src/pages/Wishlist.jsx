import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { axiosInstance } from '../axiosCalls/axios'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import WishlistCard from '../components/WishlistCard'

function Wishlist() {
  const navigate = useNavigate()
  const { user: authCustomer } = useAuth()
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchWishlist = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axiosInstance.get('/wishlist')
      if (res.data && res.data.success) {
        setWishlist(res.data.wishlist || [])
      } else {
        setWishlist([])
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err)
      if (err.response && err.response.status === 401) {
        navigate('/login')
      } else {
        setError("We couldn't load your wishlist.")
      }
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    fetchWishlist()
  }, [fetchWishlist])

  // Remove handler to optimistically update UI without full page refresh
  const handleRemoveSuccess = (productId) => {
    setWishlist((prev) => prev.filter((item) => item._id !== productId))
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-indigo-500 selection:text-white relative">
      <Navbar customer={authCustomer} />

      {/* Background Accent Gradients */}
      <div className="fixed top-24 left-1/3 -translate-x-1/2 w-[550px] h-[350px] bg-rose-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-10 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-6">
        {/* Header Title Section */}
        <div className="border-b border-slate-800/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl sm:text-3xl">❤️</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                My Wishlist
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Your saved items to review or buy whenever you're ready.
            </p>
          </div>

          {!loading && !error && wishlist.length > 0 && (
            <span className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-indigo-400 self-start sm:self-auto shadow-sm">
              {wishlist.length} {wishlist.length === 1 ? 'product' : 'products'} saved
            </span>
          )}
        </div>

        {/* Content States */}
        {loading ? (
          /* 1. Loading State */
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin" />
            <p className="text-sm font-medium text-slate-300">
              Loading your wishlist...
            </p>
          </div>
        ) : error ? (
          /* 2. Error State */
          <div className="py-20 text-center space-y-4 max-w-md mx-auto p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-2xl backdrop-blur-xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center text-2xl">
              ⚠️
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Something went wrong.</h3>
              <p className="text-xs sm:text-sm text-rose-300">{error}</p>
            </div>
            <button
              onClick={fetchWishlist}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-md shadow-indigo-600/20"
            >
              Try Again
            </button>
          </div>
        ) : wishlist.length === 0 ? (
          /* 3. Empty State */
          <div className="py-20 text-center space-y-5 max-w-md mx-auto p-8 sm:p-10 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-2xl backdrop-blur-xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center text-3xl">
              ❤️
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Your wishlist is empty</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Save products you love and find them here later.
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
          /* 4. Populated Wishlist Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {wishlist.map((prod) => (
              <WishlistCard
                key={prod._id}
                product={prod}
                onRemoveSuccess={handleRemoveSuccess}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-500">
        <p>© 2026 ShopKart Inc. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default Wishlist