import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { axiosInstance } from '../axiosCalls/axios'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

function OrderSuccess() {
  const { id } = useParams()
  const { user: authUser } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await axiosInstance.get(`/orders/${id}`)
        if (res.data && res.data.success && res.data.order) {
          setOrder(res.data.order)
        } else {
          setError('Order details not found')
        }
      } catch (err) {
        console.error('Error fetching order:', err)
        setError(err.response?.data?.message || 'Failed to load order details')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchOrder()
    }
  }, [id])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-indigo-500 selection:text-white relative">
      <Navbar customer={authUser} />

      {/* Background glow */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-emerald-600/10 rounded-full blur-[160px] pointer-events-none" />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 space-y-8">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
            <p className="text-sm font-medium text-slate-300">Retrieving order confirmation...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center space-y-5 max-w-md mx-auto p-8 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-2xl backdrop-blur-xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center text-3xl">
              ⚠️
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Order Not Found</h2>
              <p className="text-xs sm:text-sm text-rose-300">{error}</p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/orders"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-indigo-600/20"
              >
                View My Orders
              </Link>
              <Link
                to="/products"
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition-all border border-slate-700"
              >
                Browse Products
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Success Header Banner */}
            <div className="text-center space-y-4 bg-slate-900/60 border border-emerald-500/30 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />

              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-4xl shadow-lg shadow-emerald-500/20 animate-bounce">
                ✓
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Order Placed Successfully!
                </h1>
                <p className="text-xs sm:text-sm text-slate-300">
                  Thank you for your purchase. Your order is confirmed and being processed.
                </p>
              </div>

              {/* Order Meta Pills */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs">
                <div className="px-3.5 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300">
                  Order ID: <span className="font-mono text-indigo-400 font-bold">{order._id}</span>
                </div>
                <div className="px-3.5 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300">
                  Status:{' '}
                  <span className="text-emerald-400 font-semibold">{order.status || 'PLACED'}</span>
                </div>
                <div className="px-3.5 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300">
                  Payment:{' '}
                  <span className="text-emerald-400 font-semibold">
                    {order.paymentStatus || 'PAID'}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Purchased Items Snapshot */}
              <div className="md:col-span-7 bg-slate-900/70 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-4">
                <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
                  <span>Purchased Items</span>
                  <span className="text-xs text-slate-400 font-normal">
                    {order.items?.length || 0} unique items
                  </span>
                </h2>

                <div className="divide-y divide-slate-800/60 space-y-3">
                  {order.items?.map((item, idx) => (
                    <div
                      key={item.product || idx}
                      className="pt-3 first:pt-0 flex items-center justify-between gap-3 text-xs sm:text-sm"
                    >
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 rounded-xl object-cover bg-slate-950 border border-slate-800"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 text-xl">
                            📦
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-200">{item.name}</p>
                          <p className="text-slate-400 text-xs">
                            ₹{Number(item.price || 0).toLocaleString('en-IN')} × {item.quantity}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-white whitespace-nowrap">
                        ₹{(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString(
                          'en-IN'
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-800 pt-4 flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-slate-300">Total Paid</span>
                  <span className="text-xl sm:text-2xl font-black text-indigo-400">
                    ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Right Column: Delivery & Payment Details */}
              <div className="md:col-span-5 space-y-6">
                {/* Shipping Address Card */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-3 text-xs sm:text-sm">
                  <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                    <span>📍</span>
                    <span>Shipping Address</span>
                  </h3>
                  <div className="text-slate-300 space-y-1">
                    <p className="font-semibold text-white">{order.shippingAddress?.fullName}</p>
                    <p className="text-slate-400">{order.shippingAddress?.addressLine1}</p>
                    <p className="text-slate-400">
                      {order.shippingAddress?.city}, {order.shippingAddress?.state} -{' '}
                      {order.shippingAddress?.pincode}
                    </p>
                    <p className="text-slate-400 pt-1">
                      Phone: <span className="text-slate-200">{order.shippingAddress?.phone}</span>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Link
                    to="/orders"
                    className="w-full py-3.5 px-6 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer text-center"
                  >
                    <span>View My Orders</span>
                    <span>&rarr;</span>
                  </Link>

                  <Link
                    to="/products"
                    className="w-full py-3 px-6 rounded-xl font-semibold text-xs sm:text-sm bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all flex items-center justify-center gap-2 text-center"
                  >
                    <span>Continue Shopping</span>
                  </Link>
                </div>
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

export default OrderSuccess
