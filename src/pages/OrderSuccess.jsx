import { useLocation, useSearchParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { FiCheckCircle, FiPackage, FiMail, FiClock, FiShoppingBag } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa6'
import { format } from 'date-fns'
import SEO from '../components/SEO'
import { supabase } from '../supabase/client'

const OrderSuccess = () => {
    const location = useLocation()
    const [searchParams] = useSearchParams()
    const queryId = searchParams.get('id')

    const [order, setOrder] = useState(location.state?.order || null)
    const [loading, setLoading] = useState(!location.state?.order && Boolean(queryId))

    useEffect(() => {
        if (!order && queryId) {
            const fetchOrder = async () => {
                try {
                    const { data, error } = await supabase
                        .from('orders')
                        .select('*')
                        .eq('id', queryId)
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
            fetchOrder()
        }
    }, [order, queryId])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-12 h-12 border-2 border-gold-400 border-t-transparent animate-spin" />
                <p className="text-dark-300 text-sm">Loading order details...</p>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="container-custom py-20 text-center animate-fade-in max-w-xl mx-auto">
                <SEO
                    title="Order Confirmation - Ellite Bling"
                    description="Order confirmation status at Ellite Bling."
                    canonical="https://ellitebling.com/order-success"
                />
                <div className="card p-8 md:p-12">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold-400/10 border border-gold-400/30 flex items-center justify-center">
                        <FiPackage className="text-3xl text-gold-400" />
                    </div>
                    <h2 className="text-3xl font-heading font-bold text-ivory mb-3">No Recent Order Found</h2>
                    <p className="text-dark-300 text-sm leading-relaxed mb-6">
                        If you recently placed an order, please check your WhatsApp or SMS for confirmation. Our team will verify your details shortly.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link to="/products" className="btn-primary flex items-center justify-center gap-2">
                            <FiShoppingBag /> Browse Collection
                        </Link>
                        <a
                            href="https://wa.me/923290987690?text=Hello%2C%20I%20would%20like%20to%20inquire%20about%20my%20order."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary flex items-center justify-center gap-2"
                        >
                            <FaWhatsapp /> Track on WhatsApp
                        </a>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="py-16 md:py-20 animate-fade-in">
            <SEO
                title="Order Placed Successfully - Ellite Bling"
                description="Thank you for your order at Ellite Bling."
                canonical="https://ellitebling.com/order-success"
            />
            <div className="container-custom max-w-3xl">
                <div className="card p-8 md:p-12 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                        <FiCheckCircle className="text-4xl text-green-500" />
                    </div>

                    <h1 className="text-3xl md:text-4xl font-heading font-bold text-ivory mb-4">
                        Order Placed Successfully!
                    </h1>
                    <p className="text-lg text-dark-300 mb-10">
                        Thank you for your purchase. Your order has been received and is being prepared.
                    </p>

                    <div className="border border-gold-400/10 bg-dark-800/50 p-6 mb-8 text-left">
                        <h2 className="text-xl font-heading font-bold text-ivory mb-6">Order Details</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-dark-400">Order ID:</span>
                                <span className="font-semibold text-ivory">{order.id}</span>
                            </div>
                            {order.created_at && (
                                <div className="flex justify-between">
                                    <span className="text-dark-400">Order Date:</span>
                                    <span className="font-semibold text-ivory">
                                        {format(new Date(order.created_at), 'PPP')}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-dark-400">Status:</span>
                                <span className="text-gold-400 font-semibold capitalize border border-gold-400/30 px-3 py-1 text-sm">
                                    {order.status}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-dark-400">Payment:</span>
                                <span className="font-semibold text-ivory">
                                    {order.status === 'paid' ? 'Paid via Card' : 'Cash on Delivery'}
                                </span>
                            </div>
                            {order.total_price && (
                                <div className="flex justify-between text-xl font-bold border-t border-gold-400/10 pt-4">
                                    <span className="text-ivory">Total:</span>
                                    <span className="text-gold-400">Rs. {order.total_price.toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* What's Next */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                        <div className="border border-gold-400/10 p-4 text-center">
                            <FiMail className="text-2xl text-gold-400 mx-auto mb-2" />
                            <p className="text-sm text-dark-300">Confirmation WhatsApp / SMS</p>
                        </div>
                        <div className="border border-gold-400/10 p-4 text-center">
                            <FiPackage className="text-2xl text-gold-400 mx-auto mb-2" />
                            <p className="text-sm text-dark-300">Inspecting &amp; Packing Jewelry</p>
                        </div>
                        <div className="border border-gold-400/10 p-4 text-center">
                            <FiClock className="text-2xl text-gold-400 mx-auto mb-2" />
                            <p className="text-sm text-dark-300">Delivery: 3-5 business days</p>
                        </div>
                    </div>

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

export default OrderSuccess
