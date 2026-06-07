import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { FiTrash2, FiShoppingCart, FiShield } from 'react-icons/fi'

const Cart = () => {
    const navigate = useNavigate()
    const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart()
    const savings = getCartTotal() * 0.3

    if (cart.length === 0) {
        return (
            <div className="container-custom py-20">
                <div className="max-w-lg mx-auto text-center">
                    <FiShoppingCart className="text-6xl text-dark-600 mx-auto mb-6" />
                    <h1 className="text-3xl font-heading font-bold text-ivory mb-4">Your cart is empty</h1>
                    <p className="text-dark-400 mb-8">
                        Looks like you haven't added any jewelry to your cart yet.
                    </p>
                    <Link to="/products" className="btn-primary">
                        Continue Shopping
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="py-16 md:py-20">
            <div className="container-custom">
                <h1 className="text-3xl md:text-4xl font-heading font-bold text-ivory mb-10">Shopping Cart</h1>

                <div className="grid lg:grid-cols-3 gap-10">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {cart.map((item) => (
                            <div key={item.id} className="card p-6">
                                <div className="flex gap-6">
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-28 h-28 object-cover shrink-0"
                                    />
                                    <div className="flex-grow">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="text-lg font-heading font-bold text-ivory mb-1">{item.name}</h3>
                                                <p className="text-xs text-dark-400 tracking-wider uppercase">{item.category}</p>
                                            </div>
                                            <p className="text-xl font-bold text-gold-400">
                                                Rs. {(item.price * item.quantity).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between mt-4">
                                            <div className="flex items-center space-x-3">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="w-9 h-9 flex items-center justify-center border border-gold-400/20 text-ivory hover:bg-gold-400/10 transition-colors"
                                                >
                                                    -
                                                </button>
                                                <span className="w-10 text-center font-semibold text-ivory">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="w-9 h-9 flex items-center justify-center border border-gold-400/20 text-ivory hover:bg-gold-400/10 transition-colors"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <span className="text-sm text-dark-400">Rs. {item.price.toLocaleString()} each</span>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="text-rosegold hover:text-rosegold/80 transition-colors"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="card p-6 sticky top-24">
                            <h2 className="text-xl font-heading font-bold text-ivory mb-6">Order Summary</h2>

                            {/* Savings Banner */}
                            <div className="bg-dark-800 border border-gold-400/10 p-3 mb-6 text-center">
                                <p className="text-xs text-gold-400">
                                    Wholesale Savings: <span className="font-bold">Rs. {Math.round(savings).toLocaleString()}</span>
                                </p>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-dark-200">
                                    <span>Subtotal</span>
                                    <span>Rs. {getCartTotal().toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-dark-200">
                                    <span>Shipping</span>
                                    <span className="text-green-500 font-semibold">FREE</span>
                                </div>
                                <div className="border-t border-gold-400/10 pt-3">
                                    <div className="flex justify-between text-xl font-bold">
                                        <span className="text-ivory">Total</span>
                                        <span className="text-gold-400">Rs. {getCartTotal().toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate('/checkout')}
                                className="btn-primary w-full mb-3"
                            >
                                Proceed to Checkout
                            </button>

                            <Link to="/products" className="btn-secondary w-full block text-center text-sm">
                                Continue Shopping
                            </Link>

                            <button
                                onClick={clearCart}
                                className="w-full mt-4 text-rosegold hover:text-rosegold/80 text-sm transition-colors"
                            >
                                Clear Cart
                            </button>

                            {/* Trust Badges */}
                            <div className="mt-6 pt-6 border-t border-gold-400/10 space-y-3">
                                <div className="flex items-center space-x-2 text-dark-400 text-xs">
                                    <FiShield className="text-gold-400" />
                                    <span>Secure checkout with SSL encryption</span>
                                </div>
                                <div className="flex items-center space-x-2 text-dark-400 text-xs">
                                    <FiShield className="text-gold-400" />
                                    <span>Cash on Delivery available</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Cart
