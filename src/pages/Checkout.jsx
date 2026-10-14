import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase/client'
import { FiCheck, FiShield, FiTruck, FiLock, FiCreditCard, FiGlobe } from 'react-icons/fi'

const Checkout = () => {
    const navigate = useNavigate()
    const { cart, getCartTotal, clearCart } = useCart()
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState(1)
    const [paymentMethod, setPaymentMethod] = useState('cod')
    const [swichConfig, setSwichConfig] = useState(null)

    useEffect(() => {
        fetch('/api/payments/swich/config')
            .then(res => res.json())
            .then(data => {
                if (data && data.enabled) {
                    setSwichConfig(data)
                }
            })
            .catch(err => console.error('Failed to load Swich config:', err))
    }, [])
    const [formData, setFormData] = useState({
        fullName: '',
        email: user?.email || '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        notes: ''
    })

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleCodOrder = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('orders')
                .insert([{
                    user_id: user?.id || null,
                    order_items: cart,
                    total_price: getCartTotal(),
                    status: 'pending',
                    shipping_info: formData
                }])
                .select()

            if (error) throw error
            clearCart()
            navigate('/order-success', { state: { order: data[0] } })
        } catch (error) {
            console.error('Error creating order:', error)
            alert('Failed to place order. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleCardPayment = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('orders')
                .insert([{
                    user_id: user?.id || null,
                    order_items: cart,
                    total_price: getCartTotal(),
                    status: 'pending',
                    shipping_info: formData
                }])
                .select()

            if (error) throw error

            const res = await fetch('/api/create-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: getCartTotal(),
                    phone: formData.phone,
                    email: formData.email,
                    orderId: data[0].id,
                }),
            })

            const { redirectUrl } = await res.json()
            if (redirectUrl) {
                window.location.href = redirectUrl
            } else {
                alert('Failed to initiate payment. Please try again.')
            }
        } catch (error) {
            console.error('Payment error:', error)
            alert('Failed to process payment. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleSwichPayment = async () => {
        const cleanedPhone = (formData.phone || '').replace(/\D/g, '')
        const isValidPhone = /^(03\d{9}|923\d{9}|3\d{9})$/.test(cleanedPhone)
        if (!isValidPhone) {
            alert('Please enter a valid Pakistani mobile number starting with 03 (e.g. 03001234567) for online payment.')
            return
        }

        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('orders')
                .insert([{
                    user_id: user?.id || null,
                    order_items: cart,
                    total_price: getCartTotal(),
                    status: 'pending',
                    payment_status: 'unpaid',
                    shipping_info: formData
                }])
                .select()

            if (error) throw error

            const res = await fetch('/api/payments/swich/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: data[0].id,
                }),
            })

            const initData = await res.json()
            if (res.ok && initData.redirectUrl) {
                window.location.href = initData.redirectUrl
            } else {
                alert(initData.error || 'Failed to initiate online payment. Please try again.')
                setLoading(false)
            }
        } catch (error) {
            console.error('Swich payment error:', error)
            alert(error.message || 'Failed to process payment. Please try again.')
            setLoading(false)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (paymentMethod === 'cod') {
            handleCodOrder()
        } else if (paymentMethod === 'swich') {
            handleSwichPayment()
        } else {
            handleCardPayment()
        }
    }

    if (cart.length === 0) {
        navigate('/cart')
        return null
    }

    const steps = ['Shipping', 'Payment', 'Confirmation']

    return (
        <div className="py-16 md:py-20">
            <div className="container-custom max-w-6xl">
                {/* Step Progress */}
                <div className="mb-12">
                    <div className="flex items-center justify-center space-x-4 md:space-x-8">
                        {steps.map((s, idx) => (
                            <div key={s} className="flex items-center">
                                <div className="flex items-center space-x-2">
                                    <div className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-sm font-semibold transition-all duration-500 ${step > idx + 1 ? 'bg-gold-400 text-dark-900' : step === idx + 1 ? 'border-2 border-gold-400 text-gold-400' : 'border border-dark-600 text-dark-500'}`}>
                                        {step > idx + 1 ? <FiCheck /> : idx + 1}
                                    </div>
                                    <span className={`hidden md:inline text-sm ${step >= idx + 1 ? 'text-ivory' : 'text-dark-500'}`}>{s}</span>
                                </div>
                                {idx < steps.length - 1 && (
                                    <div className={`w-8 md:w-16 h-px mx-2 ${step > idx + 1 ? 'bg-gold-400' : 'bg-dark-600'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-10">
                    {/* Checkout Form */}
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSubmit}>
                            <div className="card p-8">
                                <h2 className="text-2xl font-heading font-bold text-ivory mb-8">Shipping Information</h2>

                                <div className="grid md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-sm tracking-wider uppercase text-dark-300 font-medium mb-2">Full Name *</label>
                                        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="input-field" />
                                    </div>
                                    <div>
                                        <label className="block text-sm tracking-wider uppercase text-dark-300 font-medium mb-2">Email *</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} required className="input-field" />
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm tracking-wider uppercase text-dark-300 font-medium mb-2">Phone Number *</label>
                                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="input-field" />
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm tracking-wider uppercase text-dark-300 font-medium mb-2">Address *</label>
                                    <input type="text" name="address" value={formData.address} onChange={handleChange} required className="input-field" />
                                </div>

                                <div className="grid md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-sm tracking-wider uppercase text-dark-300 font-medium mb-2">City *</label>
                                        <input type="text" name="city" value={formData.city} onChange={handleChange} required className="input-field" />
                                    </div>
                                    <div>
                                        <label className="block text-sm tracking-wider uppercase text-dark-300 font-medium mb-2">State/Province *</label>
                                        <input type="text" name="state" value={formData.state} onChange={handleChange} required className="input-field" />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-sm tracking-wider uppercase text-dark-300 font-medium mb-2">ZIP/Postal Code *</label>
                                        <input type="text" name="zipCode" value={formData.zipCode} onChange={handleChange} required className="input-field" />
                                    </div>
                                    <div>
                                        <label className="block text-sm tracking-wider uppercase text-dark-300 font-medium mb-2">Country *</label>
                                        <input type="text" name="country" value={formData.country} onChange={handleChange} required className="input-field" />
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm tracking-wider uppercase text-dark-300 font-medium mb-2">Order Notes (Optional)</label>
                                    <textarea name="notes" value={formData.notes} onChange={handleChange} rows="4" className="input-field" placeholder="Any special instructions..." />
                                </div>

                                {/* Payment Method Selection */}
                                <div className="mb-6">
                                    <h3 className="text-sm tracking-widest uppercase text-gold-400 font-semibold mb-4">Payment Method</h3>
                                    <div className="space-y-4">
                                        <label className={`flex items-start p-4 border cursor-pointer transition-all duration-300 ${paymentMethod === 'cod' ? 'border-gold-400 bg-gold-400/5' : 'border-gold-400/20 hover:border-gold-400/40'}`}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="cod"
                                                checked={paymentMethod === 'cod'}
                                                onChange={() => setPaymentMethod('cod')}
                                                className="sr-only"
                                            />
                                            <div className={`w-5 h-5 mt-0.5 border-2 rounded-full flex items-center justify-center shrink-0 ${paymentMethod === 'cod' ? 'border-gold-400' : 'border-dark-500'}`}>
                                                {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 bg-gold-400 rounded-full" />}
                                            </div>
                                            <div className="ml-4">
                                                <p className="font-medium text-ivory">Cash on Delivery</p>
                                                <p className="text-sm text-dark-400 mt-1">Pay when your order is delivered</p>
                                            </div>
                                        </label>

                                        <label className={`flex items-start p-4 border cursor-pointer transition-all duration-300 ${paymentMethod === 'card' ? 'border-gold-400 bg-gold-400/5' : 'border-gold-400/20 hover:border-gold-400/40'}`}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="card"
                                                checked={paymentMethod === 'card'}
                                                onChange={() => setPaymentMethod('card')}
                                                className="sr-only"
                                            />
                                            <div className={`w-5 h-5 mt-0.5 border-2 rounded-full flex items-center justify-center shrink-0 ${paymentMethod === 'card' ? 'border-gold-400' : 'border-dark-500'}`}>
                                                {paymentMethod === 'card' && <div className="w-2.5 h-2.5 bg-gold-400 rounded-full" />}
                                            </div>
                                            <div className="ml-4">
                                                <div className="flex items-center space-x-2">
                                                    <FiCreditCard className="text-gold-400" />
                                                    <p className="font-medium text-ivory">Credit / Debit Card</p>
                                                </div>
                                                <p className="text-sm text-dark-400 mt-1">Pay securely via Rapid Gateway (Visa / Mastercard)</p>
                                            </div>
                                        </label>
                                        {/* Swich PayIn Option */}
                                        {swichConfig?.enabled && (
                                            (getCartTotal() >= swichConfig.minAmount && getCartTotal() <= swichConfig.maxAmount) ? (
                                                <label className={`flex items-start p-4 border cursor-pointer transition-all duration-300 ${paymentMethod === 'swich' ? 'border-gold-400 bg-gold-400/5' : 'border-gold-400/20 hover:border-gold-400/40'}`}>
                                                    <input
                                                        type="radio"
                                                        name="paymentMethod"
                                                        value="swich"
                                                        checked={paymentMethod === 'swich'}
                                                        onChange={() => setPaymentMethod('swich')}
                                                        className="sr-only"
                                                    />
                                                    <div className={`w-5 h-5 mt-0.5 border-2 rounded-full flex items-center justify-center shrink-0 ${paymentMethod === 'swich' ? 'border-gold-400' : 'border-dark-500'}`}>
                                                        {paymentMethod === 'swich' && <div className="w-2.5 h-2.5 bg-gold-400 rounded-full" />}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="flex items-center space-x-2">
                                                            <FiGlobe className="text-gold-400" />
                                                            <p className="font-medium text-ivory">Pay Online — Cards, Wallets, Bank (Swich)</p>
                                                        </div>
                                                        <p className="text-sm text-dark-400 mt-1">Instant & secure via Cards, Easypaisa, JazzCash, or Bank Account</p>
                                                    </div>
                                                </label>
                                            ) : (
                                                <div className="p-3 border border-gold-400/20 bg-dark-900/50 rounded text-xs text-dark-300">
                                                    Online payment supports orders between PKR {swichConfig.minAmount.toLocaleString()} and PKR {swichConfig.maxAmount.toLocaleString()}. Please choose another payment method.
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>

                                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                                    {loading
                                        ? 'Processing...'
                                        : paymentMethod === 'swich'
                                        ? `Pay PKR ${getCartTotal().toLocaleString()}`
                                        : paymentMethod === 'cod'
                                        ? 'Place Order'
                                        : 'Pay Now'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="card p-6 sticky top-24">
                            <h2 className="text-xl font-heading font-bold text-ivory mb-6">Order Summary</h2>

                            <div className="space-y-4 mb-6">
                                {cart.map((item) => (
                                    <div key={item.id} className="flex gap-3">
                                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover shrink-0" />
                                        <div className="flex-grow">
                                            <p className="font-heading font-bold text-ivory text-sm">{item.name}</p>
                                            <p className="text-xs text-dark-400">Qty: {item.quantity}</p>
                                            <p className="text-sm font-bold text-gold-400">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gold-400/10 pt-4 space-y-2">
                                <div className="flex justify-between text-dark-200 text-sm">
                                    <span>Subtotal</span>
                                    <span>Rs. {getCartTotal().toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-dark-200 text-sm">
                                    <span>Shipping</span>
                                    <span className="text-green-500 font-semibold">FREE</span>
                                </div>
                                <div className="border-t border-gold-400/10 pt-2">
                                    <div className="flex justify-between text-xl font-bold">
                                        <span className="text-ivory">Total</span>
                                        <span className="text-gold-400">Rs. {getCartTotal().toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gold-400/10 space-y-3">
                                <div className="flex items-center space-x-3 text-dark-400 text-xs">
                                    <FiLock className="text-gold-400 shrink-0" />
                                    <span>Secure checkout with SSL encryption</span>
                                </div>
                                <div className="flex items-center space-x-3 text-dark-400 text-xs">
                                    <FiTruck className="text-gold-400 shrink-0" />
                                    <span>Free shipping on orders above Rs. 5,000</span>
                                </div>
                                <div className="flex items-center space-x-3 text-dark-400 text-xs">
                                    <FiShield className="text-gold-400 shrink-0" />
                                    <span>Quality guaranteed on all products</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Checkout
