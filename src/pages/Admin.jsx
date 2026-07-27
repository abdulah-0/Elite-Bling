import { useState, useEffect } from 'react'
import { supabase } from '../supabase/client'
import { FiEdit2, FiTrash2, FiPlus, FiX, FiPackage } from 'react-icons/fi'

const Admin = () => {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        rating: '',
        stock: '',
        featured: false,
        top_product: false,
        image: ''
    })

    useEffect(() => {
        fetchProducts()
    }, [])

    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setProducts(data || [])
        } catch (error) {
            console.error('Error fetching products:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const productData = {
            ...formData,
            price: parseFloat(formData.price),
            rating: formData.rating ? parseFloat(formData.rating) : null,
            stock: parseInt(formData.stock)
        }

        try {
            if (editingProduct) {
                const { error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', editingProduct.id)

                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('products')
                    .insert([productData])

                if (error) throw error
            }

            fetchProducts()
            closeModal()
        } catch (error) {
            console.error('Error saving product:', error)
            alert('Failed to save product')
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this product?')) return

        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id)

            if (error) throw error
            fetchProducts()
        } catch (error) {
            console.error('Error deleting product:', error)
            alert('Failed to delete product')
        }
    }

    const openModal = (product = null) => {
        if (product) {
            setEditingProduct(product)
            setFormData({
                name: product.name,
                description: product.description,
                price: product.price,
                category: product.category,
                rating: product.rating || '',
                stock: product.stock,
                featured: product.featured,
                top_product: product.top_product,
                image: product.image
            })
        } else {
            setEditingProduct(null)
            setFormData({
                name: '',
                description: '',
                price: '',
                category: '',
                rating: '',
                stock: '',
                featured: false,
                top_product: false,
                image: ''
            })
        }
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingProduct(null)
    }

    return (
        <div className="py-16 md:py-20 min-h-screen">
            <div className="container-custom">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-heading font-bold text-ivory mb-1">Admin Dashboard</h1>
                        <p className="text-dark-400 text-sm">Manage your Ellite Bling product catalog</p>
                    </div>
                    <button onClick={() => openModal()} className="btn-primary flex items-center space-x-2">
                        <FiPlus />
                        <span>Add Product</span>
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="w-12 h-12 border-2 border-gold-400 border-t-transparent animate-spin mx-auto"></div>
                    </div>
                ) : (
                    <div className="card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gold-400/10">
                                        <th className="px-6 py-4 text-left text-xs tracking-widest uppercase text-dark-400 font-medium">Image</th>
                                        <th className="px-6 py-4 text-left text-xs tracking-widest uppercase text-dark-400 font-medium">Name</th>
                                        <th className="px-6 py-4 text-left text-xs tracking-widest uppercase text-dark-400 font-medium">Category</th>
                                        <th className="px-6 py-4 text-left text-xs tracking-widest uppercase text-dark-400 font-medium">Price</th>
                                        <th className="px-6 py-4 text-left text-xs tracking-widest uppercase text-dark-400 font-medium">Stock</th>
                                        <th className="px-6 py-4 text-left text-xs tracking-widest uppercase text-dark-400 font-medium">Status</th>
                                        <th className="px-6 py-4 text-left text-xs tracking-widest uppercase text-dark-400 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gold-400/10">
                                    {products.map((product) => (
                                        <tr key={product.id} className="hover:bg-dark-700/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <img src={product.image} alt={product.name} className="w-14 h-14 object-cover" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-heading font-bold text-ivory">{product.name}</div>
                                                <div className="text-sm text-dark-400 line-clamp-1">{product.description}</div>
                                            </td>
                                            <td className="px-6 py-4 text-dark-200 text-sm">{product.category}</td>
                                            <td className="px-6 py-4 font-bold text-gold-400 text-sm">Rs. {product.price.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={product.stock === 0 ? 'text-rosegold' : 'text-dark-200'}>
                                                    {product.stock}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-1">
                                                    {product.featured && (
                                                        <span className="bg-gold-400/10 text-gold-400 text-xs px-2 py-1 border border-gold-400/20">
                                                            Featured
                                                        </span>
                                                    )}
                                                    {product.top_product && (
                                                        <span className="bg-rosegold/10 text-rosegold text-xs px-2 py-1 border border-rosegold/20">
                                                            Top
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button onClick={() => openModal(product)} className="p-2 text-gold-400 hover:bg-gold-400/10 transition-colors border border-gold-400/20">
                                                        <FiEdit2 className="text-sm" />
                                                    </button>
                                                    <button onClick={() => handleDelete(product.id)} className="p-2 text-rosegold hover:bg-rosegold/10 transition-colors border border-rosegold/20">
                                                        <FiTrash2 className="text-sm" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-dark-900 border border-gold-400/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-dark-900 border-b border-gold-400/10 px-6 py-4 flex justify-between items-center">
                                <h2 className="text-2xl font-heading font-bold text-ivory">
                                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                                </h2>
                                <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center border border-gold-400/20 text-ivory hover:bg-gold-400/10 transition-colors">
                                    <FiX />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm tracking-wider uppercase text-dark-300 font-medium mb-2">Product Name *</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-sm tracking-wider uppercase text-dark-300 font-medium mb-2">Description *</label>
                                    <textarea name="description" value={formData.description} onChange={handleChange} required rows="3" className="input-field" />
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm tracking-wider uppercase text-dark-300 font-medium mb-2">Price *</label>
                                        <input type="number" name="price" value={formData.price} onChange={handleChange} required step="0.01" className="input-field" />
                                    </div>
                                    <div>
                                        <label className="block text-sm tracking-wider uppercase text-dark-300 font-medium mb-2">Stock *</label>
                                        <input type="number" name="stock" value={formData.stock} onChange={handleChange} required className="input-field" />
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm tracking-wider uppercase text-dark-300 font-medium mb-2">Category *</label>
                                        <input type="text" name="category" value={formData.category} onChange={handleChange} required className="input-field" />
                                    </div>
                                    <div>
                                        <label className="block text-sm tracking-wider uppercase text-dark-300 font-medium mb-2">Rating</label>
                                        <input type="number" name="rating" value={formData.rating} onChange={handleChange} step="0.1" min="0" max="5" className="input-field" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm tracking-wider uppercase text-dark-300 font-medium mb-2">Image URL *</label>
                                    <input type="url" name="image" value={formData.image} onChange={handleChange} required className="input-field" placeholder="https://example.com/image.jpg" />
                                </div>
                                <div className="flex gap-6">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" name="featured" checked={formData.featured} onChange={handleChange} className="w-5 h-5 accent-gold-400" />
                                        <span className="text-ivory font-medium text-sm">Featured</span>
                                    </label>
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" name="top_product" checked={formData.top_product} onChange={handleChange} className="w-5 h-5 accent-gold-400" />
                                        <span className="text-ivory font-medium text-sm">Top Product</span>
                                    </label>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button type="submit" className="btn-primary flex-1">
                                        {editingProduct ? 'Update Product' : 'Create Product'}
                                    </button>
                                    <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Admin
