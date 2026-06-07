import { useState, useEffect } from 'react'
import { supabase } from '../supabase/client'
import ProductCard from './ProductCard'
import { Link } from 'react-router-dom'

const TopProducts = () => {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchTopProducts()
    }, [])

    const fetchTopProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('top_product', true)
                .limit(4)

            if (error) throw error
            setProducts(data || [])
        } catch (error) {
            console.error('Error fetching top products:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <section className="whitespace-section bg-dark-800">
                <div className="container-custom">
                    <h2 className="section-title text-center">Best Sellers</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="card animate-pulse p-0">
                                <div className="h-72 bg-dark-700"></div>
                                <div className="p-5 space-y-3">
                                    <div className="h-3 bg-dark-700 w-1/3"></div>
                                    <div className="h-4 bg-dark-700 w-2/3"></div>
                                    <div className="h-3 bg-dark-700 w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        )
    }

    if (products.length === 0) return null

    return (
        <section className="whitespace-section bg-dark-800">
            <div className="container-custom">
                <div className="text-center mb-16">
                    <span className="text-gold-400 text-sm tracking-[0.3em] uppercase font-medium">Top Rated</span>
                    <h2 className="section-title mt-4">Best Sellers</h2>
                    <p className="section-subtitle">Our most popular pieces loved by resellers</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
                    {products.map((product, idx) => (
                        <div key={product.id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>
                <div className="text-center mt-12">
                    <Link to="/products" className="btn-secondary">
                        Shop Best Sellers
                    </Link>
                </div>
            </div>
        </section>
    )
}

export default TopProducts
