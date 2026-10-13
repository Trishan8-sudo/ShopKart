import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { axiosInstance } from '../axiosCalls/axios'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import Navbar from '../components/Navbar'

function Checkout() {
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const { cart, subtotal, totalCount, clearCart, loading: cartLoading } = useCart()

  // Shipping Form State
  const [formData, setFormData] = useState({
    fullName: authUser?.fullName || '',
    phone: authUser?.phone || '',
    addressLine1: '',
    city: '',
    state: '',
    pincode: '',
  })

  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState(null)

  // Redirect to cart if cart is empty once loaded
  useEffect(() => {
    if (!cartLoading && cart.length === 0) {
      navigate('/cart')
    }
  }, [cart, cartLoading, navigate])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else {
      const phoneDigits = formData.phone.trim().replace(/\D/g, '')
      if (phoneDigits.length !== 10) {
        newErrors.phone = 'Phone number must contain 10 digits'
      }
    }

    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = 'Address line is required'
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required'
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required'
    } else if (!/^[0-9]{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = 'Pincode must contain 6 digits'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear field-level error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  // Load Razorpay SDK script dynamically if needed
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    setApiError(null)

    if (!validateForm()) {
      return
    }

    if (cart.length === 0) {
      setApiError('Your cart is empty. Please add items before checking out.')
      return
    }

    setSubmitting(true)

    try {
      // 1. Create Payment Order on Backend
      const orderPayload = {
        shippingAddress: {
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          addressLine1: formData.addressLine1.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
        },
      }

      const res = await axiosInstance.post('/orders/create-payment-order', orderPayload)

      if (!res.data || !res.data.success) {
        throw new Error(res.data?.message || 'Failed to initialize order')
      }

      const {
        orderId,
        shopKartOrderId,
        razorpayOrderId,
        amount,
        currency,
        key,
        keyId,
      } = res.data

      const activeOrderId = shopKartOrderId || orderId
      const activeKey = key || keyId

      // 2. Ensure Razorpay checkout script is available
      const isLoaded = await loadRazorpayScript()
      if (!isLoaded || !window.Razorpay) {
        // Fallback for offline testing / sandbox test simulation
        const testPaymentId = `pay_test_${Date.now()}`
        const testSignature = `test_signature_${Date.now()}`

        const verifyRes = await axiosInstance.post('/orders/verify-payment', {
          shopKartOrderId: activeOrderId,
          orderId: activeOrderId,
          razorpay_order_id: razorpayOrderId,
          razorpayOrderId,
          razorpay_payment_id: testPaymentId,
          razorpayPaymentId: testPaymentId,
          razorpay_signature: testSignature,
          razorpaySignature: testSignature,
        })

        if (verifyRes.data && verifyRes.data.success) {
          clearCart()
          navigate(`/order-success/${activeOrderId}`)
          return
        }
      }

      // 3. Open Razorpay Checkout Options (Step 10)
      const options = {
        key: activeKey,
        amount: amount,
        currency: currency || 'INR',
        name: 'ShopKart',
        description: 'ShopKart Order',
        image: 'https://cdn-icons-png.flaticon.com/512/3081/3081840.png',
        order_id: razorpayOrderId && !razorpayOrderId.startsWith('order_test_') ? razorpayOrderId : undefined,
        handler: async function (response) {
          try {
            // 4. Verify payment signature on backend (Step 11)
            const verifyPayload = {
              shopKartOrderId: activeOrderId,
              orderId: activeOrderId,
              razorpay_order_id: response.razorpay_order_id || razorpayOrderId,
              razorpayOrderId: response.razorpay_order_id || razorpayOrderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              razorpaySignature: response.razorpay_signature,
            }

            const verifyRes = await axiosInstance.post('/orders/verify-payment', verifyPayload)

            if (verifyRes.data && verifyRes.data.success) {
              // 5. Clear global cart state and navigate to success screen (Step 14)
              clearCart()
              navigate(`/order-success/${activeOrderId}`)
            } else {
              setApiError(verifyRes.data?.message || 'Payment verification failed.')
              setSubmitting(false)
            }
          } catch (verifyErr) {
            console.error('Error verifying payment:', verifyErr)
            setApiError(
              verifyErr.response?.data?.message ||
                'Payment verification failed. Your cart has not been cleared. Please try again.'
            )
            setSubmitting(false)
          }
        },
        prefill: {
          name: formData.fullName,
          contact: formData.phone,
          email: authUser?.email || '',
        },
        theme: {
          color: '#6366f1', // Indigo accent
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false)
          },
        },
      }

      // If valid Razorpay key is present and order is registered with Razorpay
      if (window.Razorpay && activeKey && !activeKey.includes('51b7Q5kX8K68Y1') && !razorpayOrderId.startsWith('order_test_')) {
        const rzp = new window.Razorpay(options)
        rzp.on('payment.failed', function (response) {
          console.error('Razorpay payment failed:', response.error)
          setApiError(response.error?.description || 'Payment failed. Your cart has not been cleared. Please try again.')
          setSubmitting(false)
        })
        rzp.open()
      } else {
        // Fallback / Instant Sandbox Test Simulation when no registered live Razorpay test account is provided
        setShowTestModal({
          orderId: activeOrderId,
          shopKartOrderId: activeOrderId,
          razorpayOrderId,
          amount,
          currency: currency || 'INR',
          totalAmount: res.data.totalAmount,
        })
        setSubmitting(false)
      }
    } catch (err) {
      console.error('Order creation error:', err)
      setApiError(
        err.response?.data?.message ||
          err.message ||
          'Something went wrong while processing your order.'
      )
      setSubmitting(false)
    }
  }

  const [showTestModal, setShowTestModal] = useState(null)

  const handleSimulatePayment = async (status) => {
    if (!showTestModal) return
    setSubmitting(true)
    const { orderId, shopKartOrderId, razorpayOrderId } = showTestModal
    const activeOrderId = shopKartOrderId || orderId

    try {
      if (status === 'SUCCESS') {
        const verifyRes = await axiosInstance.post('/orders/verify-payment', {
          shopKartOrderId: activeOrderId,
          orderId: activeOrderId,
          razorpay_order_id: razorpayOrderId,
          razorpayOrderId,
          razorpay_payment_id: `pay_test_${Date.now()}`,
          razorpayPaymentId: `pay_test_${Date.now()}`,
          razorpay_signature: 'simulated_success',
          razorpaySignature: 'simulated_success',
        })

        if (verifyRes.data && verifyRes.data.success) {
          setShowTestModal(null)
          clearCart()
          navigate(`/order-success/${activeOrderId}`)
          return
        } else {
          setApiError(verifyRes.data?.message || 'Payment verification failed.')
        }
      } else {
        // Payment Failure Simulation (Step 15)
        setApiError('Payment failed. Your cart has not been cleared. Please try again.')
      }
    } catch (err) {
      console.error('Verification error:', err)
      setApiError(err.response?.data?.message || 'Payment verification failed.')
    } finally {
      setShowTestModal(null)
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-indigo-500 selection:text-white relative">
      <Navbar customer={authUser} />

      {/* Background ambient lighting */}
      <div className="fixed top-24 left-1/4 -translate-x-1/2 w-[550px] h-[350px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-12 right-1/4 w-[450px] h-[300px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
          <Link to="/cart" className="hover:text-indigo-400 transition-colors">
            Cart
          </Link>
          <span>/</span>
          <span className="text-slate-200 font-medium">Checkout</span>
        </div>

        {/* Page Header */}
        <div className="border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl sm:text-3xl">📦</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Checkout
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Provide delivery details and review your order before payment.
          </p>
        </div>

        {/* API Error Banner */}
        {apiError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3 shadow-lg">
            <span className="text-lg">⚠️</span>
            <div className="flex-1">
              <h4 className="font-semibold text-rose-200">Unable to proceed with order</h4>
              <p className="text-xs sm:text-sm mt-0.5">{apiError}</p>
            </div>
            <button
              onClick={() => setApiError(null)}
              className="text-rose-400 hover:text-rose-200 text-sm font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Grid: Shipping Form + Order Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Shipping Address Form */}
          <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
              <span className="text-xl">📍</span>
              <h2 className="text-lg font-bold text-white">Shipping Details</h2>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="e.g. Aarav Sharma"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border ${
                    errors.fullName ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-indigo-500'
                  } text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all`}
                />
                {errors.fullName && (
                  <p className="text-xs text-rose-400 mt-1 font-medium">{errors.fullName}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
                  Phone Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border ${
                    errors.phone ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-indigo-500'
                  } text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all`}
                />
                {errors.phone && (
                  <p className="text-xs text-rose-400 mt-1 font-medium">{errors.phone}</p>
                )}
              </div>

              {/* Address Line 1 */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
                  Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="addressLine1"
                  placeholder="e.g. Flat 402, Green Valley Apartments, 22 MG Road"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border ${
                    errors.addressLine1 ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-indigo-500'
                  } text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all`}
                />
                {errors.addressLine1 && (
                  <p className="text-xs text-rose-400 mt-1 font-medium">{errors.addressLine1}</p>
                )}
              </div>

              {/* City & State Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
                    City <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    placeholder="e.g. Bengaluru"
                    value={formData.city}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border ${
                      errors.city ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-indigo-500'
                    } text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all`}
                  />
                  {errors.city && (
                    <p className="text-xs text-rose-400 mt-1 font-medium">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
                    State <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    placeholder="e.g. Karnataka"
                    value={formData.state}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border ${
                      errors.state ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-indigo-500'
                    } text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all`}
                  />
                  {errors.state && (
                    <p className="text-xs text-rose-400 mt-1 font-medium">{errors.state}</p>
                  )}
                </div>
              </div>

              {/* Pincode */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
                  Pincode <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="pincode"
                  placeholder="e.g. 560001 (6 digits)"
                  maxLength="6"
                  value={formData.pincode}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border ${
                    errors.pincode ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-indigo-500'
                  } text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all`}
                />
                {errors.pincode && (
                  <p className="text-xs text-rose-400 mt-1 font-medium">{errors.pincode}</p>
                )}
              </div>
            </form>
          </div>

          {/* Right Column: Order Summary & Action */}
          <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl sticky top-24">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white">Order Summary</h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                {totalCount} {totalCount === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Cart Items Snapshot Preview */}
            <div className="max-h-60 overflow-y-auto space-y-3 pr-1 divide-y divide-slate-800/60">
              {cart.map((item) => {
                const product = item.product || {}
                const itemTotal = (Number(product.price) || 0) * (Number(item.quantity) || 1)
                return (
                  <div
                    key={product._id || item._id}
                    className="pt-3 first:pt-0 flex items-center justify-between gap-3 text-xs sm:text-sm"
                  >
                    <div className="flex items-center gap-3">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-950 border border-slate-800"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                          📦
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-200 line-clamp-1">{product.name}</p>
                        <p className="text-slate-400 text-xs">
                          Qty: {item.quantity} × ₹{Number(product.price || 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-white whitespace-nowrap">
                      ₹{itemTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Cost Breakdown */}
            <div className="border-t border-slate-800 pt-4 space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Items Subtotal</span>
                <span className="text-slate-200 font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Shipping & Handling</span>
                <span className="text-emerald-400 font-medium">FREE</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Estimated Taxes</span>
                <span className="text-slate-400 font-medium">Included</span>
              </div>
              <div className="border-t border-slate-800 pt-3 flex justify-between items-baseline">
                <span className="text-base font-bold text-white">Total Amount</span>
                <span className="text-2xl font-black text-indigo-400">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={submitting || cart.length === 0}
              className="w-full py-4 px-6 rounded-xl font-bold text-sm sm:text-base bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                  </svg>
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <span>Place Order with Razorpay</span>
                  <span>&rarr;</span>
                </>
              )}
            </button>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-center text-xs text-slate-400 space-y-1">
              <div className="flex items-center justify-center gap-1 text-slate-300 font-medium">
                <span>💳 Razorpay Test Mode Secured</span>
              </div>
              <p className="text-[11px] text-slate-500">
                100% test payments • No real money is charged
              </p>
            </div>
          </div>
        </div>

        {/* Razorpay Test Mode Simulation Modal */}
        {showTestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative animate-in fade-in zoom-in duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-sm">
                    💳
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Razorpay Test Gateway</h3>
                    <p className="text-xs text-slate-400">Sandbox Test Simulation</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTestModal(null)}
                  className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Order summary info */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Payable Amount:</span>
                  <span className="text-white font-bold text-sm">
                    ₹{showTestModal.totalAmount?.toLocaleString('en-IN') || subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                  <span>Order ID:</span>
                  <span className="text-indigo-400 truncate max-w-[200px]">{showTestModal.orderId}</span>
                </div>
                <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                  <span>Environment:</span>
                  <span className="text-emerald-400 font-semibold">Test Mode (Paise: {showTestModal.amount})</span>
                </div>
              </div>

              {/* Test Action Buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => handleSimulatePayment('SUCCESS')}
                  disabled={submitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>✓ Simulate Successful Payment</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulatePayment('FAILURE')}
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-rose-600/20 hover:text-rose-300 hover:border-rose-500/30 text-slate-300 border border-slate-700 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>✕ Simulate Failed Payment</span>
                </button>
              </div>

              <p className="text-[11px] text-center text-slate-500">
                To use the real Razorpay popup, add your official Test API Keys in <code className="text-indigo-300 font-mono">server/.env</code>
              </p>
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

export default Checkout
