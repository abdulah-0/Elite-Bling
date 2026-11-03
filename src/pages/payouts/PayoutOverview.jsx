import { useState, useEffect } from 'react'
import {
  FiDollarSign,
  FiRefreshCw,
  FiPlus,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiXCircle,
  FiShield,
  FiSearch,
  FiFilter,
  FiEye,
} from 'react-icons/fi'
import {
  fetchPayoutConfig,
  fetchPayoutBalance,
  fetchPayoutsList,
  inquirePayoutStatus,
} from './payoutApi'
import CreatePayoutModal from './CreatePayoutModal'
import PayoutDetailModal from './PayoutDetailModal'

export default function PayoutOverview() {
  const [config, setConfig] = useState(null)
  const [balanceData, setBalanceData] = useState(null)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [balanceError, setBalanceError] = useState('')

  const [payouts, setPayouts] = useState([])
  const [loadingPayouts, setLoadingPayouts] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedPayoutId, setSelectedPayoutId] = useState(null)

  // Load configuration & initial data
  useEffect(() => {
    fetchPayoutConfig()
      .then(setConfig)
      .catch(() => {})

    loadBalance()
    loadPayouts()
  }, [])

  const loadBalance = async () => {
    setBalanceLoading(true)
    setBalanceError('')
    try {
      const data = await fetchPayoutBalance()
      setBalanceData(data)
    } catch (err) {
      setBalanceError(err.message || 'Could not fetch balance from Swich')
    } finally {
      setBalanceLoading(false)
    }
  }

  const loadPayouts = async () => {
    setLoadingPayouts(true)
    try {
      const res = await fetchPayoutsList({
        search,
        status: statusFilter,
        recipientType: typeFilter,
      })
      setPayouts(res.payouts || [])
      setTotalCount(res.total || 0)
    } catch (err) {
      console.error('Failed to load payouts:', err)
    } finally {
      setLoadingPayouts(false)
    }
  }

  // Reload when search/filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPayouts()
    }, 300)
    return () => clearTimeout(timer)
  }, [search, statusFilter, typeFilter])

  // Status stats
  const successfulCount = payouts.filter((p) => p.internal_status === 'successful').length
  const processingCount = payouts.filter((p) => p.internal_status === 'processing').length
  const reviewCount = payouts.filter((p) => p.internal_status === 'needs_review').length
  const failedCount = payouts.filter((p) => p.internal_status === 'failed').length
  const totalVolume = payouts
    .filter((p) => p.internal_status === 'successful')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

  const handleQuickInquire = async (id, e) => {
    e.stopPropagation()
    try {
      await inquirePayoutStatus(id)
      loadPayouts()
    } catch (err) {
      alert(err.message || 'Inquiry failed')
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'successful':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-green-500/10 text-green-400 border border-green-500/20">Successful</span>
      case 'processing':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 animate-pulse">Processing</span>
      case 'needs_review':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Needs Review</span>
      case 'failed':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-500/10 text-red-400 border border-red-500/20">Failed</span>
      case 'cancelled':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-dark-600 text-dark-300">Cancelled</span>
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-dark-700 text-dark-300">{status}</span>
    }
  }

  return (
    <div className="space-y-8">
      {/* Configuration & Environment Alert */}
      {config && !config.enabled && (
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm flex items-start gap-3">
          <FiAlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-ivory">
              Swich PayOut Standby Mode ({config.env.toUpperCase()})
            </div>
            <p className="text-dark-300 text-xs">
              Outgoing disbursements are currently disabled via <code>SWICH_PAYOUTS_ENABLED=false</code>. Title verification and balance queries can be tested, but IBFT execution is locked until enabled.
            </p>
          </div>
        </div>
      )}

      {/* Top Banner: Swich Live Balance & Quick Action */}
      <div className="card p-6 border border-gold-400/20 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-dark-400 text-xs uppercase tracking-widest font-medium mb-1">
            <FiShield className="text-gold-400" />
            <span>Swich Disbursement Balance</span>
            <span className="px-1.5 py-0.5 bg-dark-800 text-[10px] text-ivory uppercase rounded">
              {config?.env || 'Sandbox'}
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <div className="text-3xl md:text-4xl font-heading font-bold text-gold-400">
              {balanceData?.balance != null ? `PKR ${Number(balanceData.balance).toLocaleString()}` : '—'}
            </div>
            {balanceLoading && <span className="text-xs text-dark-400 animate-pulse">Checking balance…</span>}
          </div>

          {balanceError ? (
            <div className="text-xs text-rosegold mt-1">{balanceError}</div>
          ) : balanceData?.fetchedAt ? (
            <div className="text-[11px] text-dark-400 mt-1">
              Last synchronized: {new Date(balanceData.fetchedAt).toLocaleTimeString()}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={loadBalance}
            disabled={balanceLoading}
            className="btn-secondary flex items-center justify-center space-x-2 py-2.5 px-4 text-xs flex-1 md:flex-initial"
            title="Fetch real-time balance from Swich"
          >
            <FiRefreshCw className={balanceLoading ? 'animate-spin' : ''} />
            <span>Refresh Balance</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center justify-center space-x-2 py-2.5 px-5 text-xs flex-1 md:flex-initial"
          >
            <FiPlus />
            <span>Initiate Payout</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 border border-gold-400/10">
          <div className="flex items-center justify-between text-dark-400 text-xs mb-1">
            <span>Successful</span>
            <FiCheckCircle className="text-green-400" />
          </div>
          <div className="text-2xl font-heading font-bold text-ivory">{successfulCount}</div>
          <div className="text-[11px] text-dark-400 mt-0.5">PKR {totalVolume.toLocaleString()} settled</div>
        </div>

        <div className="card p-4 border border-gold-400/10">
          <div className="flex items-center justify-between text-dark-400 text-xs mb-1">
            <span>Processing</span>
            <FiClock className="text-yellow-400" />
          </div>
          <div className="text-2xl font-heading font-bold text-yellow-400">{processingCount}</div>
          <div className="text-[11px] text-dark-400 mt-0.5">In queue / awaiting inquiry</div>
        </div>

        <div className="card p-4 border border-gold-400/10">
          <div className="flex items-center justify-between text-dark-400 text-xs mb-1">
            <span>Needs Review</span>
            <FiAlertCircle className="text-blue-400" />
          </div>
          <div className="text-2xl font-heading font-bold text-blue-400">{reviewCount}</div>
          <div className="text-[11px] text-dark-400 mt-0.5">Timeouts / uncertain states</div>
        </div>

        <div className="card p-4 border border-gold-400/10">
          <div className="flex items-center justify-between text-dark-400 text-xs mb-1">
            <span>Failed</span>
            <FiXCircle className="text-rosegold" />
          </div>
          <div className="text-2xl font-heading font-bold text-rosegold">{failedCount}</div>
          <div className="text-[11px] text-dark-400 mt-0.5">Declined transfers</div>
        </div>
      </div>

      {/* Payout History & Audit Table */}
      <div className="card overflow-hidden border border-gold-400/10">
        {/* Table Filter Controls */}
        <div className="p-4 bg-dark-950/60 border-b border-gold-400/10 flex flex-col md:flex-row gap-3 justify-between items-center">
          <div className="relative w-full md:w-80">
            <FiSearch className="absolute left-3 top-3 text-dark-400 text-sm" />
            <input
              type="text"
              placeholder="Search by ID, recipient, or account…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field text-xs pl-9 py-2"
            />
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field text-xs py-2"
            >
              <option value="">All Statuses</option>
              <option value="successful">Successful</option>
              <option value="processing">Processing</option>
              <option value="needs_review">Needs Review</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-field text-xs py-2"
            >
              <option value="">All Categories</option>
              <option value="seller">Seller</option>
              <option value="affiliate">Affiliate</option>
              <option value="customer_refund">Customer Refund</option>
              <option value="custom">Custom</option>
            </select>

            <button
              onClick={loadPayouts}
              className="btn-secondary text-xs px-3 py-2"
              title="Refresh table"
            >
              <FiRefreshCw className={loadingPayouts ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-dark-950/80 border-b border-gold-400/10 text-dark-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Date & ID</th>
                <th className="px-5 py-3.5">Recipient & Channel</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Amount (PKR)</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-400/5">
              {loadingPayouts ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-dark-400">
                    <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent animate-spin mx-auto mb-2" />
                    <span>Loading payouts…</span>
                  </td>
                </tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-dark-400">
                    No payout records found. Click <strong>"Initiate Payout"</strong> to create one.
                  </td>
                </tr>
              ) : (
                payouts.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedPayoutId(p.id)}
                    className="hover:bg-dark-700/30 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5 font-mono">
                      <div className="text-ivory font-semibold text-xs">{p.customer_transaction_id}</div>
                      <div className="text-[11px] text-dark-400">{new Date(p.created_at).toLocaleString()}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-ivory font-medium">{p.account_title || p.recipient_name}</div>
                      <div className="text-dark-400 text-[11px]">
                        {p.bank_name} (****{p.account_number_last4})
                      </div>
                    </td>
                    <td className="px-5 py-3.5 capitalize text-dark-300">
                      {p.recipient_type}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-gold-400 text-sm">
                      PKR {Number(p.amount).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      {getStatusBadge(p.internal_status)}
                    </td>
                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedPayoutId(p.id)}
                          className="p-1.5 rounded hover:bg-gold-400/10 text-gold-400 transition-colors"
                          title="View Audit Detail"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        {['processing', 'needs_review'].includes(p.internal_status) && (
                          <button
                            onClick={(e) => handleQuickInquire(p.id, e)}
                            className="p-1.5 rounded hover:bg-blue-400/10 text-blue-400 transition-colors"
                            title="Inquire Status with Swich"
                          >
                            <FiRefreshCw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CreatePayoutModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          loadPayouts()
          loadBalance()
        }}
      />

      <PayoutDetailModal
        payoutId={selectedPayoutId}
        isOpen={Boolean(selectedPayoutId)}
        onClose={() => setSelectedPayoutId(null)}
        onUpdated={() => {
          loadPayouts()
          loadBalance()
        }}
      />
    </div>
  )
}
