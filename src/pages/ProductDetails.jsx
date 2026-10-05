import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabase/client'
import { useCart } from '../context/CartContext'
import SEO from '../components/SEO'
import { defaultProducts } from '../data/products'
import { FiStar, FiShoppingCart, FiArrowLeft, FiHeart, FiShare2, FiCheck, FiTruck } from 'react-icons/fi'

const ProductDetails = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { addToCart } = useCart()
    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [quantity, setQuantity] = useState(1)
    const [isWishlisted, setIsWishlisted] = useState(false)
    const [addedToCart, setAddedToCart] = useState(false)

    useEffect(() => {
        fetchProduct()
        window.scrollTo(0, 0)
    }, [id])

    const fetchProduct = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single()

            if (error || !data) {
                const local = defaultProducts.find(p => String(p.id) === String(id))
                setProduct(local || null)
            } else {
                setProduct(data)
            }
        } catch (error) {
            const local = defaultProducts.find(p => String(p.id) === String(id))
            setProduct(local || null)
        } finally {
            setLoading(false)
        }
    }

    const handleAddToCart = () => {
        addToCart(product, quantity)
        setAddedToCart(true)
        setTimeout(() => setAddedToCart(false), 2000)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-2 border-gold-400 border-t-transparent animate-spin" />
            </div>
        )
    }

    if (!product) {
        return (
            <div className="container-custom py-20 text-center">
                <h2 className="text-3xl font-heading font-bold text-ivory mb-4">Product not found</h2>
                <button onClick={() => navigate('/products')} className="btn-primary">
                    Back to Products
                </button>
            </div>
        )
    }

    const wholesaleTiers = [
        { min: 10, max: 49, discount: '10%' },
        { min: 50, max: 99, discount: '15%' },
        { min: 100, max: null, discount: '20%' },
    ]

    const wholesalePrices = wholesaleTiers.map(tier => ({
        label: `Qty ${tier.min}${tier.max ? `-${tier.max}` : '+'}`,
        price: product.price * (1 - parseInt(tier.discount) / 100),
        discount: tier.discount,
    }))

    return (
        <div className="py-16 md:py-20">
            <SEO
                title={`${product.name} - ${product.category || 'Jewelry'} Wholesale`}
                description={product.description || `Buy ${product.name} at wholesale prices from Ellite Bling Pakistan. Premium artificial jewelry for boutiques and resellers.`}
                canonical={`https://ellitebling.com/products/${product.id}`}
                ogImage={product.image}
            />
            {/* Structured Data: Product Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org/",
                        "@type": "Product",
                        "name": product.name,
                        "image": [product.image],
                        "description": product.description || `${product.name} - Luxury artificial jewelry piece by Ellite Bling Pakistan.`,
                        "sku": `EB-${product.id}`,
                        "category": product.category || 'Jewelry',
                        "brand": {
                            "@type": "Brand",
                            "name": "Ellite Bling"
                        },
                        "offers": {
                            "@type": "Offer",
                            "url": `https://ellitebling.com/products/${product.id}`,
                            "priceCurrency": "PKR",
                            "price": product.price,
                            "availability": "https://schema.org/InStock",
                            "itemCondition": "https://schema.org/NewCondition"
                        }
                    })
                }}
            />
            <div className="container-custom">
                {/* Breadcrumb */}
                <div className="flex items-center space-x-2 text-sm text-dark-400 mb-8">
                    <Link to="/" className="hover:text-gold-400 transition-colors">Home</Link>
                    <span>/</span>
                    <Link to="/products" className="hover:text-gold-400 transition-colors">Products</Link>
                    <span>/</span>
                    <span className="text-ivory">{product.name}</span>
                </div>

                <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
                    {/* Product Image Gallery */}
                    <div className="space-y-4">
                        <div className="relative bg-dark-700 overflow-hidden group cursor-crosshair">
                            <img
                                src={product.image}
                                alt={`${product.name} - Ellite Bling Luxury Artificial Jewelry`}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-dark-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            {product.featured && (
                                <span className="absolute top-4 left-4 bg-gold-400 text-dark-900 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase">
                                    Featured
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="space-y-6">
                        {/* Category & Actions */}
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gold-400 text-xs tracking-[0.3em] uppercase font-medium mb-2">
                                    {product.category || 'Jewelry'}
                                </p>
                                <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-ivory">
                                    {product.name}
                                </h1>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsWishlisted(!isWishlisted)}
                                    className={`w-10 h-10 flex items-center justify-center border transition-all duration-300 ${isWishlisted ? 'border-rosegold text-rosegold' : 'border-gold-400/20 text-dark-200 hover:border-gold-400'}`}
                                >
                                    <FiHeart className={`text-lg ${isWishlisted ? 'fill-rosegold' : ''}`} />
                                </button>
                                <button className="w-10 h-10 flex items-center justify-center border border-gold-400/20 text-dark-200 hover:border-gold-400 transition-all">
                                    <FiShare2 className="text-lg" />
                                </button>
                            </div>
                        </div>

                        {/* Rating */}
                        {product.rating && (
                            <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                    <FiStar
                                        key={i}
                                        className={`text-base ${i < Math.floor(product.rating) ? 'text-gold-400 fill-gold-400' : 'text-dark-600'}`}
                                    />
                                ))}
                                <span className="ml-2 text-sm text-dark-400">({product.rating})</span>
                            </div>
                        )}

                        {/* Price */}
                        <div className="space-y-1">
                            <div className="text-3xl md:text-4xl font-heading font-bold text-gold-400">
                                Rs. {product.price.toLocaleString()}
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-dark-400 line-through text-lg">
                                    Rs. {Math.round(product.price * 1.3).toLocaleString()}
                                </span>
                                <span className="text-rosegold text-sm font-semibold">30% wholesale discount</span>
                            </div>
                        </div>

                        {/* Description */}
                        <p className="text-dark-200 leading-relaxed">
                            {product.description}
                        </p>

                        {/* Wholesale Pricing Tiers */}
                        <div className="border border-gold-400/20 bg-dark-800/50 p-6">
                            <h3 className="text-sm tracking-widest uppercase text-gold-400 font-semibold mb-4">Wholesale Pricing Tiers</h3>
                            <div className="space-y-3">
                                {wholesalePrices.map((tier, idx) => (
                                    <div key={idx} className="flex items-center justify-between border-b border-gold-400/10 pb-3 last:border-b-0 last:pb-0">
                                        <span className="text-sm text-dark-200">{tier.label}</span>
                                        <div className="flex items-center space-x-3">
                                            <span className="text-gold-400 font-bold">Rs. {Math.round(tier.price).toLocaleString()}</span>
                                            <span className="text-xs text-rosegold font-semibold border border-rosegold/30 px-2 py-0.5">
                                                Save {tier.discount}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-dark-400 mt-4">Minimum Order Quantity (MOQ): 10 pieces per design</p>
                        </div>

                        {/* Stock & Delivery */}
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center space-x-2">
                                {product.stock === 0 ? (
                                    <span className="text-rosegold text-sm font-semibold flex items-center">
                                        <FiCheck className="mr-1" /> Out of Stock
                                    </span>
                                ) : product.stock < 5 ? (
                                    <span className="text-rosegold text-sm font-semibold">Only {product.stock} left!</span>
                                ) : (
                                    <span className="text-green-500 text-sm font-semibold flex items-center">
                                        <FiCheck className="mr-1" /> In Stock
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center space-x-2 text-dark-300 text-sm">
                                <FiTruck />
                                <span>Delivery estimate: 3-5 business days</span>
                            </div>
                        </div>

                        {/* Quantity & Add to Cart */}
                        {product.stock > 0 && (
                            <>
                                <div>
                                    <label className="block text-sm tracking-wider uppercase text-dark-300 font-medium mb-3">Quantity</label>
                                    <div className="flex items-center space-x-4">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="w-12 h-12 flex items-center justify-center border border-gold-400/20 text-ivory hover:bg-gold-400/10 transition-colors"
                                        >
                                            -
                                        </button>
                                        <span className="text-xl font-semibold text-ivory w-16 text-center">{quantity}</span>
                                        <button
                                            onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                            className="w-12 h-12 flex items-center justify-center border border-gold-400/20 text-ivory hover:bg-gold-400/10 transition-colors"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={handleAddToCart}
                                    disabled={product.stock === 0}
                                    className={`btn-primary w-full flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${addedToCart ? 'bg-green-500' : ''}`}
                                >
                                    {addedToCart ? (
                                        <>
                                            <FiCheck />
                                            <span>Added to Cart!</span>
                                        </>
                                    ) : (
                                        <>
                                            <FiShoppingCart />
                                            <span>Add to Cart</span>
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProductDetails
