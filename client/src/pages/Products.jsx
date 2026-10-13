import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { axiosInstance } from '../axiosCalls/axios'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import ProductCard from '../components/ProductCard'
import SearchBar from '../components/SearchBar'

function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialCategory = searchParams.get('category') || 'All Categories'
  const initialSearch = searchParams.get('search') || ''

  const { user: authCustomer } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState(initialSearch)
  const [category, setCategory] = useState(initialCategory)
  const [wishlistIds, setWishlistIds] = useState(new Set())

  // Fetch wishlist IDs for the current user
  useEffect(() => {
    const fetchWishlistData = async () => {
      try {
        const wishRes = await axiosInstance.get('/wishlist')
        if (wishRes.data && wishRes.data.wishlist) {
          const ids = new Set(wishRes.data.wishlist.map((item) => (item._id || item).toString()))
          setWishlistIds(ids)
        }
      } catch {
        // User not logged in, ignore
      }
    }
    fetchWishlistData()

    const onWishlistUpdate = () => fetchWishlistData()
    window.addEventListener('wishlist-updated', onWishlistUpdate)
    return () => window.removeEventListener('wishlist-updated', onWishlistUpdate)
  }, [authCustomer])

  // Fetch products based on search & category
  const fetchProducts = useCallback(async (searchTerm, categoryFilter) => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (searchTerm && searchTerm.trim() !== '') {
        params.search = searchTerm.trim()
      }
      if (
        categoryFilter &&
        categoryFilter.trim() !== '' &&
        categoryFilter.toLowerCase() !== 'all categories'
      ) {
        params.category = categoryFilter.trim()
      }

      const res = await axiosInstance.get('/products', { params })
      if (res.data && res.data.products) {
        setProducts(res.data.products)
      } else {
        setProducts([])
      }
    } catch {
      setError('Something went wrong while loading products.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Update query params and refetch on search or category change
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchProducts(search, category)

      // Update URL query parameters
      const newParams = {}
      if (search) newParams.search = search
      if (category && category !== 'All Categories') newParams.category = category
      setSearchParams(newParams, { replace: true })
    }, 300)

    return () => clearTimeout(handler)
  }, [search, category, fetchProducts, setSearchParams])

  const handleResetFilters = () => {
    setSearch('')
    setCategory('All Categories')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-indigo-500 selection:text-white relative">
      <Navbar customer={authCustomer} />

      {/* Background Glow */}
      <div className="fixed top-28 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-6">
        {/* Header Title & Filter Area */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Product Catalogue
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Explore high-quality products curated for your daily lifestyle.
              </p>
            </div>
            {!loading && !error && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 self-start sm:self-auto">
                {products.length} {products.length === 1 ? 'product' : 'products'} available
              </span>
            )}
          </div>

          {/* Search & Category Filter UI */}
          <SearchBar
            search={search}
            category={category}
            onSearchChange={setSearch}
            onCategoryChange={setCategory}
            categories={['All Categories', 'Electronics', 'Fashion', 'Books', 'Home']}
          />
        </div>

        {/* Content States */}
        {loading ? (
          /* Loading State */
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <p className="text-sm font-medium text-slate-400">Loading products...</p>
          </div>
        ) : error ? (
          /* Error State */
          <div className="py-16 text-center space-y-4 max-w-md mx-auto p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-xl">
              ⚠️
            </div>
            <h3 className="text-base font-bold text-white">Oops! Something went wrong</h3>
            <p className="text-xs sm:text-sm text-rose-300">{error}</p>
            <button
              onClick={() => fetchProducts(search, category)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-lg shadow-rose-600/20"
            >
              Retry Loading
            </button>
          </div>
        ) : products.length === 0 ? (
          /* Empty State */
          <div className="py-20 text-center space-y-4 max-w-md mx-auto p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800/80 border border-slate-700/60 text-slate-400 flex items-center justify-center text-3xl">
              📦
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">No products found</h3>
              <p className="text-xs sm:text-sm text-slate-400">
                We couldn't find any products matching your search criteria.
              </p>
            </div>
            {(search || category !== 'All Categories') && (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-md shadow-indigo-600/20"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          /* Product Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((prod) => (
              <ProductCard
                key={prod._id}
                product={prod}
                initialWishlisted={wishlistIds.has(prod._id.toString())}
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

export default Products
