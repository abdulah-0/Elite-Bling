import { supabase } from '../../supabase/client'

/**
 * Authenticated API client for Admin Payout endpoints
 */
async function getAuthHeaders(extraHeaders = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token || ''

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...extraHeaders,
  }
}

export async function fetchPayoutConfig() {
  const headers = await getAuthHeaders()
  const res = await fetch('/api/admin/payouts/config', { headers })
  if (!res.ok) throw new Error('Failed to load payout configuration')
  return res.json()
}

export async function fetchSupportedBanks() {
  const headers = await getAuthHeaders()
  const res = await fetch('/api/admin/payouts/banks', { headers })
  if (!res.ok) throw new Error('Failed to load supported banks')
  return res.json()
}

export async function fetchPayoutBalance() {
  const headers = await getAuthHeaders()
  const res = await fetch('/api/admin/payouts/balance', { headers })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Failed to fetch balance')
  }
  return res.json()
}

export async function validateRecipientTitle({
  bankCode,
  bankName,
  msisdn,
  amount,
  accountNumber,
}) {
  const headers = await getAuthHeaders()
  const res = await fetch('/api/admin/payouts/validate-recipient', {
    method: 'POST',
    headers,
    body: JSON.stringify({ bankCode, bankName, msisdn, amount, accountNumber }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || 'Failed to verify account title')
  }
  return data
}

export async function submitPayout(payoutPayload) {
  const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  const headers = await getAuthHeaders({ 'Idempotency-Key': idempotencyKey })

  const res = await fetch('/api/admin/payouts', {
    method: 'POST',
    headers,
    body: JSON.stringify(payoutPayload),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || 'Payout initiation failed')
  }
  return data
}

export async function fetchPayoutsList(params = {}) {
  const headers = await getAuthHeaders()
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  if (params.recipientType) query.set('recipientType', params.recipientType)
  if (params.search) query.set('search', params.search)
  if (params.page) query.set('page', params.page)

  const res = await fetch(`/api/admin/payouts?${query.toString()}`, { headers })
  if (!res.ok) throw new Error('Failed to fetch payouts')
  return res.json()
}

export async function fetchPayoutDetail(id) {
  const headers = await getAuthHeaders()
  const res = await fetch(`/api/admin/payouts/${id}`, { headers })
  if (!res.ok) throw new Error('Failed to fetch payout detail')
  return res.json()
}

export async function inquirePayoutStatus(id) {
  const headers = await getAuthHeaders()
  const res = await fetch(`/api/admin/payouts/${id}/inquire`, {
    method: 'POST',
    headers,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Inquiry failed')
  return data
}
