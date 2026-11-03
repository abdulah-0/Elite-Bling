import { useState, useEffect } from 'react'
import {
  FiX,
  FiRefreshCw,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiXCircle,
  FiActivity,
  FiShield,
} from 'react-icons/fi'
import { fetchPayoutDetail, inquirePayoutStatus } from './payoutApi'

export default function PayoutDetailModal({ payoutId, isOpen, onClose, onUpdated }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [inquiring, setInquiring] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (!isOpen || !payoutId) return
    setError('')
    setSuccessMsg('')
    setLoading(true)

    fetchPayoutDetail(payoutId)
      .then((detail) => setData(detail))
      .catch((err) => setError(err.message || 'Failed to load details'))
      .finally(() => setLoading(false))
  }, [isOpen, payoutId])

  if (!isOpen) return null

  const handleInquire = async () => {
    setError('')
    setSuccessMsg('')
    setInquiring(true)

    try {
      const res = await inquirePayoutStatus(payoutId)
      setSuccessMsg(res.message || 'Inquiry successfully refreshed provider status')
      // Reload details
      const detail = await fetchPayoutDetail(payoutId)
      setData(detail)
      if (onUpdated) onUpdated(detail.payout)
    } catch (err) {
      setError(err.message || 'Inquiry request failed')
    } finally {
      setInquiring(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'successful':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded bg-green-500/10 text-green-400 border border-green-500/20">Successful</span>
      case 'processing':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 animate-pulse">Processing (Swich)</span>
      case 'needs_review':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Needs Review</span>
      case 'failed':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded bg-red-500/10 text-red-400 border border-red-500/20">Failed</span>
      case 'cancelled':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded bg-dark-600 text-dark-300">Cancelled</span>
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded bg-dark-700 text-dark-300">{status}</span>
    }
  }

  const payout = data?.payout
  const events = data?.events || []
  const attempts = data?.attempts || []

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-900 border border-gold-400/30 max-w-3xl w-full max-h-[92vh] overflow-y-auto rounded-xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-dark-900 border-b border-gold-400/10 px-6 py-4 flex justify-between items-center z-10">
          <div>
            <h2 className="text-xl font-heading font-bold text-ivory flex items-center gap-2">
              <FiShield className="text-gold-400" />
              <span>Payout Audit & Verification</span>
            </h2>
            <p className="text-xs text-dark-400 font-mono mt-0.5">
              ID: {payoutId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center border border-gold-400/20 text-ivory hover:bg-gold-400/10 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-2 border-gold-400 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-dark-400 mt-3">Loading audit records…</p>
          </div>
        ) : error && !payout ? (
          <div className="p-6 text-center text-rosegold">{error}</div>
        ) : (
          <div className="p-6 space-y-6">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-lg">
                {successMsg}
              </div>
            )}

            {/* Status & Quick Action Bar */}
            <div className="bg-dark-950/70 p-4 rounded-xl border border-dark-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="text-xs text-dark-400 uppercase tracking-wider mb-1">Current State</div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(payout.internal_status)}
                  {payout.provider_code && (
                    <span className="text-xs font-mono text-dark-400">
                      Code: {payout.provider_code}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleInquire}
                  disabled={inquiring}
                  className="btn-secondary text-xs flex items-center space-x-1.5 py-2 px-3"
                  title="Inquire transaction status with Swich without creating a new transfer"
                >
                  <FiRefreshCw className={inquiring ? 'animate-spin' : ''} />
                  <span>{inquiring ? 'Inquiring…' : 'Inquire Status'}</span>
                </button>
              </div>
            </div>

            {/* Core Payout Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-dark-950/50 p-4 rounded-xl border border-dark-800/80 space-y-2">
                <div className="text-gold-400 font-semibold uppercase tracking-wider mb-2">Transaction Identifiers</div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Customer Tx ID:</span>
                  <span className="font-mono text-ivory select-all">{payout.customer_transaction_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Swich Tx ID:</span>
                  <span className="font-mono text-ivory">{payout.swich_transaction_id || 'Pending / None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Amount:</span>
                  <span className="text-gold-400 font-bold font-mono text-sm">PKR {Number(payout.amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Disbursement Category:</span>
                  <span className="text-ivory capitalize">{payout.recipient_type}</span>
                </div>
              </div>

              <div className="bg-dark-950/50 p-4 rounded-xl border border-dark-800/80 space-y-2">
                <div className="text-gold-400 font-semibold uppercase tracking-wider mb-2">Recipient & Bank Details</div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Verified Title:</span>
                  <span className="font-semibold text-ivory">{payout.account_title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Bank Channel:</span>
                  <span className="text-ivory">{payout.bank_name} ({payout.bank_code})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Account Masked:</span>
                  <span className="font-mono text-ivory">****{payout.account_number_last4}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">CNIC / Mobile:</span>
                  <span className="font-mono text-ivory text-[11px]">{payout.recipient_cnic_masked} / {payout.recipient_msisdn_masked}</span>
                </div>
              </div>
            </div>

            {/* Provider Message banner */}
            {payout.provider_message && (
              <div className="p-3 rounded-lg bg-dark-950/90 border border-dark-800 text-xs">
                <span className="text-dark-400 block mb-1 font-medium">Provider Message:</span>
                <span className="font-mono text-ivory">{payout.provider_message}</span>
              </div>
            )}

            {/* Status Transition Audit Timeline */}
            <div>
              <h3 className="text-xs uppercase tracking-wider font-semibold text-gold-400 mb-3 flex items-center gap-1.5">
                <FiActivity />
                <span>Lifecycle Status Events ({events.length})</span>
              </h3>
              <div className="border border-dark-800 rounded-xl overflow-hidden bg-dark-950/40 divide-y divide-dark-800/60 text-xs">
                {events.length === 0 ? (
                  <div className="p-4 text-center text-dark-500">No status events recorded</div>
                ) : (
                  events.map((ev) => (
                    <div key={ev.id} className="p-3 flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ivory uppercase tracking-wide text-[11px]">{ev.new_status}</span>
                          <span className="text-[10px] text-dark-500 font-mono">via {ev.source}</span>
                        </div>
                        {ev.message && <div className="text-dark-400 text-xs mt-0.5">{ev.message}</div>}
                      </div>
                      <span className="text-dark-500 text-[11px] font-mono whitespace-nowrap">
                        {new Date(ev.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Raw Provider Call Attempts */}
            <div>
              <h3 className="text-xs uppercase tracking-wider font-semibold text-gold-400 mb-3">
                Provider HTTP Attempts ({attempts.length})
              </h3>
              <div className="border border-dark-800 rounded-xl overflow-hidden bg-dark-950/40 divide-y divide-dark-800/60 text-xs font-mono">
                {attempts.length === 0 ? (
                  <div className="p-4 text-center text-dark-500">No provider attempts recorded</div>
                ) : (
                  attempts.map((att) => (
                    <div key={att.id} className="p-3 flex justify-between items-center text-[11px]">
                      <div>
                        <span className="text-gold-400 uppercase font-bold mr-2">[{att.operation}]</span>
                        <span className={att.outcome === 'success' ? 'text-green-400' : 'text-red-400'}>
                          {att.outcome}
                        </span>
                        {att.http_status && <span className="text-dark-400 ml-2">HTTP {att.http_status}</span>}
                        {att.provider_code && <span className="text-dark-400 ml-2">Code {att.provider_code}</span>}
                      </div>
                      <span className="text-dark-500">
                        {new Date(att.started_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
