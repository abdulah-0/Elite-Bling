import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { FiCheckCircle, FiAlertCircle, FiClock, FiXCircle, FiArrowRight } from 'react-icons/fi'

export default function PaymentReturn() {
  const [searchParams] = useSearchParams()
  const ref = searchParams.get('ref')
  const navigate = useNavigate()
  const { clearCart } = useCart()

  const [loading, setLoading] = useState(true)
  const [orderInfo, setOrderInfo] = useState(null)
  const [displayState, setDisplayState] = useState('polling') // 'polling', 'paid', 'failed', 'expired', 'needs_review', 'timeout'
  const [errorMessage, setErrorMessage] = useState('')

  const pollCountRef = useRef(0)
  const maxPolls = 40 // 40 polls * 3s = 120s (2 minutes)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!ref) {
      setDisplayState('failed')
      setErrorMessage('Missing payment reference.')
      setLoading(false)
      return
    }

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(ref)}/payment-status`)
        if (!res.ok) {
          throw new Error('Unable to fetch payment status')
        }

        const data = await res.json()
        setOrderInfo(data)

        const paymentStatus = data.paymentStatus
        const attemptStatus = data.attemptStatus

        // Check for terminal paid status
        if (paymentStatus === 'paid' || attemptStatus === 'paid') {
          clearCart()
          setDisplayState('paid')
          setLoading(false)
          return
        }

        // Needs review
        if (paymentStatus === 'needs_review' || attemptStatus === 'needs_review') {
          setDisplayState('needs_review')
          setLoading(false)
          return
        }

        // Failed
        if (attemptStatus === 'failed') {
          setDisplayState('failed')
          setErrorMessage(data.providerMessage || 'Your transaction was not completed.')
          setLoading(false)
          return
        }

        // Expired
        if (attemptStatus === 'expired') {
          setDisplayState('expired')
          setErrorMessage('Your payment session has expired.')
          setLoading(false)
          return
        }

        // Continue polling if within 2-minute window
        pollCountRef.current += 1
        if (pollCountRef.current >= maxPolls) {
          setDisplayState('timeout')
          setLoading(false)
          return
        }

        timerRef.current = setTimeout(checkStatus, 3000)
      } catch (err) {
        console.error('Status check error:', err)
        pollCountRef.current += 1
        if (pollCountRef.current >= maxPolls) {
          setDisplayState('timeout')
          setLoading(false)
        } else {
          timerRef.current = setTimeout(checkStatus, 3000)
        }
      }
    }

    checkStatus()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [ref, clearCart])

  return (
    <div className="py-20 min-h-[70vh] flex items-center justify-center">
      <div className="container-custom max-w-xl">
        <div className="card p-8 md:p-10 text-center border border-gold-400/20 shadow-2xl">
          {displayState === 'polling' && (
            <div className="space-y-6">
              <div className="w-16 h-16 border-4 border-gold-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <h1 className="text-2xl font-heading font-bold text-ivory">
                Confirming Your Payment…
              </h1>
              <p className="text-dark-300 text-sm">
                We are securely communicating with Swich to verify your transaction. Please do not refresh or close this tab.
              </p>
            </div>
          )}

          {displayState === 'paid' && (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mx-auto">
                <FiCheckCircle className="w-10 h-10" />
              </div>
              <h1 className="text-3xl font-heading font-bold text-ivory">
                Payment Confirmed!
              </h1>
              <p className="text-dark-300 text-sm">
                Thank you for your purchase. Your payment was successfully received and your order is confirmed.
              </p>

              {orderInfo && (
                <div className="bg-dark-900/60 p-4 rounded-lg border border-gold-400/10 text-left text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-dark-400">Order Reference:</span>
                    <span className="text-ivory font-mono font-bold">{orderInfo.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-400">Total Paid:</span>
                    <span className="text-gold-400 font-bold">PKR {Number(orderInfo.total).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-400">Status:</span>
                    <span className="text-green-400 font-semibold uppercase">Paid</span>
                  </div>
                </div>
              )}

              <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/products" className="btn-primary">
                  Continue Shopping
                </Link>
                <Link to="/" className="btn-secondary">
                  Go to Home
                </Link>
              </div>
            </div>
          )}

          {displayState === 'timeout' && (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-yellow-500/10 text-yellow-400 rounded-full flex items-center justify-center mx-auto">
                <FiClock className="w-10 h-10" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-ivory">
                Still Processing
              </h1>
              <p className="text-dark-300 text-sm">
                Swich is still confirming your payment. If money was deducted from your account, your order will automatically be updated shortly. You can safely close this page.
              </p>
              <div className="pt-4">
                <Link to="/" className="btn-primary">
                  Return to Store
                </Link>
              </div>
            </div>
          )}

          {displayState === 'needs_review' && (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto">
                <FiAlertCircle className="w-10 h-10" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-ivory">
                Payment Verification in Progress
              </h1>
              <p className="text-dark-300 text-sm">
                We are verifying your transaction with Swich. If you were charged, you do not need to pay again. Our team will review and confirm your order.
              </p>
              <div className="pt-4">
                <Link to="/" className="btn-primary">
                  Return to Store
                </Link>
              </div>
            </div>
          )}

          {(displayState === 'failed' || displayState === 'expired') && (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto">
                <FiXCircle className="w-10 h-10" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-ivory">
                {displayState === 'expired' ? 'Payment Expired' : 'Payment Failed'}
              </h1>
              <p className="text-dark-300 text-sm">
                {errorMessage || "We couldn't complete your transaction. Your account has not been charged."}
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={() => navigate('/checkout')} className="btn-primary">
                  Try Again
                </button>
                <Link to="/products" className="btn-secondary">
                  Choose Another Method
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
