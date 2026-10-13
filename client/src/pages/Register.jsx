import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { axiosInstance } from '../axiosCalls/axios'

function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
  })
  const [err, setErr] = useState(null)
  const [message, setMessage] = useState(null)
  const [loader, setLoader] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (err) setErr(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage(null)
    setErr(null)

    if (!form.fullName || !form.email || !form.password || !form.phone) {
      setErr('All fields are required')
      return
    }

    if (form.password.length < 6) {
      setErr('Password must be at least 6 characters')
      return
    }

    setLoader(true)
    try {
      const res = await axiosInstance.post('/customers/register', form)
      setMessage(res.data.message || 'Customer registered successfully! Redirecting to login...')
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (error) {
      setErr(error.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoader(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* Background Glow Effect */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-indigo-600/15 rounded-full blur-[130px] pointer-events-none" />

      {/* Form Card */}
      <div className="w-full max-w-md bg-slate-900/85 border border-slate-800/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl relative z-10">
        {/* Brand / Title */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-2xl mb-3 shadow-inner">
            🛒
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Create an Account</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Join ShopKart for the best deals & fast checkout
          </p>
        </div>

        {/* Error Alert Box */}
        {err && (
          <div className="mb-4 flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs sm:text-sm">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{err}</span>
          </div>
        )}

        {/* Success Alert Box */}
        {message && (
          <div className="mb-4 flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{message}</span>
          </div>
        )}

        {/* Form Fields */}
        <form className="space-y-3.5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              id="fullName"
              value={form.fullName}
              placeholder="Alex Johnson"
              className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={form.email}
              placeholder="alex@example.com"
              className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="password"
                value={form.password}
                placeholder="Min 6 characters"
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs focus:outline-none"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                    />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              id="phone"
              value={form.phone}
              placeholder="+1 (555) 000-0000"
              className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              onChange={handleChange}
              required
            />
          </div>

          {/* Signup Button */}
          <button
            type="submit"
            disabled={loader}
            className="w-full mt-5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/25 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loader ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Sign Up</span>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-6 text-center text-xs sm:text-sm text-slate-400">
          Already Registered?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline transition-colors">
            Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Register