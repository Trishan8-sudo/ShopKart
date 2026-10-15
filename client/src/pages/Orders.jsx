import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { axiosInstance } from '../axiosCalls/axios'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import Navbar from '../components/Navbar'

// Load Razorpay checkout script dynamically
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

function Orders() {
  const { user: authUser } = useAuth()
  const { clearCart } = useCart()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedOrder, setExpandedOrder] = useState(null)

  // Retry payment states
  const [retryingOrderId, setRetryingOrderId] = useState(null)
  const [retryError, setRetryError] = useState(null)
  const [showTestModal, setShowTestModal] = useState(null)

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

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const toggleExpand = (orderId) => {
    setExpandedOrder((prev) => (prev === orderId ? null : orderId))
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Recent'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PLACED':
      case 'CONFIRMED': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
      case 'SHIPPED':   return 'bg-sky-500/15 text-sky-400 border-sky-500/30'
      case 'DELIVERED': return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
      case 'PENDING_PAYMENT': return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
      default:          return 'bg-slate-800 text-slate-300 border-slate-700'
    }
  }

  const getPaymentBadge = (paymentStatus) => {
    switch (paymentStatus) {
      case 'PAID':   return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
      case 'FAILED': return 'bg-rose-500/15 text-rose-400 border-rose-500/30'
      default:       return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    }
  }

  // An order is retryable if payment not yet completed
  const isPaymentRetryable = (order) =>
    order.status === 'PENDING_PAYMENT' &&
    (order.paymentStatus === 'FAILED' || order.paymentStatus === 'PENDING')

  // ── Core retry payment handler ─────────────────────────────────────────────
  const handleRetryPayment = async (order) => {
    setRetryingOrderId(order._id)
    setRetryError(null)

    try {
      const res = await axiosInstance.post(`/orders/retry-payment/${order._id}`)
      if (!res.data?.success) throw new Error(res.data?.message || 'Failed to initiate retry')

      const {
        shopKartOrderId, orderId, razorpayOrderId,
        amount, totalAmount, currency, key, keyId,
      } = res.data
      const activeOrderId = shopKartOrderId || orderId
      const activeKey = key || keyId

      const isLoaded = await loadRazorpayScript()

      const onPaymentSuccess = async (rzpResponse) => {
        try {
          const verifyRes = await axiosInstance.post('/orders/verify-payment', {
            shopKartOrderId: activeOrderId,
            orderId: activeOrderId,
            razorpay_order_id:   rzpResponse.razorpay_order_id || razorpayOrderId,
            razorpayOrderId:     rzpResponse.razorpay_order_id || razorpayOrderId,
            razorpay_payment_id: rzpResponse.razorpay_payment_id,
            razorpayPaymentId:   rzpResponse.razorpay_payment_id,
            razorpay_signature:  rzpResponse.razorpay_signature,
            razorpaySignature:   rzpResponse.razorpay_signature,
          })
          if (verifyRes.data?.success) {
            clearCart()
            navigate(`/order-success/${activeOrderId}`)
          } else {
            setRetryError(verifyRes.data?.message || 'Payment verification failed.')
            setRetryingOrderId(null)
            fetchOrders()
          }
        } catch (verifyErr) {
          setRetryError(verifyErr.response?.data?.message || 'Payment verification failed.')
          setRetryingOrderId(null)
          fetchOrders()
        }
      }

      if (isLoaded && window.Razorpay && activeKey && !razorpayOrderId?.startsWith('order_test_')) {
        const options = {
          key: activeKey,
          amount,
          currency: currency || 'INR',
          name: 'ShopKart',
          description: 'Complete your pending payment',
          image: 'https://cdn-icons-png.flaticon.com/512/3081/3081840.png',
          order_id: razorpayOrderId,
          handler: (response) => onPaymentSuccess(response),
          prefill: {
            name: authUser?.fullName || '',
            contact: authUser?.phone || '',
            email: authUser?.email || '',
          },
          theme: { color: '#6366f1' },
          modal: {
            ondismiss: () => {
              setRetryingOrderId(null)
              fetchOrders()
            },
          },
        }
        const rzp = new window.Razorpay(options)
        rzp.on('payment.failed', (response) => {
          setRetryError(response.error?.description || 'Payment failed. Please try again.')
          setRetryingOrderId(null)
          fetchOrders()
        })
        rzp.open()
      } else {
        // Fallback: test simulation modal
        setShowTestModal({
          orderId: activeOrderId,
          shopKartOrderId: activeOrderId,
          razorpayOrderId,
          amount,
          totalAmount,
          currency: currency || 'INR',
        })
        setRetryingOrderId(null)
      }
    } catch (err) {
      setRetryError(err.response?.data?.message || err.message || 'Failed to initiate payment retry.')
      setRetryingOrderId(null)
    }
  }

  // ── Test modal simulate ────────────────────────────────────────────────────
  const handleSimulatePayment = async (status) => {
    if (!showTestModal) return
    setRetryingOrderId(showTestModal.orderId)
    const { orderId, shopKartOrderId, razorpayOrderId } = showTestModal
    const activeOrderId = shopKartOrderId || orderId

    try {
      if (status === 'SUCCESS') {
        const verifyRes = await axiosInstance.post('/orders/verify-payment', {
          shopKartOrderId: activeOrderId,
          orderId: activeOrderId,
          razorpay_order_id:   razorpayOrderId,
          razorpayOrderId,
          razorpay_payment_id: `pay_test_${Date.now()}`,
          razorpayPaymentId:   `pay_test_${Date.now()}`,
          razorpay_signature:  'simulated_success',
          razorpaySignature:   'simulated_success',
        })
        if (verifyRes.data?.success) {
          setShowTestModal(null)
          clearCart()
          navigate(`/order-success/${activeOrderId}`)
          return
        } else {
          setRetryError(verifyRes.data?.message || 'Payment verification failed.')
        }
      } else {
        setRetryError('Payment simulation failed. Your order is saved — you can retry anytime.')
      }
    } catch (err) {
      setRetryError(err.response?.data?.message || 'Payment verification failed.')
    } finally {
      setShowTestModal(null)
      setRetryingOrderId(null)
      fetchOrders()
    }
  }

  const failedOrders = orders.filter(isPaymentRetryable)
  const placedOrders = orders.filter((o) => !isPaymentRetryable(o))

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-indigo-500 selection:text-white relative">
      <Navbar customer={authUser} />
      <div className="fixed top-24 left-1/3 -translate-x-1/2 w-[550px] h-[350px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-6">

        {/* Page Header */}
        <div className="border-b border-slate-800/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl sm:text-3xl">📦</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">My Orders</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">Track and view all your previous purchases.</p>
          </div>
          {!loading && !error && orders.length > 0 && (
            <span className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-indigo-400 self-start sm:self-auto">
              {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed
            </span>
          )}
        </div>

        {/* Retry error banner */}
        {retryError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3 shadow-lg">
            <span className="text-lg">⚠️</span>
            <div className="flex-1">
              <h4 className="font-semibold text-rose-200">Payment Issue</h4>
              <p className="text-xs sm:text-sm mt-0.5">{retryError}</p>
            </div>
            <button onClick={() => setRetryError(null)} className="text-rose-400 hover:text-rose-200 text-sm font-bold cursor-pointer">✕</button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <p className="text-sm font-medium text-slate-300">Loading your orders...</p>
          </div>

        ) : error ? (
          <div className="py-20 text-center space-y-4 max-w-md mx-auto p-8 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-2xl backdrop-blur-xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center text-2xl">⚠️</div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Unable to load orders</h3>
              <p className="text-xs sm:text-sm text-rose-300">{error}</p>
            </div>
            <button onClick={fetchOrders} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-md shadow-indigo-600/20">
              Try Again
            </button>
          </div>

        ) : orders.length === 0 ? (
          <div className="py-20 text-center space-y-5 max-w-md mx-auto p-8 sm:p-10 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-2xl backdrop-blur-xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center text-3xl">📦</div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">You have not placed any orders yet.</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">Browse our wide selection of products and find something you love!</p>
            </div>
            <Link to="/products" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-md shadow-indigo-600/20">
              <span>Start Shopping</span><span>&rarr;</span>
            </Link>
          </div>

        ) : (
          <div className="space-y-8">

            {/* ── Pending Payment Section ─────────────────────────── */}
            {failedOrders.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-lg">⏳</span>
                  <h2 className="text-base font-bold text-amber-400">Pending Payments</h2>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
                    {failedOrders.length} {failedOrders.length === 1 ? 'order' : 'orders'}
                  </span>
                </div>

                {failedOrders.map((order) => {
                  const isExpanded = expandedOrder === order._id
                  const isRetrying = retryingOrderId === order._id

                  return (
                    <div key={order._id} className="bg-slate-900/80 border border-amber-500/30 rounded-3xl p-6 sm:p-7 backdrop-blur-xl shadow-xl shadow-amber-500/5 space-y-4">

                      {/* Alert strip */}
                      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25">
                        <span className="text-xl mt-0.5">💳</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-amber-300">Payment Pending</p>
                          <p className="text-xs text-amber-400/80 mt-0.5 leading-relaxed">
                            Your order was created but payment was not completed. Complete your payment below to confirm this order.
                          </p>
                        </div>
                      </div>

                      {/* Top bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-400">Order</span>
                            <span className="text-sm font-bold font-mono text-white">#{order._id}</span>
                          </div>
                          <p className="text-xs text-slate-400">{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${getPaymentBadge(order.paymentStatus)}`}>
                            Payment: {order.paymentStatus}
                          </span>
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${getStatusBadge(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-2 text-xs sm:text-sm">
                        {order.items?.map((item, idx) => (
                          <div key={item.product || idx} className="flex items-center justify-between gap-3 text-slate-300">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {item.image
                                ? <img src={item.image} alt={item.name} className="w-8 h-8 rounded-lg object-cover bg-slate-950 border border-slate-800 flex-shrink-0" />
                                : <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs flex-shrink-0">📦</span>
                              }
                              <span className="truncate font-medium text-slate-200">{item.name}</span>
                              <span className="text-slate-500 whitespace-nowrap">x {item.quantity}</span>
                            </div>
                            <span className="font-semibold text-slate-300 whitespace-nowrap">
                              Rs.{(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs text-slate-400 font-medium">Total Amount:</span>
                          <span className="text-lg sm:text-xl font-extrabold text-amber-400">
                            Rs.{Number(order.totalAmount || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => toggleExpand(order._id)}
                            className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer">
                            {isExpanded ? 'Hide Details' : 'View Details'}
                          </button>

                          <button type="button" id={`retry-payment-${order._id}`}
                            onClick={() => handleRetryPayment(order)}
                            disabled={isRetrying}
                            className="text-xs font-bold px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                            {isRetrying ? (
                              <>
                                <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                <span>Opening...</span>
                              </>
                            ) : (
                              <><span>Complete Payment</span></>
                            )}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-slate-800/60 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-950/40 p-4 rounded-2xl">
                          <div>
                            <h4 className="font-bold text-slate-200 mb-1.5">Shipping Address</h4>
                            <div className="text-slate-400 space-y-0.5">
                              <p className="font-semibold text-slate-300">{order.shippingAddress?.fullName}</p>
                              <p>{order.shippingAddress?.addressLine1}</p>
                              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
                              <p>Phone: {order.shippingAddress?.phone}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-200 mb-1.5">Payment Info</h4>
                            <div className="text-slate-400 space-y-1">
                              <p>Status: <span className="text-amber-400 font-semibold">{order.paymentStatus}</span></p>
                              {order.razorpayOrderId && <p className="font-mono text-[11px] truncate">Razorpay Order: {order.razorpayOrderId}</p>}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── Placed Orders Section ────────────────────────────── */}
            {placedOrders.length > 0 && (
              <div className="space-y-4">
                {failedOrders.length > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-lg">checkmark</span>
                    <h2 className="text-base font-bold text-emerald-400">Placed Orders</h2>
                  </div>
                )}
                {placedOrders.map((order) => {
                  const isExpanded = expandedOrder === order._id
                  return (
                    <div key={order._id} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 backdrop-blur-xl shadow-xl transition-all duration-200 hover:border-slate-700/80 space-y-4">

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-400">Order</span>
                            <span className="text-sm font-bold font-mono text-white">#{order._id}</span>
                          </div>
                          <p className="text-xs text-slate-400">{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${getPaymentBadge(order.paymentStatus)}`}>
                            Payment: {order.paymentStatus || 'PAID'}
                          </span>
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${getStatusBadge(order.status)}`}>
                            {order.status || 'PLACED'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs sm:text-sm">
                        {order.items?.map((item, idx) => (
                          <div key={item.product || idx} className="flex items-center justify-between gap-3 text-slate-300">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {item.image
                                ? <img src={item.image} alt={item.name} className="w-8 h-8 rounded-lg object-cover bg-slate-950 border border-slate-800 flex-shrink-0" />
                                : <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs flex-shrink-0">📦</span>
                              }
                              <span className="truncate font-medium text-slate-200">{item.name}</span>
                              <span className="text-slate-500 whitespace-nowrap">x {item.quantity}</span>
                            </div>
                            <span className="font-semibold text-slate-300 whitespace-nowrap">
                              Rs.{(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs text-slate-400 font-medium">Total Amount:</span>
                          <span className="text-lg sm:text-xl font-extrabold text-indigo-400">
                            Rs.{Number(order.totalAmount || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => toggleExpand(order._id)}
                            className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer">
                            {isExpanded ? 'Hide Details' : 'View Details'}
                          </button>
                          <Link to={`/order-success/${order._id}`}
                            className="text-xs font-semibold px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-all">
                            Receipt
                          </Link>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-slate-800/60 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-950/40 p-4 rounded-2xl">
                          <div>
                            <h4 className="font-bold text-slate-200 mb-1.5">Shipping Address</h4>
                            <div className="text-slate-400 space-y-0.5">
                              <p className="font-semibold text-slate-300">{order.shippingAddress?.fullName}</p>
                              <p>{order.shippingAddress?.addressLine1}</p>
                              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
                              <p>Phone: {order.shippingAddress?.phone}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-200 mb-1.5">Payment Info</h4>
                            <div className="text-slate-400 space-y-1">
                              <p>Status: <span className="text-emerald-400 font-semibold">{order.paymentStatus}</span></p>
                              {order.razorpayOrderId && <p className="font-mono text-[11px] truncate">Razorpay Order: {order.razorpayOrderId}</p>}
                              {order.razorpayPaymentId && <p className="font-mono text-[11px] truncate">Payment ID: {order.razorpayPaymentId}</p>}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Test Payment Simulation Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-black text-white text-sm">R</div>
                <div>
                  <h3 className="text-base font-bold text-white">Complete Payment</h3>
                  <p className="text-xs text-slate-400">Razorpay Test Simulation</p>
                </div>
              </div>
              <button onClick={() => { setShowTestModal(null); fetchOrders() }} className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer">x</button>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Payable Amount:</span>
                <span className="text-white font-bold text-sm">Rs.{showTestModal.totalAmount?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                <span>Order ID:</span>
                <span className="text-amber-400 truncate max-w-[200px]">{showTestModal.orderId}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button type="button" onClick={() => handleSimulatePayment('SUCCESS')} disabled={!!retryingOrderId}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
                Simulate Successful Payment
              </button>
              <button type="button" onClick={() => handleSimulatePayment('FAILURE')} disabled={!!retryingOrderId}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-rose-600/20 hover:text-rose-300 text-slate-300 border border-slate-700 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
                Simulate Failed Payment
              </button>
            </div>
            <p className="text-[11px] text-center text-slate-500">
              To use the real Razorpay popup, add your official Test API Keys in server/.env
            </p>
          </div>
        </div>
      )}

      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-500">
        <p>2026 ShopKart Inc. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default Orders
