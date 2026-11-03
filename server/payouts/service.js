import crypto from 'node:crypto'
import { getPayoutConfig } from './config.js'
import { getBankByCode } from './banks.js'
import { fetchAccountTitle, normalisePayoutMsisdn } from './swich/title.js'
import { executeIbftTransfer, normaliseCnic } from './swich/ibft.js'
import { inquirePayoutTransaction } from './swich/inquire.js'
import { fetchPayoutBalance } from './swich/balance.js'
import {
  INTERNAL_STATUSES,
  mapProviderStatus,
  isValidTransition,
} from './status.js'
import { getProviderCodeInfo } from './codes.js'
import {
  encryptSensitive,
  maskCnic,
  maskMsisdn,
  extractAccountLast4,
  redactSensitiveData,
} from './crypto.js'
import { logger } from './logger.js'

/**
 * Generates a signed verification token for fetched account titles
 */
function createTitleVerificationRef(secret, data) {
  const payload = `${data.bankCode}:${data.accountNumber}:${data.msisdn}:${data.amount}:${data.accountTitle}`
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  const timestamp = Date.now()
  return Buffer.from(JSON.stringify({ payload, signature, timestamp })).toString('base64url')
}

/**
 * Verifies a title verification token against submitted payout data
 */
function verifyTitleVerificationRef(secret, ref, expected) {
  try {
    if (!ref) return false
    const decoded = JSON.parse(Buffer.from(ref, 'base64url').toString('utf8'))
    const { payload, signature, timestamp } = decoded

    // Expire verification after 30 minutes
    if (Date.now() - timestamp > 30 * 60 * 1000) {
      return false
    }

    const expectedPayload = `${expected.bankCode}:${expected.accountNumber}:${expected.msisdn}:${expected.amount}:${expected.accountTitle}`
    if (payload !== expectedPayload) return false

    const expectedSig = crypto.createHmac('sha256', secret).update(expectedPayload).digest('hex')
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
  } catch {
    return false
  }
}

/**
 * Payout Domain Service
 */
export function createPayoutService(repository, customConfig = null) {
  const getConfig = () => customConfig || getPayoutConfig()

  return {
    /**
     * 1. Validate Recipient / Fetch Account Title
     */
    async validateRecipient({
      bankCode,
      bankName,
      msisdn,
      amount,
      accountNumber,
      countryCode = '92',
      adminUser,
    }) {
      const config = getConfig()

      // Validate bank code
      const bankInfo = getBankByCode(bankCode)
      const resolvedBankName = bankName || bankInfo?.name
      if (!resolvedBankName) {
        const err = new Error('Invalid or unsupported bank code')
        err.status = 400
        throw err
      }

      const cleanPhone = normalisePayoutMsisdn(msisdn)
      if (!cleanPhone) {
        const err = new Error('Valid Pakistani mobile number (03xxxxxxxxx) is required')
        err.status = 400
        throw err
      }

      const numAmount = Number(amount)
      if (!numAmount || numAmount <= 0) {
        const err = new Error('Amount must be greater than zero')
        err.status = 400
        throw err
      }

      const cleanAccount = String(accountNumber).trim()
      const startedAt = new Date().toISOString()

      // Call Swich Fetch Title API
      const titleRes = await fetchAccountTitle(config, {
        bankCode,
        bankName: resolvedBankName,
        msisdn: cleanPhone,
        amount: numAmount,
        accountNumber: cleanAccount,
        countryCode,
      })

      // Record audit attempt
      await repository.recordProviderAttempt({
        payoutId: null,
        operation: 'fetch_title',
        requestMetadata: { bankCode, bankName: resolvedBankName, msisdn: cleanPhone, amount: numAmount, accountNumber: cleanAccount },
        responseMetadata: titleRes.raw,
        httpStatus: titleRes.success ? 200 : 400,
        providerCode: titleRes.code,
        outcome: titleRes.success ? 'success' : 'failure',
        errorCategory: titleRes.success ? null : 'title_verification_failed',
        startedAt,
      })

      if (!titleRes.success || !titleRes.accountTitle) {
        const codeInfo = getProviderCodeInfo(titleRes.code)
        const err = new Error(titleRes.message || codeInfo.adminMessage || 'Could not verify recipient account title')
        err.status = 400
        err.code = titleRes.code || 'TITLE_VERIFICATION_FAILED'
        err.providerDetails = titleRes
        throw err
      }

      // Generate verification token bound to these exact parameters
      const verificationRef = createTitleVerificationRef(config.clientSecret, {
        bankCode,
        accountNumber: cleanAccount,
        msisdn: cleanPhone,
        amount: numAmount,
        accountTitle: titleRes.accountTitle,
      })

      return {
        verified: true,
        accountTitle: titleRes.accountTitle,
        bankCode,
        bankName: resolvedBankName,
        accountNumberMasked: extractAccountLast4(cleanAccount),
        amount: numAmount,
        verificationRef,
        message: 'Account title verified successfully',
      }
    },

    /**
     * 2. Create and Submit Payout (IBFT)
     */
    async createAndSubmitPayout({
      recipientType = 'custom',
      recipientReferenceId = null,
      recipientName,
      cnic,
      msisdn,
      bankCode,
      bankName,
      accountNumber,
      amount,
      accountTitle,
      titleVerificationReference,
      reason,
      adminNote,
      idempotencyKey,
      adminUser,
    }) {
      const config = getConfig()

      // 1. Check feature toggle
      if (!config.enabled) {
        const err = new Error('Swich PayOut module is currently disabled by store configuration')
        err.status = 503
        err.code = 'payouts_disabled'
        throw err
      }

      // 2. Validate idempotency key
      if (!idempotencyKey) {
        const err = new Error('Idempotency-Key is required for payout submission')
        err.status = 400
        throw err
      }

      const existingPayout = await repository.findByIdempotencyKey(idempotencyKey)
      if (existingPayout) {
        logger.info('Idempotent payout replay detected', {
          idempotencyKey,
          payoutId: existingPayout.id,
          status: existingPayout.internal_status,
        })
        return {
          ...redactSensitiveData(existingPayout),
          isReplay: true,
        }
      }

      // 3. Validate bank and recipient details
      const bankInfo = getBankByCode(bankCode)
      const resolvedBankName = bankName || bankInfo?.name
      if (!resolvedBankName) {
        const err = new Error('Invalid or unsupported bank code')
        err.status = 400
        throw err
      }

      const cleanCnic = normaliseCnic(cnic)
      if (!cleanCnic) {
        const err = new Error('CNIC must be exactly 13 digits without dashes or spaces')
        err.status = 400
        throw err
      }

      const cleanPhone = normalisePayoutMsisdn(msisdn)
      if (!cleanPhone) {
        const err = new Error('Valid Pakistani mobile number (03xxxxxxxxx) is required')
        err.status = 400
        throw err
      }

      const cleanAccount = String(accountNumber).trim()
      const numAmount = Number(amount)

      if (numAmount < config.minAmount || numAmount > config.maxAmount) {
        const err = new Error(`Payout amount PKR ${numAmount} is outside allowed range [${config.minAmount}, ${config.maxAmount}]`)
        err.status = 422
        err.code = 'amount_out_of_range'
        throw err
      }

      // 4. Verify title verification reference (must match exact account, bank, phone, amount, title)
      const isRefValid = verifyTitleVerificationRef(config.clientSecret, titleVerificationReference, {
        bankCode,
        accountNumber: cleanAccount,
        msisdn: cleanPhone,
        amount: numAmount,
        accountTitle: String(accountTitle).trim(),
      })

      if (!isRefValid) {
        const err = new Error('Title verification reference is invalid or has expired. Please verify account title again.')
        err.status = 400
        err.code = 'invalid_title_verification'
        throw err
      }

      // 5. Generate globally unique customerTransactionId
      const ts = Date.now()
      const rand = crypto.randomBytes(4).toString('hex')
      const customerTransactionId = `PO_${ts}_${rand}`

      // 6. Encrypt sensitive fields and create payout row with internal_status 'ready_to_submit'
      const payoutRow = {
        customer_transaction_id: customerTransactionId,
        idempotency_key: idempotencyKey,
        recipient_type: recipientType,
        recipient_reference_id: recipientReferenceId,
        recipient_name: recipientName || accountTitle,
        recipient_cnic_masked: maskCnic(cleanCnic),
        recipient_cnic_encrypted: encryptSensitive(cleanCnic),
        recipient_msisdn_masked: maskMsisdn(cleanPhone),
        recipient_msisdn_encrypted: encryptSensitive(cleanPhone),
        bank_code: bankCode,
        bank_name: resolvedBankName,
        account_number_last4: extractAccountLast4(cleanAccount),
        account_number_encrypted: encryptSensitive(cleanAccount),
        account_title: accountTitle,
        title_verification_ref: titleVerificationReference,
        amount: numAmount,
        currency: 'PKR',
        country_code: '92',
        internal_status: INTERNAL_STATUSES.READY_TO_SUBMIT,
        requested_by: adminUser?.email || adminUser?.id || 'admin',
        reason: reason || null,
        admin_note: adminNote || null,
      }

      const createdPayout = await repository.createPayout(payoutRow)

      await repository.recordStatusEvent({
        payoutId: createdPayout.id,
        previousStatus: null,
        newStatus: INTERNAL_STATUSES.READY_TO_SUBMIT,
        message: 'Payout created and queued for IBFT submission',
        source: 'admin_submit',
        actorUserId: adminUser?.email || adminUser?.id,
      })

      // 7. Transition to 'processing' before external network request
      await repository.updatePayout(createdPayout.id, {
        internal_status: INTERNAL_STATUSES.PROCESSING,
      })

      await repository.recordStatusEvent({
        payoutId: createdPayout.id,
        previousStatus: INTERNAL_STATUSES.READY_TO_SUBMIT,
        newStatus: INTERNAL_STATUSES.PROCESSING,
        message: 'Dispatching IBFT to Swich',
        source: 'ibft_dispatch',
        actorUserId: adminUser?.email || adminUser?.id,
      })

      // 8. Execute single-shot IBFT transfer
      const startedAt = new Date().toISOString()
      const ibftRes = await executeIbftTransfer(config, {
        accountTitle,
        accountNumber: cleanAccount,
        bankCode,
        bankName: resolvedBankName,
        customerTransactionId,
        name: recipientName || accountTitle,
        cnic: cleanCnic,
        msisdn: cleanPhone,
        amount: numAmount,
        currency: 'PKR',
        countryCode: '92',
      })

      // Record provider attempt audit
      await repository.recordProviderAttempt({
        payoutId: createdPayout.id,
        operation: 'ibft',
        requestMetadata: { customerTransactionId, bankCode, amount: numAmount },
        responseMetadata: ibftRes.raw,
        httpStatus: ibftRes.isTimeout ? 408 : ibftRes.success ? 200 : 400,
        providerCode: ibftRes.code,
        outcome: ibftRes.success ? 'success' : ibftRes.isTimeout ? 'unknown' : 'failure',
        errorCategory: ibftRes.isTimeout ? 'timeout' : ibftRes.success ? null : 'transfer_declined',
        startedAt,
      })

      // 9. Normalize provider response
      let finalInternalStatus = INTERNAL_STATUSES.PROCESSING
      let completedAt = null

      if (ibftRes.success) {
        finalInternalStatus = INTERNAL_STATUSES.SUCCESSFUL
        completedAt = new Date().toISOString()
      } else if (ibftRes.isTimeout) {
        // Critical rule: timeouts are unknown, must not retry, mark needs_review
        finalInternalStatus = INTERNAL_STATUSES.NEEDS_REVIEW
      } else {
        finalInternalStatus = INTERNAL_STATUSES.FAILED
        completedAt = new Date().toISOString()
      }

      const updatedPayout = await repository.updatePayout(createdPayout.id, {
        swich_transaction_id: ibftRes.transactionId ? String(ibftRes.transactionId) : null,
        internal_status: finalInternalStatus,
        provider_status: ibftRes.status,
        provider_code: ibftRes.code,
        provider_message: ibftRes.message,
        provider_response_json: redactSensitiveData(ibftRes.raw),
        completed_at: completedAt,
      })

      await repository.recordStatusEvent({
        payoutId: createdPayout.id,
        previousStatus: INTERNAL_STATUSES.PROCESSING,
        newStatus: finalInternalStatus,
        providerStatus: ibftRes.status,
        providerCode: ibftRes.code,
        message: ibftRes.message,
        source: 'ibft_response',
        actorUserId: adminUser?.email || adminUser?.id,
      })

      return {
        ...redactSensitiveData(updatedPayout),
        isReplay: false,
      }
    },

    /**
     * 3. Inquire Transaction Status
     */
    async inquirePayout({ id, adminUser }) {
      const config = getConfig()
      const payout = await repository.findById(id)

      if (!payout) {
        const err = new Error('Payout record not found')
        err.status = 404
        throw err
      }

      const startedAt = new Date().toISOString()
      const inqRes = await inquirePayoutTransaction(config, {
        customerTransactionId: payout.customer_transaction_id,
        transactionId: payout.swich_transaction_id,
        remoteIp: config.whitelistedIp,
      })

      await repository.recordProviderAttempt({
        payoutId: payout.id,
        operation: 'inquire',
        requestMetadata: { customerTransactionId: payout.customer_transaction_id, swichTxId: payout.swich_transaction_id },
        responseMetadata: inqRes.raw,
        httpStatus: inqRes.success ? 200 : 400,
        providerCode: inqRes.code,
        outcome: inqRes.success ? 'success' : 'failure',
        startedAt,
      })

      if (!inqRes.success) {
        return {
          payout: redactSensitiveData(payout),
          inquirySuccess: false,
          message: inqRes.message || 'Inquiry could not determine provider state',
        }
      }

      // Map provider status
      const mappedStatus = mapProviderStatus(inqRes.providerStatus)
      const currentStatus = payout.internal_status

      if (isValidTransition(currentStatus, mappedStatus)) {
        const isNowTerminal = mappedStatus === INTERNAL_STATUSES.SUCCESSFUL || mappedStatus === INTERNAL_STATUSES.FAILED
        const completedAt = isNowTerminal && !payout.completed_at ? new Date().toISOString() : payout.completed_at

        const updated = await repository.updatePayout(payout.id, {
          internal_status: mappedStatus,
          provider_status: inqRes.providerStatus,
          provider_code: inqRes.code,
          provider_message: inqRes.message,
          swich_transaction_id: inqRes.transactionId ? String(inqRes.transactionId) : payout.swich_transaction_id,
          completed_at: completedAt,
        })

        if (mappedStatus !== currentStatus) {
          await repository.recordStatusEvent({
            payoutId: payout.id,
            previousStatus: currentStatus,
            newStatus: mappedStatus,
            providerStatus: inqRes.providerStatus,
            providerCode: inqRes.code,
            message: inqRes.message,
            source: 'inquiry',
            actorUserId: adminUser?.email || adminUser?.id,
          })
        }

        return {
          payout: redactSensitiveData(updated),
          inquirySuccess: true,
          statusChanged: mappedStatus !== currentStatus,
          message: inqRes.message,
        }
      }

      return {
        payout: redactSensitiveData(payout),
        inquirySuccess: true,
        statusChanged: false,
        message: 'Inquiry confirmed existing status',
      }
    },

    /**
     * 4. Fetch Merchant Balance
     */
    async getBalance({ saveSnapshot = true } = {}) {
      const config = getConfig()
      const startedAt = new Date().toISOString()
      const balRes = await fetchPayoutBalance(config)

      if (balRes.success && saveSnapshot) {
        await repository.saveBalanceSnapshot({
          balance: balRes.balance,
          currency: balRes.currency,
          day_end_balance: balRes.dayEndBalance,
          total_commission: balRes.totalCommission,
          daily_commission: balRes.dailyCommission,
          provider_status: balRes.providerStatus,
        })
      }

      await repository.recordProviderAttempt({
        payoutId: null,
        operation: 'balance',
        requestMetadata: {},
        responseMetadata: balRes.raw,
        httpStatus: balRes.success ? 200 : 500,
        outcome: balRes.success ? 'success' : 'failure',
        startedAt,
      })

      return balRes
    },

    /**
     * 5. Get Balance History
     */
    async getBalanceHistory(limit = 20) {
      return repository.getBalanceHistory(limit)
    },

    /**
     * 6. List Payouts
     */
    async listPayouts(params) {
      return repository.listPayouts(params)
    },

    /**
     * 7. Get Payout Detail with Audit Log
     */
    async getPayoutDetail(id) {
      const payout = await repository.findById(id)
      if (!payout) {
        const err = new Error('Payout not found')
        err.status = 404
        throw err
      }

      const events = await repository.getStatusEvents(id)
      const attempts = await repository.getProviderAttempts(id)

      return {
        payout: redactSensitiveData(payout),
        events,
        attempts: redactSensitiveData(attempts),
      }
    },

    /**
     * 8. Cancel Payout (Only permitted before IBFT submission)
     */
    async cancelPayout({ id, adminUser, reason }) {
      const payout = await repository.findById(id)
      if (!payout) {
        const err = new Error('Payout not found')
        err.status = 404
        throw err
      }

      if (payout.internal_status !== INTERNAL_STATUSES.READY_TO_SUBMIT) {
        const err = new Error(`Cannot cancel payout with status '${payout.internal_status}'. Only ready_to_submit payouts can be cancelled.`)
        err.status = 400
        throw err
      }

      const updated = await repository.updatePayout(id, {
        internal_status: INTERNAL_STATUSES.CANCELLED,
        provider_message: `Cancelled by admin: ${reason || 'No reason provided'}`,
      })

      await repository.recordStatusEvent({
        payoutId: id,
        previousStatus: INTERNAL_STATUSES.READY_TO_SUBMIT,
        newStatus: INTERNAL_STATUSES.CANCELLED,
        message: reason || 'Cancelled by admin',
        source: 'admin_cancel',
        actorUserId: adminUser?.email || adminUser?.id,
      })

      return redactSensitiveData(updated)
    },
  }
}
