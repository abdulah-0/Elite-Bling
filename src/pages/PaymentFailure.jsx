import { useSearchParams, Link } from 'react-router-dom'
import { FiXCircle, FiRefreshCw, FiShoppingBag, FiArrowRight } from 'react-icons/fi'
import SEO from '../components/SEO'

const PaymentFailure = () => {
    const [searchParams] = useSearchParams()
    const orderId = searchParams.get('order_id')

    if (!orderId) {
        return (
            <div className="py-16 md:py-24 animate-fade-in">
                <SEO
                    title="Payment Failure Callback"
                    description="Rapid Gateway payment failure callback endpoint for Ellite Bling."
                    canonical="https://ellitebling.com/payment/failure"
                />
                <div className="container-custom max-w-2xl">
                    <div className="card p-8 md:p-12 text-center border border-rosegold/20 bg-dark-800/90">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-rosegold/10 border border-rosegold/30 flex items-center justify-center">
                            <FiXCircle className="text-3xl text-rosegold" />
                        </div>

                        <span className="inline-block px-3 py-1 bg-rosegold/10 text-rosegold border border-rosegold/20 text-xs font-semibold tracking-wider uppercase mb-4">
                            Endpoint Active & Ready
                        </span>

                        <h1 className="text-3xl font-heading font-bold text-ivory mb-3">
                            Payment Failure <span className="gold-text">Callback</span>
                        </h1>

                        <p className="text-dark-300 text-base leading-relaxed mb-6">
                            This callback endpoint handles declined, timed-out, or user-cancelled transactions sent back from <strong>Rapid Gateway</strong>.
                        </p>

                        <div className="p-4 bg-dark-900/60 border border-gold-400/10 text-xs text-dark-300 text-left space-y-1.5 mb-8 font-mono">
                            <div><strong>Endpoint:</strong> /payment/failure</div>
                            <div><strong>Expected Parameter:</strong> ?order_id=&lt;id&gt;</div>
                            <div><strong>Action:</strong> Informs customer of failure and allows immediate checkout retry</div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/checkout" className="btn-primary flex items-center justify-center gap-2">
                                <FiRefreshCw /> Go to Checkout
                            </Link>
                            <Link to="/products" className="btn-secondary flex items-center justify-center gap-2">
                                <FiShoppingBag /> Browse Catalog
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
                title="Payment Unsuccessful - Ellite Bling"
                description="Your transaction could not be processed."
                canonical="https://ellitebling.com/payment/failure"
            />
            <div className="container-custom max-w-3xl">
                <div className="card p-8 md:p-12 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-rosegold/10 border border-rosegold/30 flex items-center justify-center">
                        <FiXCircle className="text-4xl text-rosegold" />
                    </div>

                    <h1 className="text-3xl md:text-4xl font-heading font-bold text-ivory mb-4">
                        Payment Not Completed
                    </h1>
                    <p className="text-lg text-dark-300 mb-4">
                        The transaction for order <strong>#{orderId}</strong> could not be processed or was cancelled.
                    </p>
                    <p className="text-dark-400 text-sm mb-10">
                        If any amount was deducted from your bank or card, Rapid Gateway will automatically reverse it within 3-5 business days. You can retry checkout anytime or choose Cash on Delivery.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/checkout" className="btn-primary flex items-center justify-center gap-2">
                            <FiRefreshCw /> Try Again
                        </Link>
                        <Link to="/cart" className="btn-secondary flex items-center justify-center gap-2">
                            <FiShoppingBag /> View Cart
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PaymentFailure
