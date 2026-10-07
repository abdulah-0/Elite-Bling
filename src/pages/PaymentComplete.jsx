import { useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { FiCheckCircle, FiShoppingBag, FiArrowRight } from 'react-icons/fi'
import SEO from '../components/SEO'

const PaymentComplete = () => {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const orderId = searchParams.get('order_id')

    useEffect(() => {
        if (orderId) {
            // Clear cart from local storage
            localStorage.removeItem('cart')
            // Navigate to order success with order id
            navigate(`/order-success?id=${orderId}`, { replace: true })
        }
    }, [orderId, navigate])

    // If order_id is present, show spinner during redirect
    if (orderId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-12 h-12 border-2 border-gold-400 border-t-transparent animate-spin" />
                <p className="text-dark-300 text-sm">Processing transaction confirmation...</p>
            </div>
        )
    }

    // Direct visit without order_id (e.g. testing or checking callback endpoint)
    return (
        <div className="py-16 md:py-24 animate-fade-in">
            <SEO
                title="Payment Complete Callback"
                description="Rapid Gateway payment completion endpoint for Ellite Bling."
                canonical="https://ellitebling.com/payment/complete"
            />
            <div className="container-custom max-w-2xl">
                <div className="card p-8 md:p-12 text-center border border-gold-400/20 bg-dark-800/90">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold-400/10 border border-gold-400/30 flex items-center justify-center">
                        <FiCheckCircle className="text-3xl text-gold-400" />
                    </div>

                    <span className="inline-block px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-semibold tracking-wider uppercase mb-4">
                        Endpoint Active & Operational
                    </span>

                    <h1 className="text-3xl font-heading font-bold text-ivory mb-3">
                        Payment Callback <span className="gold-text">Endpoint</span>
                    </h1>

                    <p className="text-dark-300 text-base leading-relaxed mb-6">
                        This is the automated return endpoint for <strong>Rapid Gateway</strong>. When a customer completes checkout, Rapid Gateway redirects back to this URL to finalize the order.
                    </p>

                    <div className="p-4 bg-dark-900/60 border border-gold-400/10 text-xs text-dark-300 text-left space-y-1.5 mb-8 font-mono">
                        <div><strong>Endpoint:</strong> /payment/complete</div>
                        <div><strong>Expected Query:</strong> ?order_id=&lt;id&gt;</div>
                        <div><strong>Handler:</strong> Automatic cart clearance &amp; order fulfillment redirect</div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/products" className="btn-primary flex items-center justify-center gap-2">
                            <FiShoppingBag /> Browse Catalog
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

export default PaymentComplete
