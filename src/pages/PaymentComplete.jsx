import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

const PaymentComplete = () => {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const orderId = searchParams.get('order_id')

    useEffect(() => {
        // Clear cart and update order status
        localStorage.removeItem('cart')
        navigate(`/order-success?id=${orderId}`, { replace: true })
    }, [])

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-2 border-gold-400 border-t-transparent animate-spin" />
        </div>
    )
}

export default PaymentComplete
