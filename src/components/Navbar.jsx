import { Link, useNavigate } from 'react-router-dom'
import { FiShoppingCart, FiUser, FiMenu, FiX, FiSearch, FiHeart, FiChevronDown } from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import CartDrawer from './CartDrawer'

const categories = [
    { name: 'Necklaces', path: '/products?category=Necklaces' },
    { name: 'Earrings', path: '/products?category=Earrings' },
    { name: 'Rings', path: '/products?category=Rings' },
    { name: 'Bracelets', path: '/products?category=Bracelets' },
    { name: 'Bridal Sets', path: '/products?category=Bridal%20Sets' },
    { name: 'New Arrivals', path: '/products?sort=newest' },
]

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const { getCartCount, setIsCartOpen } = useCart()
    const { user, signOut, isAdmin } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleSignOut = async () => {
        await signOut()
    }

    const handleSearch = (e) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery)}`)
            setSearchOpen(false)
            setSearchQuery('')
        }
    }

    return (
        <>
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'bg-dark-900/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
                {/* Top Bar */}
                <div className={`hidden md:flex items-center justify-center h-9 text-xs tracking-widest uppercase border-b border-gold-400/10 transition-all duration-500 ${isScrolled ? 'h-0 overflow-hidden opacity-0' : 'h-9 opacity-100'}`}>
                    <span className="text-gold-400">Luxury Artificial Jewelry at Wholesale Prices</span>
                </div>

                <div className="container-custom">
                    <div className={`flex items-center justify-between transition-all duration-500 ${isScrolled ? 'h-16' : 'h-20 md:h-24'}`}>
                        {/* Logo */}
                        <Link to="/" className="flex items-center space-x-2">
                            <span className={`font-heading font-bold gold-text tracking-wider transition-all duration-500 ${isScrolled ? 'text-xl' : 'text-2xl md:text-3xl'}`}>
                                Ellite Bling
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex items-center space-x-8">
                            <Link to="/" className="nav-link">Home</Link>
                            <div
                                className="relative"
                                onMouseEnter={() => setIsMegaMenuOpen(true)}
                                onMouseLeave={() => setIsMegaMenuOpen(false)}
                            >
                                <button className="nav-link flex items-center space-x-1">
                                    <span>Categories</span>
                                    <FiChevronDown className={`text-xs transition-transform duration-300 ${isMegaMenuOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isMegaMenuOpen && (
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[600px] glass-gold rounded-none animate-fade-in-down">
                                        <div className="grid grid-cols-3 gap-6 p-8">
                                            {categories.map((cat) => (
                                                <Link
                                                    key={cat.name}
                                                    to={cat.path}
                                                    className="group flex flex-col items-center text-center p-4 hover:bg-gold-400/5 transition-colors"
                                                    onClick={() => setIsMegaMenuOpen(false)}
                                                >
                                                    <div className="w-16 h-16 rounded-full border border-gold-400/30 flex items-center justify-center mb-3 group-hover:border-gold-400 group-hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all duration-300">
                                                        <span className="text-gold-400 text-lg font-heading">{cat.name[0]}</span>
                                                    </div>
                                                    <span className="text-sm text-ivory font-medium">{cat.name}</span>
                                                </Link>
                                            ))}
                                        </div>
                                        <div className="border-t border-gold-400/10 p-4 text-center">
                                            <Link
                                                to="/products"
                                                className="text-gold-400 text-sm hover:text-gold-300 transition-colors tracking-wider uppercase"
                                                onClick={() => setIsMegaMenuOpen(false)}
                                            >
                                                View All Collections →
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <Link to="/products" className="nav-link">Products</Link>
                            <Link to="/wholesale" className="nav-link">Wholesale</Link>
                            <Link to="/about" className="nav-link">About</Link>
                            {isAdmin() && (
                                <Link to="/admin" className="nav-link">Admin</Link>
                            )}
                        </div>

                        {/* Right Side Icons */}
                        <div className="flex items-center space-x-3 md:space-x-4">
                            {/* Search */}
                            <button
                                onClick={() => setSearchOpen(!searchOpen)}
                                className="p-2 text-dark-200 hover:text-gold-400 transition-colors"
                            >
                                <FiSearch className="text-xl" />
                            </button>

                            {/* Wishlist */}
                            <Link to="/products" className="hidden md:block p-2 text-dark-200 hover:text-gold-400 transition-colors">
                                <FiHeart className="text-xl" />
                            </Link>

                            {/* Cart Icon */}
                            <button
                                onClick={() => setIsCartOpen(true)}
                                className="relative p-2 text-dark-200 hover:text-gold-400 transition-colors"
                            >
                                <FiShoppingCart className="text-xl" />
                                {getCartCount() > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-gold-400 text-dark-900 text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                                        {getCartCount()}
                                    </span>
                                )}
                            </button>

                            {/* User Menu */}
                            {user ? (
                                <div className="hidden md:flex items-center space-x-3">
                                    <button
                                        onClick={handleSignOut}
                                        className="text-sm text-dark-200 hover:text-gold-400 transition-colors tracking-wider"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    to="/login"
                                    className="hidden md:flex items-center space-x-1 text-dark-200 hover:text-gold-400 transition-colors"
                                >
                                    <FiUser className="text-xl" />
                                </Link>
                            )}

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="lg:hidden p-2 text-ivory"
                            >
                                {isMenuOpen ? <FiX className="text-2xl" /> : <FiMenu className="text-2xl" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search Overlay */}
                {searchOpen && (
                    <div className="border-t border-gold-400/10 bg-dark-900/95 backdrop-blur-md animate-slide-down">
                        <div className="container-custom py-4">
                            <form onSubmit={handleSearch} className="flex items-center">
                                <FiSearch className="text-gold-400 text-xl mr-4" />
                                <input
                                    type="text"
                                    placeholder="Search jewelry..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="flex-1 bg-transparent text-ivory placeholder:text-dark-400 text-lg outline-none border-none"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setSearchOpen(false)}
                                    className="text-dark-400 hover:text-ivory transition-colors"
                                >
                                    <FiX className="text-xl" />
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="lg:hidden bg-dark-900/98 backdrop-blur-md border-t border-gold-400/10 animate-slide-down">
                        <div className="container-custom py-6">
                            <div className="flex flex-col space-y-4">
                                <Link to="/" className="text-ivory hover:text-gold-400 transition-colors py-2 tracking-wider uppercase text-sm" onClick={() => setIsMenuOpen(false)}>Home</Link>
                                <Link to="/products" className="text-ivory hover:text-gold-400 transition-colors py-2 tracking-wider uppercase text-sm" onClick={() => setIsMenuOpen(false)}>Products</Link>
                                <Link to="/wholesale" className="text-ivory hover:text-gold-400 transition-colors py-2 tracking-wider uppercase text-sm" onClick={() => setIsMenuOpen(false)}>Wholesale Program</Link>
                                <Link to="/about" className="text-ivory hover:text-gold-400 transition-colors py-2 tracking-wider uppercase text-sm" onClick={() => setIsMenuOpen(false)}>About Us</Link>
                                <div className="border-t border-gold-400/10 pt-4">
                                    <p className="text-dark-400 text-xs tracking-widest uppercase mb-3">Categories</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {categories.map((cat) => (
                                            <Link
                                                key={cat.name}
                                                to={cat.path}
                                                className="text-dark-200 hover:text-gold-400 transition-colors py-1.5 text-sm"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                {cat.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                                {isAdmin() && (
                                    <Link to="/admin" className="text-ivory hover:text-gold-400 transition-colors py-2 tracking-wider uppercase text-sm" onClick={() => setIsMenuOpen(false)}>Admin</Link>
                                )}
                                {user ? (
                                    <button
                                        onClick={() => { handleSignOut(); setIsMenuOpen(false) }}
                                        className="text-left text-dark-200 hover:text-gold-400 transition-colors py-2 tracking-wider uppercase text-sm"
                                    >
                                        Sign Out
                                    </button>
                                ) : (
                                    <Link to="/login" className="text-ivory hover:text-gold-400 transition-colors py-2 tracking-wider uppercase text-sm" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Spacer for fixed navbar */}
            <div className={`transition-all duration-500 ${isScrolled ? 'h-16' : 'h-20 md:h-28'}`} />

            <CartDrawer />
        </>
    )
}

export default Navbar
