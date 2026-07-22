import { useSearchParams, Link } from 'react-router-dom'
import { FiXCircle } from 'react-icons/fi'

const PaymentFailure = () => {
    const [searchParams] = useSearchParams()
    const orderId = searchParams.get('order_id')

    return (
        <div className="py-16 md:py-20">
            <div className="container-custom max-w-3xl">
                <div className="card p-8 md:p-12 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-rosegold/10 border border-rosegold/30 flex items-center justify-center">
                        <FiXCircle className="text-4xl text-rosegold" />
                    </div>

                    <h1 className="text-3xl md:text-4xl font-heading font-bold text-ivory mb-4">
                        Payment Failed
                    </h1>
                    <p className="text-lg text-dark-300 mb-4">
                        The payment could not be processed. Your order has been saved and you can try again.
                    </p>
                    <p className="text-dark-400 text-sm mb-10">
                        If the amount was deducted, it will be refunded within 3-5 business days.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/checkout" className="btn-primary">
                            Try Again
                        </Link>
                        <Link to="/cart" className="btn-secondary">
                            View Cart
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PaymentFailure
