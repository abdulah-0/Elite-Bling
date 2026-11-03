import { useState, useEffect } from 'react'
import {
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiSearch,
  FiArrowRight,
  FiShield,
  FiLock,
} from 'react-icons/fi'
import {
  fetchSupportedBanks,
  validateRecipientTitle,
  submitPayout,
} from './payoutApi'

export default function CreatePayoutModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1) // 1: Input & Title Fetch, 2: Review & Confirm
  const [banks, setBanks] = useState([])
  const [loadingBanks, setLoadingBanks] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Form Fields
  const [recipientType, setRecipientType] = useState('custom')
  const [recipientReferenceId, setRecipientReferenceId] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [cnic, setCnic] = useState('')
  const [msisdn, setMsisdn] = useState('')
  const [bankCode, setBankCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [adminNote, setAdminNote] = useState('')

  // Verification Result
  const [verifiedTitle, setVerifiedTitle] = useState('')
  const [titleVerificationRef, setTitleVerificationRef] = useState('')
  const [titleConfirmed, setTitleConfirmed] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setError('')
    setStep(1)
    setVerifiedTitle('')
    setTitleVerificationRef('')
    setTitleConfirmed(false)

    fetchSupportedBanks()
      .then((data) => {
        setBanks(data)
        if (data.length > 0 && !bankCode) {
          setBankCode(data[0].code)
        }
      })
      .catch((err) => setError('Could not load bank directory: ' + err.message))
      .finally(() => setLoadingBanks(false))
  }, [isOpen])

  if (!isOpen) return null

  const selectedBank = banks.find((b) => b.code === bankCode)

  // Step 1: Verify Account Title
  const handleVerifyTitle = async (e) => {
    e.preventDefault()
    setError('')
    setVerifying(true)

    try {
      const cleanCnic = cnic.replace(/\D/g, '')
      if (cleanCnic.length !== 13) {
        throw new Error('CNIC must be exactly 13 digits')
      }

      const numAmount = Number(amount)
      if (!numAmount || numAmount <= 0) {
        throw new Error('Please enter a valid payout amount')
      }

      const result = await validateRecipientTitle({
        bankCode,
        bankName: selectedBank?.name || '',
        msisdn,
        amount: numAmount,
        accountNumber: accountNumber.trim(),
      })

      setVerifiedTitle(result.accountTitle)
      setTitleVerificationRef(result.verificationRef)
      setStep(2)
    } catch (err) {
      setError(err.message || 'Failed to verify account title with Swich')
    } finally {
      setVerifying(false)
    }
  }

  // Step 2: Final Submission
  const handleSubmitPayout = async (e) => {
    e.preventDefault()
    if (!titleConfirmed) {
      setError('Please review and confirm that the fetched account title matches the recipient.')
      return
    }

    setError('')
    setSubmitting(true)

    try {
      const result = await submitPayout({
        recipientType,
        recipientReferenceId: recipientReferenceId || null,
        recipientName: recipientName || verifiedTitle,
        cnic,
        msisdn,
        bankCode,
        bankName: selectedBank?.name || '',
        accountNumber,
        amount: Number(amount),
        accountTitle: verifiedTitle,
        titleVerificationReference: titleVerificationRef,
        reason,
        adminNote,
      })

      onSuccess(result)
      onClose()
    } catch (err) {
      setError(err.message || 'Payout submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-900 border border-gold-400/30 max-w-2xl w-full max-h-[92vh] overflow-y-auto rounded-xl shadow-2xl">
        {/* Modal Header */}
        <div className="sticky top-0 bg-dark-900 border-b border-gold-400/10 px-6 py-4 flex justify-between items-center z-10">
          <div>
            <h2 className="text-xl md:text-2xl font-heading font-bold text-ivory flex items-center gap-2">
              <FiShield className="text-gold-400" />
              <span>Initiate Swich PayOut (IBFT)</span>
            </h2>
            <p className="text-xs text-dark-400 mt-0.5">
              Outgoing disbursement to Pakistani bank account or e-wallet
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center border border-gold-400/20 text-ivory hover:bg-gold-400/10 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="bg-dark-950/60 px-6 py-3 border-b border-gold-400/10 flex items-center justify-between text-xs">
          <div className={`flex items-center gap-2 font-medium ${step === 1 ? 'text-gold-400 font-bold' : 'text-dark-400'}`}>
            <span className="w-5 h-5 rounded-full flex items-center justify-center border border-current text-[11px]">1</span>
            <span>Recipient & Fetch Title</span>
          </div>
          <FiArrowRight className="text-dark-600" />
          <div className={`flex items-center gap-2 font-medium ${step === 2 ? 'text-gold-400 font-bold' : 'text-dark-400'}`}>
            <span className="w-5 h-5 rounded-full flex items-center justify-center border border-current text-[11px]">2</span>
            <span>Review & Confirm Disbursement</span>
          </div>
        </div>

        {error && (
          <div className="m-6 p-4 rounded-lg bg-rosegold/10 border border-rosegold/30 text-rosegold text-sm flex items-start gap-3">
            <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* STEP 1: Form & Account Title Verification */}
        {step === 1 && (
          <form onSubmit={handleVerifyTitle} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-dark-300 font-medium mb-1.5">
                  Recipient Category *
                </label>
                <select
                  value={recipientType}
                  onChange={(e) => setRecipientType(e.target.value)}
                  className="input-field text-sm"
                  required
                >
                  <option value="custom">Custom / General Disbursement</option>
                  <option value="seller">Seller / Supplier Withdrawal</option>
                  <option value="affiliate">Affiliate Commission</option>
                  <option value="customer_refund">Customer Refund</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-dark-300 font-medium mb-1.5">
                  Reference ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ORDER-1234 or VENDOR-55"
                  value={recipientReferenceId}
                  onChange={(e) => setRecipientReferenceId(e.target.value)}
                  className="input-field text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-dark-300 font-medium mb-1.5">
                  Recipient Full Name *
                </label>
                <input
                  type="text"
                  placeholder="Recipient Name"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="input-field text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-dark-300 font-medium mb-1.5">
                  Recipient CNIC (13 Digits) *
                </label>
                <input
                  type="text"
                  placeholder="3520112345671"
                  maxLength={15}
                  value={cnic}
                  onChange={(e) => setCnic(e.target.value)}
                  className="input-field text-sm font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-dark-300 font-medium mb-1.5">
                  Bank / E-Wallet Channel *
                </label>
                <select
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="input-field text-sm"
                  disabled={loadingBanks}
                  required
                >
                  {banks.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.shortName} ({b.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-dark-300 font-medium mb-1.5">
                  Mobile Number (03xxxxxxxxx) *
                </label>
                <input
                  type="text"
                  placeholder="03001234567"
                  value={msisdn}
                  onChange={(e) => setMsisdn(e.target.value)}
                  className="input-field text-sm font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-dark-300 font-medium mb-1.5">
                  Account Number / IBAN *
                </label>
                <input
                  type="text"
                  placeholder="Bank Account Number or IBAN"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="input-field text-sm font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-dark-300 font-medium mb-1.5">
                  Amount in PKR *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="10"
                  placeholder="e.g. 5000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-field text-sm font-bold text-gold-400"
                  required
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={verifying}
                className="btn-primary w-full flex items-center justify-center space-x-2 py-3"
              >
                <FiSearch />
                <span>{verifying ? 'Verifying with 1Link / Swich…' : 'Fetch & Verify Account Title'}</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Review & Final Confirmation */}
        {step === 2 && (
          <form onSubmit={handleSubmitPayout} className="p-6 space-y-5">
            {/* Fetched Account Title Banner */}
            <div className="p-4 rounded-xl bg-gold-400/10 border border-gold-400/30">
              <div className="text-xs uppercase tracking-wider text-gold-400 font-semibold mb-1">
                ✓ 1Link Verified Account Title
              </div>
              <div className="text-xl md:text-2xl font-mono font-bold text-white tracking-wide">
                {verifiedTitle}
              </div>
              <p className="text-xs text-dark-400 mt-1">
                Fetched live from {selectedBank?.name} via Swich Fetch Title API.
              </p>
            </div>

            {/* Summary details */}
            <div className="bg-dark-950/70 p-4 rounded-xl border border-dark-800 space-y-2.5 text-sm">
              <div className="flex justify-between border-b border-dark-800 pb-2">
                <span className="text-dark-400">Recipient Bank:</span>
                <span className="text-ivory font-medium">{selectedBank?.name}</span>
              </div>
              <div className="flex justify-between border-b border-dark-800 pb-2">
                <span className="text-dark-400">Account Number:</span>
                <span className="font-mono text-ivory font-semibold">
                  {'*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between border-b border-dark-800 pb-2">
                <span className="text-dark-400">CNIC / Mobile:</span>
                <span className="font-mono text-ivory text-xs">
                  {cnic.slice(0, 5)}... / {msisdn.slice(0, 4)}...
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-dark-300 font-semibold">Total Payout Amount:</span>
                <span className="text-gold-400 font-bold text-lg font-mono">
                  PKR {Number(amount).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Business Reason & Admin Note */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs uppercase tracking-wider text-dark-300 font-medium mb-1">
                  Disbursement Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g. Approved vendor withdrawal for October"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-dark-300 font-medium mb-1">
                  Internal Admin Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Audit reference or notes"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="input-field text-sm"
                />
              </div>
            </div>

            {/* Checkbox confirmation */}
            <div className="p-3 bg-dark-800/40 border border-dark-700/60 rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={titleConfirmed}
                  onChange={(e) => setTitleConfirmed(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-gold-400 cursor-pointer"
                  required
                />
                <span className="text-xs text-dark-300">
                  I confirm that the fetched title <strong className="text-ivory">"{verifiedTitle}"</strong> matches the intended recipient and authorize this outgoing IBFT transfer.
                </span>
              </label>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-secondary flex-1 py-3"
                disabled={submitting}
              >
                Back to Edit
              </button>
              <button
                type="submit"
                disabled={submitting || !titleConfirmed}
                className="btn-primary flex-1 py-3 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <FiLock />
                <span>{submitting ? 'Submitting IBFT Transfer…' : 'Confirm & Disburse Payout'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
