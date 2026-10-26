import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { FiCheckCircle, FiAlertCircle, FiClock, FiXCircle, FiArrowRight, FiCopy } from 'react-icons/fi'

export default function PaymentReturn() {
  const [searchParams] = useSearchParams()
  const ref = searchParams.get('ref')
  const navigate = useNavigate()
  const { clearCart } = useCart()

  const [loading, setLoading] = useState(true)
  const [orderInfo, setOrderInfo] = useState(null)
  const [displayState, setDisplayState] = useState('polling') // 'polling', 'paid', 'failed', 'expired', 'needs_review', 'timeout'
  const [errorMessage, setErrorMessage] = useState('')
  const [copied, setCopied] = useState(false)

  const handleCopy = (text) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
          {displayState === 'polling' && orderInfo?.consumerNumber ? (
            <div className="space-y-6 text-left">
              <div className="text-center">
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-gold-400/10 text-gold-400 mb-3">
                  <FiClock className="w-8 h-8 animate-pulse" />
                </div>
                <h1 className="text-2xl md:text-3xl font-heading font-bold text-ivory">
                  1Bill Payment Generated
                </h1>
                <p className="text-dark-300 text-sm mt-1">
                  Please complete the payment using your banking app or ATM.
                </p>
              </div>

              {/* 1Bill Voucher Details Box */}
              <div className="bg-dark-900/80 border border-gold-400/30 rounded-xl p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gold-400 tracking-wider uppercase block mb-1">
                    1Bill Consumer / Voucher Number
                  </label>
                  <div className="flex items-center justify-between bg-dark-950/70 border border-dark-700 rounded-lg p-3">
                    <span className="font-mono text-xl md:text-2xl font-bold text-white tracking-widest select-all">
                      {orderInfo.consumerNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(orderInfo.consumerNumber)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 bg-gold-400/20 hover:bg-gold-400/30 text-gold-300 rounded text-xs font-medium transition-colors"
                    >
                      <FiCopy className="w-3.5 h-3.5" />
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-dark-400 text-xs block">Payable Amount</span>
                    <span className="text-gold-400 font-bold text-lg">
                      PKR {Number(orderInfo.total).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-dark-400 text-xs block">Bill Reference No</span>
                    <span className="text-ivory font-mono text-xs break-all">
                      {orderInfo.billReferenceNo || orderInfo.orderNumber}
                    </span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-dark-800/40 border border-dark-700/60 rounded-xl p-4 text-xs text-dark-300 space-y-2">
                <p className="font-semibold text-ivory">How to pay via 1Bill:</p>
                <ol className="list-decimal list-inside space-y-1 text-dark-300">
                  <li>Open your Mobile Banking app (Meezan, HBL, Alfalah, UBL, etc.) or Easypaisa / JazzCash / Nayapay / SadaPay.</li>
                  <li>Go to <strong className="text-ivory">Bill Payment</strong> → <strong className="text-ivory">1Bill</strong> (Invoice / Voucher).</li>
                  <li>Enter Consumer Number: <strong className="text-gold-400 font-mono">{orderInfo.consumerNumber}</strong>.</li>
                  <li>Confirm the payee and amount, then submit payment.</li>
                </ol>
              </div>

              <div className="flex items-center justify-center space-x-2 text-xs text-dark-400 text-center pt-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gold-400 animate-ping inline-block" />
                <span>Waiting for payment confirmation. This screen updates automatically once paid.</span>
              </div>
            </div>
          ) : displayState === 'polling' ? (
            <div className="space-y-6">
              <div className="w-16 h-16 border-4 border-gold-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <h1 className="text-2xl font-heading font-bold text-ivory">
                Confirming Your Payment…
              </h1>
              <p className="text-dark-300 text-sm">
                We are securely communicating with Swich to verify your transaction. Please do not refresh or close this tab.
              </p>
            </div>
          ) : null}

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
