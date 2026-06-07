import { Link } from 'react-router-dom'
import { FiShoppingCart, FiStar, FiHeart } from 'react-icons/fi'
import { useCart } from '../context/CartContext'
import { useState } from 'react'

const ProductCard = ({ product }) => {
    const { addToCart } = useCart()
    const [isWishlisted, setIsWishlisted] = useState(false)

    const handleAddToCart = (e) => {
        e.preventDefault()
        e.stopPropagation()
        addToCart(product)
    }

    const handleWishlist = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsWishlisted(!isWishlisted)
    }

    const wholesalePrice = product.price * 0.7

    return (
        <Link to={`/products/${product.id}`} className="group block">
            <div className="card card-hover rounded-none">
                {/* Product Image */}
                <div className="relative h-72 bg-dark-700 overflow-hidden">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Wishlist Button */}
                    <button
                        onClick={handleWishlist}
                        className={`absolute top-4 right-4 w-10 h-10 flex items-center justify-center transition-all duration-300 z-10 ${isWishlisted ? 'text-rosegold bg-ivory/90' : 'text-ivory/70 bg-dark-900/50 hover:bg-dark-900/80 hover:text-ivory'}`}
                    >
                        <FiHeart className={`text-lg ${isWishlisted ? 'fill-rosegold' : ''}`} />
                    </button>

                    {/* Badges */}
                    {product.featured && (
                        <span className="absolute top-4 left-4 bg-gold-400 text-dark-900 px-3 py-1 text-xs font-semibold tracking-wider uppercase">
                            Featured
                        </span>
                    )}
                    {product.stock === 0 && (
                        <span className="absolute top-4 left-4 bg-dark-900/90 text-ivory px-3 py-1 text-xs font-semibold tracking-wider uppercase">
                            Sold Out
                        </span>
                    )}

                    {/* Quick Add - appears on hover */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                        {product.stock > 0 && (
                            <button
                                onClick={handleAddToCart}
                                className="w-full bg-gold-400 text-dark-900 py-3 text-sm font-semibold tracking-wider uppercase hover:bg-gold-500 transition-colors flex items-center justify-center space-x-2"
                            >
                                <FiShoppingCart />
                                <span>Quick Add</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Product Info */}
                <div className="p-5">
                    <p className="text-xs text-gold-400/80 tracking-widest uppercase mb-2">{product.category || 'Jewelry'}</p>
                    <h3 className="text-base font-heading font-bold text-ivory mb-2 line-clamp-1 group-hover:text-gold-400 transition-colors">
                        {product.name}
                    </h3>

                    {/* Rating */}
                    {product.rating && (
                        <div className="flex items-center mb-3">
                            {[...Array(5)].map((_, i) => (
                                <FiStar
                                    key={i}
                                    className={`text-xs ${i < Math.floor(product.rating) ? 'text-gold-400 fill-gold-400' : 'text-dark-500'
                                        }`}
                                />
                            ))}
                            <span className="ml-2 text-xs text-dark-400">({product.rating})</span>
                        </div>
                    )}

                    {/* Price */}
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-lg font-bold text-gold-400">
                                Rs. {product.price.toLocaleString()}
                            </span>
                            <span className="text-xs text-dark-400 ml-2 line-through">
                                Rs. {Math.round(product.price * 1.3).toLocaleString()}
                            </span>
                        </div>
                        <span className="text-xs text-rosegold font-semibold">Wholesale</span>
                    </div>

                    {product.stock > 0 && product.stock < 5 && (
                        <p className="text-rosegold text-xs mt-2">Only {product.stock} left!</p>
                    )}
                </div>
            </div>
        </Link>
    )
}

export default ProductCard
