import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../supabase/client'
import ProductCard from '../components/ProductCard'
import SEO from '../components/SEO'
import { defaultProducts } from '../data/products'
import { FiSearch, FiGrid, FiList } from 'react-icons/fi'

const Products = () => {
    const [searchParams] = useSearchParams()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all')
    const [categories, setCategories] = useState([])

    useEffect(() => {
        fetchProducts()
        fetchCategories()
    }, [])

    useEffect(() => {
        const search = searchParams.get('search')
        const category = searchParams.get('category')
        if (search) setSearchTerm(search)
        if (category) setSelectedCategory(category)
    }, [searchParams])

    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false })

            if (error || !data || data.length === 0) {
                setProducts(defaultProducts)
            } else {
                setProducts(data)
            }
        } catch (error) {
            console.warn('Using local product catalog fallback:', error)
            setProducts(defaultProducts)
        } finally {
            setLoading(false)
        }
    }

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('category')

            if (error || !data || data.length === 0) {
                const uniqueCategories = [...new Set(defaultProducts.map(item => item.category))]
                setCategories(uniqueCategories)
            } else {
                const uniqueCategories = [...new Set(data.map(item => item.category))]
                setCategories(uniqueCategories)
            }
        } catch (error) {
            const uniqueCategories = [...new Set(defaultProducts.map(item => item.category))]
            setCategories(uniqueCategories)
        }
    }

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    const allCategories = ['all', ...categories]

    return (
        <div className="whitespace-section">
            <SEO
                title="All Jewelry Products - Wholesale Collection"
                description="Explore our entire collection of luxury artificial jewelry in Pakistan. Necklaces, bridal sets, earrings, rings, and bracelets at wholesale prices."
                canonical="https://ellitebling.com/products"
            />
            <div className="container-custom">
                {/* Header */}
                <div className="text-center mb-16">
                    <span className="text-gold-400 text-sm tracking-[0.3em] uppercase font-medium">Our Collection</span>
                    <h1 className="section-title mt-4">Premium Jewelry</h1>
                    <p className="section-subtitle">Discover exquisite pieces for every occasion at wholesale prices</p>
                </div>

                {/* Filters */}
                <div className="mb-12 space-y-6">
                    {/* Search */}
                    <div className="relative max-w-lg mx-auto">
                        <FiSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 text-dark-400 text-lg" />
                        <input
                            type="text"
                            placeholder="Search jewelry..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field pl-12"
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="flex flex-wrap justify-center gap-2">
                        {allCategories.map(category => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-6 py-3 text-sm tracking-wider uppercase font-medium transition-all duration-300 ${selectedCategory === category
                                    ? 'bg-gold-400 text-dark-900'
                                    : 'border border-gold-400/20 text-dark-200 hover:border-gold-400/50 hover:text-gold-400'
                                }`}
                            >
                                {category === 'all' ? 'All' : category}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Products Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
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
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-2xl text-ivory font-heading mb-3">No products found</p>
                        <p className="text-dark-400">Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <>
                        <p className="text-dark-400 text-sm mb-6 tracking-wide">
                            Showing <span className="text-ivory font-semibold">{filteredProducts.length}</span> pieces
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
                            {filteredProducts.map((product, idx) => (
                                <div key={product.id} className="animate-fade-in-up" style={{ animationDelay: `${(idx % 4) * 100}ms` }}>
                                    <ProductCard product={product} />
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default Products
