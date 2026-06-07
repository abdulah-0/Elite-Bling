import { FiX, FiShoppingCart, FiTrash2 } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

const CartDrawer = () => {
    const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, getCartTotal } = useCart()
    const savings = getCartTotal() * 0.3

    if (!isCartOpen) return null

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fade-in"
                onClick={() => setIsCartOpen(false)}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-dark-900 border-l border-gold-400/20 z-50 animate-slide-in-right shadow-2xl">
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gold-400/10">
                        <div className="flex items-center space-x-3">
                            <FiShoppingCart className="text-xl text-gold-400" />
                            <h2 className="text-xl font-heading font-bold text-ivory">Your Cart</h2>
                            <span className="text-sm text-dark-400">({cart.length})</span>
                        </div>
                        <button
                            onClick={() => setIsCartOpen(false)}
                            className="w-10 h-10 flex items-center justify-center border border-gold-400/20 text-ivory hover:bg-gold-400/10 transition-colors"
                        >
                            <FiX className="text-lg" />
                        </button>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-grow overflow-y-auto p-6">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <FiShoppingCart className="text-5xl text-dark-600 mb-6" />
                                <p className="text-xl text-ivory font-heading mb-2">Your cart is empty</p>
                                <p className="text-dark-400 text-sm mb-8">Add some jewelry to get started!</p>
                                <button
                                    onClick={() => setIsCartOpen(false)}
                                    className="btn-primary"
                                >
                                    Shop Now
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {cart.map((item) => (
                                    <div key={item.id} className="flex space-x-4 border-b border-gold-400/10 pb-4">
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-20 h-20 object-cover"
                                        />
                                        <div className="flex-grow">
                                            <h3 className="font-heading font-bold text-ivory text-sm mb-1">{item.name}</h3>
                                            <p className="text-gold-400 font-bold text-sm mb-2">
                                                Rs. {item.price.toLocaleString()}
                                            </p>
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="w-7 h-7 flex items-center justify-center border border-gold-400/20 text-ivory hover:bg-gold-400/10 transition-colors text-sm"
                                                >
                                                    -
                                                </button>
                                                <span className="w-8 text-center font-semibold text-ivory text-sm">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="w-7 h-7 flex items-center justify-center border border-gold-400/20 text-ivory hover:bg-gold-400/10 transition-colors text-sm"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-rosegold hover:text-rosegold/80 transition-colors self-start mt-1"
                                        >
                                            <FiTrash2 className="text-sm" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {cart.length > 0 && (
                        <div className="border-t border-gold-400/10 p-6 space-y-4">
                            {/* Savings */}
                            <div className="bg-dark-800 border border-gold-400/10 p-3 text-center">
                                <p className="text-xs text-gold-400">
                                    You save <span className="font-bold">Rs. {Math.round(savings).toLocaleString()}</span> with wholesale pricing!
                                </p>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-ivory font-heading">Subtotal</span>
                                <span className="text-xl font-bold text-gold-400">Rs. {getCartTotal().toLocaleString()}</span>
                            </div>
                            <Link
                                to="/cart"
                                onClick={() => setIsCartOpen(false)}
                                className="block w-full btn-secondary text-center text-sm"
                            >
                                View Cart
                            </Link>
                            <Link
                                to="/checkout"
                                onClick={() => setIsCartOpen(false)}
                                className="block w-full btn-primary text-center text-sm"
                            >
                                Checkout
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default CartDrawer
