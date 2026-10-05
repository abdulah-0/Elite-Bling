import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import HeroSlider from '../components/HeroSlider'
import FeaturedProducts from '../components/FeaturedProducts'
import TopProducts from '../components/TopProducts'
import SEO from '../components/SEO'
import { FiShield, FiTruck, FiAward, FiDollarSign, FiUsers, FiStar, FiChevronRight } from 'react-icons/fi'

const Home = () => {
    const [counts, setCounts] = useState({ years: 0, customers: 0, products: 0, partners: 0 })

    useEffect(() => {
        const animateCounts = () => {
            const targets = { years: 10, customers: 5000, products: 1000, partners: 200 }
            const duration = 2000
            const steps = 60
            const interval = duration / steps
            let step = 0

            const timer = setInterval(() => {
                step++
                setCounts({
                    years: Math.min(Math.floor((targets.years / steps) * step), targets.years),
                    customers: Math.min(Math.floor((targets.customers / steps) * step), targets.customers),
                    products: Math.min(Math.floor((targets.products / steps) * step), targets.products),
                    partners: Math.min(Math.floor((targets.partners / steps) * step), targets.partners),
                })
                if (step >= steps) clearInterval(timer)
            }, interval)
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        animateCounts()
                        observer.disconnect()
                    }
                })
            },
            { threshold: 0.3 }
        )

        const el = document.getElementById('stats-section')
        if (el) observer.observe(el)

        return () => observer.disconnect()
    }, [])

    const categories = [
        { name: 'Necklaces', image: '/necklaces.jpg', count: '120+ Designs' },
        { name: 'Earrings', image: '/earrings.jpg', count: '200+ Designs' },
        { name: 'Rings', image: '/rings.jpg', count: '150+ Designs' },
        { name: 'Bracelets', image: '/bracelets.jpg', count: '80+ Designs' },
        { name: 'Bridal Sets', image: '/bridal.jpg', count: '60+ Sets' },
        { name: 'New Arrivals', image: '/new.jpg', count: 'Weekly Drops' },
    ]

    const benefits = [
        { icon: FiDollarSign, title: 'Bulk Discounts', desc: 'Exclusive pricing for bulk orders with increasing discounts at every tier.' },
        { icon: FiTruck, title: 'Nationwide Delivery', desc: 'Free shipping on orders above Rs. 5,000. Fast and secure delivery across Pakistan.' },
        { icon: FiAward, title: 'Premium Quality', desc: 'Every piece is handpicked for its craftsmanship. We ensure consistent quality across all orders.' },
        { icon: FiShield, title: 'Trusted by Resellers', desc: 'Join 200+ trusted boutique owners and resellers who choose Ellite Bling.' },
    ]

    const testimonials = [
        { name: 'Ayesha K.', role: 'Boutique Owner, Lahore', text: 'Ellite Bling has transformed my boutique. The quality is exceptional and my customers love the designs.' },
        { name: 'Fatima Z.', role: 'Online Reseller, Karachi', text: 'The wholesale pricing is unbeatable. I\'ve doubled my profit margins since switching to Ellite Bling.' },
        { name: 'Sana M.', role: 'Wedding Planner, Islamabad', text: 'Their bridal sets are absolutely stunning. My clients always get compliments.' },
    ]

    return (
        <div>
            <SEO
                title="Ellite Bling - Luxury Artificial Jewelry Wholesale in Pakistan"
                description="Shop Pakistan's finest luxury artificial jewelry at wholesale rates. Bridal sets, necklaces, rings, bracelets & earrings with nationwide delivery."
                canonical="https://ellitebling.com/"
            />
            {/* Hero Section */}
            <HeroSlider />

            {/* Featured Categories */}
            <section className="whitespace-section bg-dark-900">
                <div className="container-custom">
                    <div className="text-center mb-16">
                        <span className="text-gold-400 text-sm tracking-[0.3em] uppercase font-medium">Collections</span>
                        <h2 className="section-title mt-4">Shop by Category</h2>
                        <p className="section-subtitle">Explore our curated collections designed for every occasion</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
                        {categories.map((cat, idx) => (
                            <Link
                                key={cat.name}
                                to={`/products?category=${encodeURIComponent(cat.name)}`}
                                className="group relative overflow-hidden card-hover animate-fade-in-up"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div className="aspect-square bg-dark-700 flex items-center justify-center">
                                    <div className="text-center p-6">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-full border border-gold-400/30 flex items-center justify-center group-hover:border-gold-400 group-hover:shadow-[0_0_30px_rgba(212,175,55,0.2)] transition-all duration-500">
                                            <span className="text-2xl text-gold-400 font-heading">{cat.name[0]}</span>
                                        </div>
                                        <h3 className="text-sm md:text-base font-heading font-bold text-ivory group-hover:text-gold-400 transition-colors">
                                            {cat.name}
                                        </h3>
                                        <p className="text-xs text-dark-400 mt-1">{cat.count}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            <FeaturedProducts />

            {/* Best Sellers / Top Products */}
            <TopProducts />

            {/* Wholesale Advantage */}
            <section className="whitespace-section bg-dark-800 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />
                <div className="container-custom">
                    <div className="text-center mb-16">
                        <span className="text-gold-400 text-sm tracking-[0.3em] uppercase font-medium">Why Choose Us</span>
                        <h2 className="section-title mt-4">The Elite Advantage</h2>
                        <p className="section-subtitle">What makes Ellite Bling the preferred choice for resellers</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {benefits.map((benefit, idx) => (
                            <div
                                key={benefit.title}
                                className="card p-8 text-center card-hover animate-fade-in-up"
                                style={{ animationDelay: `${idx * 150}ms` }}
                            >
                                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold-400/10 border border-gold-400/20 flex items-center justify-center">
                                    <benefit.icon className="text-2xl text-gold-400" />
                                </div>
                                <h3 className="text-lg font-heading font-bold text-ivory mb-3">{benefit.title}</h3>
                                <p className="text-dark-300 text-sm leading-relaxed">{benefit.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats / Trust Section */}
            <section id="stats-section" className="whitespace-section bg-dark-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.05)_0%,transparent_70%)]" />
                <div className="container-custom relative z-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                        <div className="text-center animate-fade-in-up">
                            <div className="counter-number">{counts.years}+</div>
                            <p className="text-dark-300 text-sm mt-2 tracking-wider uppercase">Years of Excellence</p>
                        </div>
                        <div className="text-center animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                            <div className="counter-number">{counts.customers.toLocaleString()}+</div>
                            <p className="text-dark-300 text-sm mt-2 tracking-wider uppercase">Happy Customers</p>
                        </div>
                        <div className="text-center animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                            <div className="counter-number">{counts.products}+</div>
                            <p className="text-dark-300 text-sm mt-2 tracking-wider uppercase">Products</p>
                        </div>
                        <div className="text-center animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                            <div className="counter-number">{counts.partners}+</div>
                            <p className="text-dark-300 text-sm mt-2 tracking-wider uppercase">Trusted Partners</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="whitespace-section bg-dark-800">
                <div className="container-custom">
                    <div className="text-center mb-16">
                        <span className="text-gold-400 text-sm tracking-[0.3em] uppercase font-medium">Testimonials</span>
                        <h2 className="section-title mt-4">What Our Partners Say</h2>
                        <p className="section-subtitle">Trusted by resellers and boutique owners across Pakistan</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((t, idx) => (
                            <div
                                key={t.name}
                                className="card p-8 card-hover animate-fade-in-up"
                                style={{ animationDelay: `${idx * 150}ms` }}
                            >
                                <div className="flex mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <FiStar key={i} className="text-gold-400 fill-gold-400 text-sm" />
                                    ))}
                                </div>
                                <p className="text-dark-200 mb-6 leading-relaxed text-sm italic">"{t.text}"</p>
                                <div>
                                    <p className="font-heading font-bold text-ivory">{t.name}</p>
                                    <p className="text-dark-400 text-xs tracking-wider uppercase">{t.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="whitespace-section bg-dark-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.08)_0%,transparent_70%)]" />
                <div className="container-custom text-center relative z-10">
                    <h2 className="text-3xl md:text-5xl font-heading font-bold text-ivory mb-6">
                        Ready to Elevate Your <span className="gold-text">Collection</span>?
                    </h2>
                    <p className="text-lg text-dark-200 mb-10 max-w-2xl mx-auto">
                        Join hundreds of successful resellers who trust Ellite Bling for premium quality jewelry at unbeatable wholesale prices.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/products" className="btn-primary">
                            Shop Collection
                        </Link>
                        <Link to="/wholesale" className="btn-secondary">
                            Become a Partner
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Home
