import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase/client'
import { FiCheck, FiShield, FiTruck, FiLock } from 'react-icons/fi'

const Checkout = () => {
    const navigate = useNavigate()
    const { cart, getCartTotal, clearCart } = useCart()
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState(1)
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
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data, error } = await supabase
                .from('orders')
                .insert([
                    {
                        user_id: user?.id || null,
                        order_items: cart,
                        total_price: getCartTotal(),
                        status: 'pending',
                        shipping_info: formData
                    }
                ])
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

                                {/* Payment Method */}
                                <div className="border border-gold-400/20 bg-dark-800/50 p-6 mb-6">
                                    <h3 className="text-sm tracking-widest uppercase text-gold-400 font-semibold mb-4">Payment Method</h3>
                                    <div className="flex items-center space-x-3 text-ivory">
                                        <div className="w-5 h-5 border-2 border-gold-400 rounded-full flex items-center justify-center">
                                            <div className="w-2.5 h-2.5 bg-gold-400 rounded-full" />
                                        </div>
                                        <span className="font-medium">Cash on Delivery (COD)</span>
                                    </div>
                                    <p className="text-sm text-dark-400 mt-2 ml-8">
                                        Pay when your order is delivered to your doorstep
                                    </p>
                                </div>

                                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                                    {loading ? 'Placing Order...' : 'Place Order'}
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

                            {/* Trust Badges */}
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
