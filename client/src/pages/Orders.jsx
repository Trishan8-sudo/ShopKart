import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { axiosInstance } from '../axiosCalls/axios'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

function Orders() {
  const { user: authUser } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedOrder, setExpandedOrder] = useState(null)

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await axiosInstance.get('/orders')
      if (res.data && res.data.success && Array.isArray(res.data.orders)) {
        setOrders(res.data.orders)
      } else {
        setOrders([])
      }
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError(err.response?.data?.message || 'Failed to load your orders.')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const toggleExpand = (orderId) => {
    setExpandedOrder((prev) => (prev === orderId ? null : orderId))
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Recent'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PLACED':
      case 'CONFIRMED':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
      case 'SHIPPED':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30'
      case 'DELIVERED':
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
      case 'PENDING_PAYMENT':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700'
    }
  }

  const getPaymentBadge = (paymentStatus) => {
    switch (paymentStatus) {
      case 'PAID':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
      case 'FAILED':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30'
      case 'PENDING':
      default:
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-indigo-500 selection:text-white relative">
      <Navbar customer={authUser} />

      {/* Subtle background glow */}
      <div className="fixed top-24 left-1/3 -translate-x-1/2 w-[550px] h-[350px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-6">
        {/* Page Header */}
        <div className="border-b border-slate-800/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl sm:text-3xl">📦</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                My Orders
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Track and view all your previous purchases.
            </p>
          </div>

          {!loading && !error && orders.length > 0 && (
            <span className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-indigo-400 self-start sm:self-auto">
              {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed
            </span>
          )}
        </div>

        {/* 1. Loading State */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <p className="text-sm font-medium text-slate-300">Loading your orders...</p>
          </div>
        ) : error ? (
          /* 2. Error State */
          <div className="py-20 text-center space-y-4 max-w-md mx-auto p-8 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-2xl backdrop-blur-xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center text-2xl">
              ⚠️
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Unable to load orders</h3>
              <p className="text-xs sm:text-sm text-rose-300">{error}</p>
            </div>
            <button
              onClick={fetchOrders}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-md shadow-indigo-600/20"
            >
              Try Again
            </button>
          </div>
        ) : orders.length === 0 ? (
          /* 3. Empty State */
          <div className="py-20 text-center space-y-5 max-w-md mx-auto p-8 sm:p-10 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-2xl backdrop-blur-xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center text-3xl">
              📦
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">You have not placed any orders yet.</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Browse our wide selection of products and find something you love!
              </p>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <span>Start Shopping</span>
              <span>&rarr;</span>
            </Link>
          </div>
        ) : (
          /* 4. Orders List */
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = expandedOrder === order._id

              return (
                <div
                  key={order._id}
                  className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 backdrop-blur-xl shadow-xl transition-all duration-200 hover:border-slate-700/80 space-y-4"
                >
                  {/* Order Card Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400">Order</span>
                        <span className="text-sm font-bold font-mono text-white">#{order._id}</span>
                      </div>
                      <p className="text-xs text-slate-400">{formatDate(order.createdAt)}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Payment Status Badge */}
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${getPaymentBadge(
                          order.paymentStatus
                        )}`}
                      >
                        Payment: {order.paymentStatus || 'PAID'}
                      </span>

                      {/* Order Status Badge */}
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${getStatusBadge(
                          order.status
                        )}`}
                      >
                        {order.status || 'PLACED'}
                      </span>
                    </div>
                  </div>

                  {/* Items Brief Preview */}
                  <div className="space-y-2 text-xs sm:text-sm">
                    {order.items?.map((item, idx) => (
                      <div
                        key={item.product || idx}
                        className="flex items-center justify-between gap-3 text-slate-300"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-8 h-8 rounded-lg object-cover bg-slate-950 border border-slate-800 flex-shrink-0"
                            />
                          ) : (
                            <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs flex-shrink-0">
                              📦
                            </span>
                          )}
                          <span className="truncate font-medium text-slate-200">{item.name}</span>
                          <span className="text-slate-500 whitespace-nowrap">× {item.quantity}</span>
                        </div>
                        <span className="font-semibold text-slate-300 whitespace-nowrap">
                          ₹{(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString(
                            'en-IN'
                          )}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer: Total & Actions */}
                  <div className="border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-slate-400 font-medium">Total Amount:</span>
                      <span className="text-lg sm:text-xl font-extrabold text-indigo-400">
                        ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleExpand(order._id)}
                        className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
                      >
                        {isExpanded ? 'Hide Details' : 'View Details'}
                      </button>

                      <Link
                        to={`/order-success/${order._id}`}
                        className="text-xs font-semibold px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-all"
                      >
                        Receipt &rarr;
                      </Link>
                    </div>
                  </div>

                  {/* Expandable Details Drawer */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-800/60 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-950/40 p-4 rounded-2xl">
                      {/* Shipping Info */}
                      <div>
                        <h4 className="font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                          <span>📍</span> Shipping Address
                        </h4>
                        <div className="text-slate-400 space-y-0.5">
                          <p className="font-semibold text-slate-300">
                            {order.shippingAddress?.fullName}
                          </p>
                          <p>{order.shippingAddress?.addressLine1}</p>
                          <p>
                            {order.shippingAddress?.city}, {order.shippingAddress?.state} -{' '}
                            {order.shippingAddress?.pincode}
                          </p>
                          <p>Phone: {order.shippingAddress?.phone}</p>
                        </div>
                      </div>

                      {/* Payment & Razorpay Info */}
                      <div>
                        <h4 className="font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                          <span>💳</span> Payment Info
                        </h4>
                        <div className="text-slate-400 space-y-1">
                          <p>
                            Payment Status:{' '}
                            <span className="text-emerald-400 font-semibold">
                              {order.paymentStatus}
                            </span>
                          </p>
                          {order.razorpayOrderId && (
                            <p className="font-mono text-[11px] truncate">
                              Razorpay Order: {order.razorpayOrderId}
                            </p>
                          )}
                          {order.razorpayPaymentId && (
                            <p className="font-mono text-[11px] truncate">
                              Payment ID: {order.razorpayPaymentId}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-500">
        <p>© 2026 ShopKart Inc. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default Orders
