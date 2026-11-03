import { logger } from './logger.js'
import { redactSensitiveData } from './crypto.js'

/**
 * Payout Repository handling all Supabase interactions
 */
export function createPayoutRepository(supabase) {
  return {
    /**
     * Checks if a payout already exists for a given idempotency key
     */
    async findByIdempotencyKey(idempotencyKey) {
      const { data, error } = await supabase
        .from('payouts')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle()

      if (error) {
        logger.error('Error finding payout by idempotency key', { error: error.message })
      }
      return data || null
    },

    /**
     * Checks if a customer transaction ID exists
     */
    async findByCustomerTransactionId(customerTransactionId) {
      const { data, error } = await supabase
        .from('payouts')
        .select('*')
        .eq('customer_transaction_id', customerTransactionId)
        .maybeSingle()

      if (error) {
        logger.error('Error finding payout by customerTransactionId', { error: error.message })
      }
      return data || null
    },

    /**
     * Finds payout by internal UUID
     */
    async findById(id) {
      const { data, error } = await supabase
        .from('payouts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) return null
      return data
    },

    /**
     * Creates an initial payout record with status 'ready_to_submit'
     */
    async createPayout(payoutData) {
      const { data, error } = await supabase
        .from('payouts')
        .insert([payoutData])
        .select()
        .single()

      if (error) {
        logger.error('Failed to create payout record', { error: error.message })
        throw error
      }
      return data
    },

    /**
     * Updates payout fields
     */
    async updatePayout(id, updates) {
      const { data, error } = await supabase
        .from('payouts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        logger.error('Failed to update payout record', { id, error: error.message })
        throw error
      }
      return data
    },

    /**
     * Appends an immutable status transition event
     */
    async recordStatusEvent({
      payoutId,
      previousStatus,
      newStatus,
      providerStatus,
      providerCode,
      message,
      source,
      actorUserId,
    }) {
      const { error } = await supabase
        .from('payout_status_events')
        .insert([{
          payout_id: payoutId,
          previous_status: previousStatus,
          new_status: newStatus,
          provider_status: providerStatus,
          provider_code: providerCode,
          message,
          source,
          actor_user_id: actorUserId,
        }])

      if (error) {
        logger.error('Failed to record payout status event', { payoutId, error: error.message })
      }
    },

    /**
     * Records a provider HTTP call attempt for audit
     */
    async recordProviderAttempt({
      payoutId,
      operation,
      attemptNumber = 1,
      requestMetadata,
      responseMetadata,
      httpStatus,
      providerCode,
      outcome,
      errorCategory,
      startedAt,
      finishedAt = new Date().toISOString(),
    }) {
      const { error } = await supabase
        .from('payout_provider_attempts')
        .insert([{
          payout_id: payoutId,
          operation,
          attempt_number: attemptNumber,
          request_metadata_redacted: redactSensitiveData(requestMetadata),
          response_metadata_redacted: redactSensitiveData(responseMetadata),
          http_status: httpStatus,
          provider_code: providerCode,
          outcome,
          error_category: errorCategory,
          started_at: startedAt,
          finished_at: finishedAt,
        }])

      if (error) {
        logger.error('Failed to record payout provider attempt', { payoutId, error: error.message })
      }
    },

    /**
     * Saves a balance snapshot
     */
    async saveBalanceSnapshot(snapshot) {
      const { data, error } = await supabase
        .from('payout_balance_snapshots')
        .insert([snapshot])
        .select()
        .single()

      if (error) {
        logger.error('Failed to save balance snapshot', { error: error.message })
      }
      return data || null
    },

    /**
     * Fetches recent balance snapshots
     */
    async getBalanceHistory(limit = 20) {
      const { data, error } = await supabase
        .from('payout_balance_snapshots')
        .select('*')
        .order('fetched_at', { ascending: false })
        .limit(limit)

      if (error) return []
      return data || []
    },

    /**
     * Lists payouts with filtering, searching, and pagination
     */
    async listPayouts({
      status,
      recipientType,
      search,
      page = 1,
      limit = 20,
    }) {
      let query = supabase
        .from('payouts')
        .select('id, customer_transaction_id, swich_transaction_id, recipient_type, recipient_reference_id, recipient_name, recipient_cnic_masked, recipient_msisdn_masked, bank_code, bank_name, account_number_last4, account_title, amount, currency, internal_status, provider_status, provider_code, provider_message, requested_by, created_at, completed_at', { count: 'exact' })

      if (status) {
        query = query.eq('internal_status', status)
      }
      if (recipientType) {
        query = query.eq('recipient_type', recipientType)
      }
      if (search) {
        const clean = String(search).trim()
        query = query.or(`customer_transaction_id.ilike.%${clean}%,swich_transaction_id.ilike.%${clean}%,recipient_name.ilike.%${clean}%,account_number_last4.ilike.%${clean}%`)
      }

      const offset = (page - 1) * limit
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      const { data, count, error } = await query

      if (error) {
        logger.error('Failed to list payouts', { error: error.message })
        return { payouts: [], total: 0, page, limit }
      }

      return { payouts: data || [], total: count || 0, page, limit }
    },

    /**
     * Fetches complete status events for a payout
     */
    async getStatusEvents(payoutId) {
      const { data, error } = await supabase
        .from('payout_status_events')
        .select('*')
        .eq('payout_id', payoutId)
        .order('created_at', { ascending: true })

      if (error) return []
      return data || []
    },

    /**
     * Fetches provider attempts for a payout
     */
    async getProviderAttempts(payoutId) {
      const { data, error } = await supabase
        .from('payout_provider_attempts')
        .select('*')
        .eq('payout_id', payoutId)
        .order('started_at', { ascending: true })

      if (error) return []
      return data || []
    },
  }
}
