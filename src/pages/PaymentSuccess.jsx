import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { FiCheckCircle } from 'react-icons/fi'
import { format } from 'date-fns'

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams()
    const orderId = searchParams.get('order_id')
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const updateOrder = async () => {
            if (!orderId) {
                setLoading(false)
                return
            }
            try {
                await fetch(`/api/order/${orderId}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'paid' }),
                })
                const res = await fetch(`/api/order/${orderId}`)
                const data = await res.json()
                setOrder(data)
            } catch (err) {
                console.error('Error fetching order:', err)
            } finally {
                setLoading(false)
            }
        }
        updateOrder()
    }, [orderId])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-2 border-gold-400 border-t-transparent animate-spin" />
            </div>
        )
    }

    return (
        <div className="py-16 md:py-20">
            <div className="container-custom max-w-3xl">
                <div className="card p-8 md:p-12 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                        <FiCheckCircle className="text-4xl text-green-500" />
                    </div>

                    <h1 className="text-3xl md:text-4xl font-heading font-bold text-ivory mb-4">
                        Payment Successful!
                    </h1>
                    <p className="text-lg text-dark-300 mb-10">
                        Thank you for your purchase. Your payment has been confirmed.
                    </p>

                    {order && (
                        <div className="border border-gold-400/10 bg-dark-800/50 p-6 mb-8 text-left">
                            <h2 className="text-xl font-heading font-bold text-ivory mb-6">Order Details</h2>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-dark-400">Order ID:</span>
                                    <span className="font-semibold text-ivory">{order.id}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-dark-400">Date:</span>
                                    <span className="font-semibold text-ivory">
                                        {format(new Date(order.created_at), 'PPP')}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-dark-400">Status:</span>
                                    <span className="text-green-500 font-semibold capitalize border border-green-500/30 px-3 py-1 text-sm">
                                        {order.status}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-dark-400">Payment:</span>
                                    <span className="font-semibold text-ivory">Paid via Card</span>
                                </div>
                                <div className="flex justify-between text-xl font-bold border-t border-gold-400/10 pt-4">
                                    <span className="text-ivory">Total:</span>
                                    <span className="text-gold-400">Rs. {order.total_price.toLocaleString()}</span>
                                </div>
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
