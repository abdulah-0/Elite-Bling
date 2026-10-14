import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import { createSwichRouter, createOrderRouter, createCronRouter } from './routes/swich.js'

const app = express()
app.use(cors())
app.use(express.json())

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Swich PayIn routes
app.use('/api/payments/swich', createSwichRouter(supabase))
app.use('/api/orders', createOrderRouter(supabase))
app.use('/api/cron', createCronRouter(supabase))

// Rapid Gateway OAuth token
async function getAccessToken() {
  const creds = Buffer
    .from(`${process.env.RG_MERCHANT_ID}:${process.env.RG_CLIENT_SECRET}`)
    .toString('base64')

  const res = await fetch('https://secure.rapid-gateway.com/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  const data = await res.json()
  return data.access_token
}

// POST /api/create-payment — initiates Rapid Gateway transaction
app.post('/api/create-payment', async (req, res) => {
  try {
    const { amount, phone, email, orderId } = req.body

    const accessToken = await getAccessToken()

    const body = new URLSearchParams({
      MERCHANT_ID:            process.env.RG_MERCHANT_ID,
      MERCHANT_NAME:          'Ellite Bling',
      TXNAMT:                 String(amount),
      CURRENCY_CODE:          'PKR',
      CUSTOMER_MOBILE_NO:     phone,
      CUSTOMER_EMAIL_ADDRESS: email,
      BASKET_ID:              orderId,
      SUCCESS_URL:            `${process.env.BASE_URL}/payment/success?order_id=${orderId}`,
      FAILURE_URL:            `${process.env.BASE_URL}/payment/failure?order_id=${orderId}`,
      CHECKOUT_URL:           `${process.env.BASE_URL}/payment/complete?order_id=${orderId}`,
      VERSION:                'MY_VER_1.0',
      PROCCODE:               '0',
    })

    const payRes = await fetch(
      'https://secure.rapid-gateway.com/rapid/process-transaction',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
        redirect: 'manual',
      }
    )

    const redirectUrl = payRes.headers.get('location')
    res.json({ redirectUrl })
  } catch (err) {
    console.error('Rapid Gateway error:', err)
    res.status(500).json({ error: 'Payment initiation failed' })
  }
})

// POST /api/create-order — creates order in Supabase (used for card payments)
app.post('/api/create-order', async (req, res) => {
  try {
    const { user_id, cart, total_price, shipping_info } = req.body

    const { data, error } = await supabase
      .from('orders')
      .insert([{
        user_id: user_id || null,
        order_items: cart,
        total_price,
        status: 'pending',
        shipping_info,
      }])
      .select()

    if (error) throw error
    res.json({ order: data[0] })
  } catch (err) {
    console.error('Create order error:', err)
    res.status(500).json({ error: 'Failed to create order' })
  }
})

// GET /api/order/:id — fetch order status (used by callback pages)
app.get('/api/order/:id', async (req, res) => {
  const { id } = req.params
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return res.status(404).json({ error: 'Order not found' })
  res.json(data)
})

// PATCH /api/order/:id/status — update order status
app.patch('/api/order/:id/status', async (req, res) => {
  const { id } = req.params
  const { status } = req.body

  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select()

  if (error) return res.status(500).json({ error: 'Failed to update order' })
  res.json(data[0])
})

const PORT = process.env.PORT || 3001
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Ellite Bling server running on port ${PORT}`)
  })
}

export default app
