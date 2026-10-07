import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { FiCheckCircle, FiShoppingBag, FiArrowRight } from 'react-icons/fi'
import { format } from 'date-fns'
import SEO from '../components/SEO'
import { supabase } from '../supabase/client'

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams()
    const orderId = searchParams.get('order_id')
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(Boolean(orderId))

    useEffect(() => {
        if (!orderId) {
            setLoading(false)
            return
        }

        const updateAndFetchOrder = async () => {
            try {
                // Try backend API first
                try {
                    await fetch(`/api/order/${orderId}/status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'paid' }),
                    })
                    const res = await fetch(`/api/order/${orderId}`)
                    if (res.ok) {
                        const data = await res.json()
                        setOrder(data)
                        return
                    }
                } catch (apiErr) {
                    // API not available, proceed to Supabase fallback
                }

                // Fallback to direct Supabase client
                const { data, error } = await supabase
                    .from('orders')
                    .update({ status: 'paid' })
                    .eq('id', orderId)
                    .select()
                    .single()

                if (!error && data) {
                    setOrder(data)
                }
            } catch (err) {
                console.error('Error fetching order:', err)
            } finally {
                setLoading(false)
            }
        }

        updateAndFetchOrder()
    }, [orderId])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-12 h-12 border-2 border-gold-400 border-t-transparent animate-spin" />
                <p className="text-dark-300 text-sm">Verifying payment with Rapid Gateway...</p>
            </div>
        )
    }

    // Direct access to endpoint without order_id parameter
    if (!orderId) {
        return (
            <div className="py-16 md:py-24 animate-fade-in">
                <SEO
                    title="Payment Success Callback"
                    description="Rapid Gateway payment success verification endpoint for Ellite Bling."
                    canonical="https://ellitebling.com/payment/success"
                />
                <div className="container-custom max-w-2xl">
                    <div className="card p-8 md:p-12 text-center border border-green-500/20 bg-dark-800/90">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                            <FiCheckCircle className="text-3xl text-green-400" />
                        </div>

                        <span className="inline-block px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-semibold tracking-wider uppercase mb-4">
                            Endpoint Active & Ready
                        </span>

                        <h1 className="text-3xl font-heading font-bold text-ivory mb-3">
                            Payment Success <span className="gold-text">Callback</span>
                        </h1>

                        <p className="text-dark-300 text-base leading-relaxed mb-6">
                            This is the callback endpoint invoked by <strong>Rapid Gateway</strong> upon successful payment confirmation.
                        </p>

                        <div className="p-4 bg-dark-900/60 border border-gold-400/10 text-xs text-dark-300 text-left space-y-1.5 mb-8 font-mono">
                            <div><strong>Endpoint:</strong> /payment/success</div>
                            <div><strong>Expected Parameter:</strong> ?order_id=&lt;id&gt;</div>
                            <div><strong>Action:</strong> Marks order as paid &amp; displays transaction receipt</div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/products" className="btn-primary flex items-center justify-center gap-2">
                                <FiShoppingBag /> Browse Jewelry
                            </Link>
                            <Link to="/" className="btn-secondary flex items-center justify-center gap-2">
                                Return Home <FiArrowRight />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="py-16 md:py-20 animate-fade-in">
            <SEO
                title="Payment Confirmed - Ellite Bling"
                description="Your order payment has been confirmed."
                canonical="https://ellitebling.com/payment/success"
            />
            <div className="container-custom max-w-3xl">
                <div className="card p-8 md:p-12 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                        <FiCheckCircle className="text-4xl text-green-500" />
                    </div>

                    <h1 className="text-3xl md:text-4xl font-heading font-bold text-ivory mb-4">
                        Payment Successful!
                    </h1>
                    <p className="text-lg text-dark-300 mb-10">
                        Thank you for your purchase. Your payment has been confirmed via Rapid Gateway.
                    </p>

                    {order && (
                        <div className="border border-gold-400/10 bg-dark-800/50 p-6 mb-8 text-left">
                            <h2 className="text-xl font-heading font-bold text-ivory mb-6">Order Details</h2>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-dark-400">Order ID:</span>
                                    <span className="font-semibold text-ivory">{order.id}</span>
                                </div>
                                {order.created_at && (
                                    <div className="flex justify-between">
                                        <span className="text-dark-400">Date:</span>
                                        <span className="font-semibold text-ivory">
                                            {format(new Date(order.created_at), 'PPP')}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-dark-400">Status:</span>
                                    <span className="text-green-500 font-semibold capitalize border border-green-500/30 px-3 py-1 text-sm">
                                        {order.status || 'Paid'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-dark-400">Payment:</span>
                                    <span className="font-semibold text-ivory">Paid via Rapid Gateway</span>
                                </div>
                                {order.total_price && (
                                    <div className="flex justify-between text-xl font-bold border-t border-gold-400/10 pt-4">
                                        <span className="text-ivory">Total:</span>
                                        <span className="text-gold-400">Rs. {order.total_price.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/" className="btn-primary">
                            Continue Shopping
                        </Link>
                        <Link to="/products" className="btn-secondary">
                            Browse More
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PaymentSuccess
