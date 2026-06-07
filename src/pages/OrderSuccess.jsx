import { useLocation, Link } from 'react-router-dom'
import { FiCheckCircle, FiPackage, FiMail, FiClock } from 'react-icons/fi'
import { format } from 'date-fns'

const OrderSuccess = () => {
    const location = useLocation()
    const order = location.state?.order

    if (!order) {
        return (
            <div className="container-custom py-20 text-center">
                <h2 className="text-3xl font-heading font-bold text-ivory mb-4">Order not found</h2>
                <Link to="/" className="btn-primary">
                    Return to Home
                </Link>
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
                        Order Placed Successfully!
                    </h1>
                    <p className="text-lg text-dark-300 mb-10">
                        Thank you for your purchase. Your order has been received and is being processed.
                    </p>

                    <div className="border border-gold-400/10 bg-dark-800/50 p-6 mb-8 text-left">
                        <h2 className="text-xl font-heading font-bold text-ivory mb-6">Order Details</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-dark-400">Order ID:</span>
                                <span className="font-semibold text-ivory">{order.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-dark-400">Order Date:</span>
                                <span className="font-semibold text-ivory">
                                    {format(new Date(order.created_at), 'PPP')}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-dark-400">Status:</span>
                                <span className="text-gold-400 font-semibold capitalize border border-gold-400/30 px-3 py-1 text-sm">
                                    {order.status}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-dark-400">Payment Method:</span>
                                <span className="font-semibold text-ivory">Cash on Delivery</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold border-t border-gold-400/10 pt-4">
                                <span className="text-ivory">Total:</span>
                                <span className="text-gold-400">Rs. {order.total_price.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* What's Next */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                        <div className="border border-gold-400/10 p-4 text-center">
                            <FiMail className="text-2xl text-gold-400 mx-auto mb-2" />
                            <p className="text-sm text-dark-300">Confirmation email sent</p>
                        </div>
                        <div className="border border-gold-400/10 p-4 text-center">
                            <FiPackage className="text-2xl text-gold-400 mx-auto mb-2" />
                            <p className="text-sm text-dark-300">Preparing your order</p>
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
