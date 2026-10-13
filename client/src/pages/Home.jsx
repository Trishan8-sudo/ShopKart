import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

function Home() {
  const navigate = useNavigate()
  const { user: customer, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Loading your ShopKart account...</p>
        </div>
      </div>
    )
  }

  if (!customer) {
    return null
  }

  const sampleCategories = [
    { name: 'Electronics', label: 'Electronics & Gadgets', icon: '💻', count: '140+ items' },
    { name: 'Fashion', label: 'Fashion & Apparel', icon: '👕', count: '280+ items' },
    { name: 'Home', label: 'Home & Living', icon: '🛋️', count: '95+ items' },
    { name: 'Books', label: 'Books & Stationery', icon: '📚', count: '60+ items' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-indigo-500 selection:text-white relative">
      {/* Top Navbar */}
      <Navbar customer={customer} />

      {/* Background Accent Gradients */}
      <div className="fixed top-20 right-1/4 w-[450px] h-[450px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-10 left-10 w-[350px] h-[350px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative z-10 space-y-8">
        {/* Welcome Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800/80 p-6 sm:p-10 shadow-2xl">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <span>✨ Exclusive Member Access</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-300 bg-clip-text text-transparent">
                {customer.fullName || 'Customer'}
              </span>
              !
            </h1>
            <p className="text-sm sm:text-base text-slate-300">
              Explore your personal shopping dashboard, manage your profile, and discover today's top picks curated for you.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-indigo-600/25"
              >
                <span>Browse Product Catalogue</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Customer Profile Details Card */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Customer Profile Overview */}
          <div className="md:col-span-1 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-indigo-500/30">
                {customer.fullName ? customer.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{customer.fullName}</h3>
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  Active Customer
                </span>
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-4 space-y-3.5 text-sm">
              <div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-0.5">
                  Customer Name
                </span>
                <p className="text-slate-100 font-semibold">{customer.fullName}</p>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-0.5">
                  Email Address
                </span>
                <p className="text-slate-100 font-medium break-all">{customer.email}</p>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-0.5">
                  Phone Number
                </span>
                <p className="text-slate-100 font-medium">{customer.phone || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Quick Categories Overview */}
          <div className="md:col-span-2 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Popular Categories</h2>
                <Link to="/products" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                  Browse All &rarr;
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {sampleCategories.map((cat, idx) => (
                  <div
                    key={idx}
                    onClick={() => navigate(`/products?category=${encodeURIComponent(cat.name)}`)}
                    className="group p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/50 transition-all cursor-pointer text-center flex flex-col items-center justify-center space-y-1"
                  >
                    <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{cat.icon}</span>
                    <span className="text-xs font-semibold text-slate-200 line-clamp-1">{cat.label}</span>
                    <span className="text-[11px] text-slate-400">{cat.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shopping perks footer */}
            <div className="grid grid-cols-3 gap-3 border-t border-slate-800/80 pt-4 text-center text-xs text-slate-400">
              <div>🚚 <span className="text-slate-300 font-medium">Free Shipping</span> on ₹499+</div>
              <div>🔒 <span className="text-slate-300 font-medium">Secure Checkout</span></div>
              <div>⚡ <span className="text-slate-300 font-medium">Instant Support</span> 24/7</div>
            </div>
          </div>
        </section>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-500">
        <p>© 2026 ShopKart Inc. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default Home