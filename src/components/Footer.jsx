import { Link } from 'react-router-dom'
import { FiMail, FiPhone, FiMapPin, FiInstagram, FiFacebook } from 'react-icons/fi'

const Footer = () => {
    return (
        <footer className="bg-dark-900 text-ivory border-t border-gold-400/10">
            {/* Newsletter */}
            <div className="border-b border-gold-400/10">
                <div className="container-custom py-12 md:py-16">
                    <div className="max-w-2xl mx-auto text-center">
                        <h3 className="text-2xl md:text-3xl font-heading font-bold mb-4">
                            Join the <span className="gold-text">Elite</span> Circle
                        </h3>
                        <p className="text-dark-300 mb-8 text-lg">
                            Subscribe for exclusive wholesale deals, early access to new collections, and VIP perks.
                        </p>
                        <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                            <input
                                type="email"
                                placeholder="Your email address"
                                className="flex-1 px-6 py-3.5 bg-dark-700/50 border border-gold-400/20 text-ivory placeholder:text-dark-400 focus:outline-none focus:border-gold-400 transition-colors"
                            />
                            <button type="submit" className="btn-primary whitespace-nowrap">
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <div className="container-custom py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                    {/* Brand */}
                    <div className="lg:col-span-1">
                        <Link to="/" className="inline-block mb-6">
                            <span className="text-2xl font-heading font-bold gold-text tracking-wider">Elite Bling</span>
                        </Link>
                        <p className="text-dark-300 mb-6 leading-relaxed">
                            Your premier destination for luxury artificial jewelry at wholesale prices. 
                            Elevate your collection with our exquisite designs.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="w-10 h-10 border border-gold-400/20 flex items-center justify-center text-gold-400 hover:bg-gold-400 hover:text-dark-900 transition-all duration-300">
                                <FiInstagram />
                            </a>
                            <a href="#" className="w-10 h-10 border border-gold-400/20 flex items-center justify-center text-gold-400 hover:bg-gold-400 hover:text-dark-900 transition-all duration-300">
                                <FiFacebook />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-sm tracking-widest uppercase text-gold-400 font-semibold mb-6">Quick Links</h4>
                        <ul className="space-y-3">
                            <li><Link to="/" className="text-dark-300 hover:text-gold-400 transition-colors text-sm">Home</Link></li>
                            <li><Link to="/products" className="text-dark-300 hover:text-gold-400 transition-colors text-sm">All Products</Link></li>
                            <li><Link to="/products?category=New%20Arrivals" className="text-dark-300 hover:text-gold-400 transition-colors text-sm">New Arrivals</Link></li>
                            <li><Link to="/products?category=Bridal%20Sets" className="text-dark-300 hover:text-gold-400 transition-colors text-sm">Bridal Sets</Link></li>
                            <li><Link to="/wholesale" className="text-dark-300 hover:text-gold-400 transition-colors text-sm">Wholesale Program</Link></li>
                        </ul>
                    </div>

                    {/* Categories */}
                    <div>
                        <h4 className="text-sm tracking-widest uppercase text-gold-400 font-semibold mb-6">Categories</h4>
                        <ul className="space-y-3">
                            <li><Link to="/products?category=Necklaces" className="text-dark-300 hover:text-gold-400 transition-colors text-sm">Necklaces</Link></li>
                            <li><Link to="/products?category=Earrings" className="text-dark-300 hover:text-gold-400 transition-colors text-sm">Earrings</Link></li>
                            <li><Link to="/products?category=Rings" className="text-dark-300 hover:text-gold-400 transition-colors text-sm">Rings</Link></li>
                            <li><Link to="/products?category=Bracelets" className="text-dark-300 hover:text-gold-400 transition-colors text-sm">Bracelets</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-sm tracking-widest uppercase text-gold-400 font-semibold mb-6">Contact</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start space-x-3 text-dark-300">
                                <FiMail className="text-gold-400 mt-1 shrink-0" />
                                <span className="text-sm">elitebling@gmail.com</span>
                            </li>
                            <li className="flex items-start space-x-3 text-dark-300">
                                <FiPhone className="text-gold-400 mt-1 shrink-0" />
                                <span className="text-sm">+923290987690</span>
                            </li>
                            <li className="flex items-start space-x-3 text-dark-300">
                                <FiMapPin className="text-gold-400 mt-1 shrink-0" />
                                <span className="text-sm">House#43, Street#2, Extension Gulzar e Quaid, Rawalpindi</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gold-400/10 mt-12 pt-8 flex flex-col lg:flex-row items-center justify-between gap-6">
                    <p className="text-dark-400 text-sm text-center lg:text-left order-3 lg:order-1">
                        &copy; {new Date().getFullYear()} Elite Bling. All rights reserved.
                    </p>
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-dark-300 order-1 lg:order-2">
                        <Link to="/privacy-policy" className="hover:text-gold-400 transition-colors">Privacy Policy</Link>
                        <Link to="/terms-conditions" className="hover:text-gold-400 transition-colors">Terms & Conditions</Link>
                        <Link to="/shipping-policy" className="hover:text-gold-400 transition-colors">Shipping Policy</Link>
                        <Link to="/refund-policy" className="hover:text-gold-400 transition-colors">Returns & Refunds</Link>
                    </div>
                    <div className="flex items-center space-x-6 text-sm text-dark-400 order-2 lg:order-3">
                        <span className="tracking-widest uppercase text-gold-400/60">Luxury Redefined</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
