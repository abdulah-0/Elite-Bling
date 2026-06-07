import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiShield, FiTruck, FiAward, FiDollarSign, FiUsers, FiStar, FiCheck, FiChevronDown } from 'react-icons/fi'

const Wholesale = () => {
    const [openFaq, setOpenFaq] = useState(null)
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        storeName: '',
        storeType: '',
        message: ''
    })
    const [submitted, setSubmitted] = useState(false)

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        setSubmitted(true)
    }

    const benefits = [
        { icon: FiDollarSign, title: 'Tiered Pricing', desc: 'Earn more with higher volume. Discounts from 10% to 30% depending on order quantity.' },
        { icon: FiTruck, title: 'Free Shipping', desc: 'Free nationwide delivery on orders above Rs. 5,000. Express shipping options available.' },
        { icon: FiAward, title: 'Premium Quality', desc: 'Consistent quality across all batches. Each piece inspected before dispatch.' },
        { icon: FiUsers, title: 'Dedicated Support', desc: 'Personal account manager for orders above Rs. 50,000. Priority customer service.' },
        { icon: FiStar, title: 'Early Access', desc: 'Get early access to new collections before public launch. Seasonal previews.' },
        { icon: FiShield, title: 'Easy Returns', desc: 'Hassle-free returns within 7 days. Quality guarantee on every order.' },
    ]

    const pricingTiers = [
        { min: '10-49', discount: '10%', label: 'Starter' },
        { min: '50-99', discount: '15%', label: 'Business' },
        { min: '100-499', discount: '20%', label: 'Premium' },
        { min: '500+', discount: '30%', label: 'Elite' },
    ]

    const faqs = [
        { q: 'What is the minimum order quantity?', a: 'The minimum order quantity (MOQ) is 10 pieces per design. You can mix and match different designs to reach the minimum.' },
        { q: 'How long does delivery take?', a: 'Standard delivery takes 3-5 business days nationwide. Express delivery (1-2 days) is available at an additional cost.' },
        { q: 'Can I return products?', a: 'Yes, you can return products within 7 days of delivery. Products must be unused and in original packaging.' },
        { q: 'Do you offer sample orders?', a: 'Yes, we offer sample orders for new partners. Contact us to request samples before bulk ordering.' },
        { q: 'How do I become a wholesale partner?', a: 'Simply fill out the registration form below. Our team will review your application and get back to you within 24-48 hours.' },
        { q: 'What payment methods do you accept?', a: 'We accept Cash on Delivery (COD), bank transfers, and Easypaisa/JazzCash for wholesale orders.' },
    ]

    return (
        <div>
            {/* Hero */}
            <section className="relative min-h-[60vh] flex items-center bg-dark-900 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.08)_0%,transparent_70%)]" />
                <div className="absolute top-10 left-10 w-48 h-48 border border-gold-400/10 rotate-45" />
                <div className="absolute bottom-10 right-10 w-64 h-64 border border-gold-400/5 rotate-12" />
                <div className="container-custom relative z-10">
                    <div className="max-w-3xl animate-fade-in-up">
                        <span className="text-gold-400 text-sm tracking-[0.3em] uppercase font-medium border-l-2 border-gold-400 pl-4">Wholesale Program</span>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-ivory mt-6 mb-6 leading-tight">
                            Partner with <span className="gold-text">Elite Bling</span>
                        </h1>
                        <p className="text-lg md:text-xl text-dark-200 mb-10 max-w-xl">
                            Join 200+ resellers and boutique owners who trust us for premium quality jewelry at unbeatable wholesale prices.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <a href="#register" className="btn-primary text-center">
                                Register Now
                            </a>
                            <a href="#benefits" className="btn-secondary text-center">
                                View Benefits
                            </a>
                        </div>
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/50 to-transparent" />
            </section>

            {/* Pricing Tiers */}
            <section className="whitespace-section bg-dark-800">
                <div className="container-custom">
                    <div className="text-center mb-16">
                        <span className="text-gold-400 text-sm tracking-[0.3em] uppercase font-medium">Pricing</span>
                        <h2 className="section-title mt-4">Wholesale Pricing Tiers</h2>
                        <p className="section-subtitle">The more you order, the more you save</p>
                    </div>
                    <div className="grid md:grid-cols-4 gap-6">
                        {pricingTiers.map((tier, idx) => (
                            <div key={tier.label} className={`card p-8 text-center card-hover animate-fade-in-up ${idx === 3 ? 'border-gold-400' : ''}`} style={{ animationDelay: `${idx * 100}ms` }}>
                                {idx === 3 && <span className="text-xs tracking-widest uppercase text-gold-400 font-semibold mb-2 block">Best Value</span>}
                                <h3 className="text-2xl font-heading font-bold text-gold-400 mb-2">{tier.label}</h3>
                                <p className="text-sm text-dark-400 mb-4">Qty: {tier.min}</p>
                                <div className="text-4xl font-heading font-bold text-ivory mb-2">{tier.discount}</div>
                                <p className="text-xs text-dark-400 uppercase tracking-wider">Discount</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section id="benefits" className="whitespace-section bg-dark-900">
                <div className="container-custom">
                    <div className="text-center mb-16">
                        <span className="text-gold-400 text-sm tracking-[0.3em] uppercase font-medium">Benefits</span>
                        <h2 className="section-title mt-4">Why Partner With Us</h2>
                        <p className="section-subtitle">Everything you need to grow your jewelry business</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {benefits.map((b, idx) => (
                            <div key={b.title} className="card p-8 card-hover animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
                                <div className="w-12 h-12 mb-4 rounded-full bg-gold-400/10 border border-gold-400/20 flex items-center justify-center">
                                    <b.icon className="text-xl text-gold-400" />
                                </div>
                                <h3 className="text-lg font-heading font-bold text-ivory mb-2">{b.title}</h3>
                                <p className="text-dark-300 text-sm leading-relaxed">{b.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="whitespace-section bg-dark-800">
                <div className="container-custom max-w-3xl">
                    <div className="text-center mb-16">
                        <span className="text-gold-400 text-sm tracking-[0.3em] uppercase font-medium">FAQ</span>
                        <h2 className="section-title mt-4">Frequently Asked Questions</h2>
                    </div>
                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <div key={idx} className="card">
                                <button
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                    className="w-full p-6 flex items-center justify-between text-left"
                                >
                                    <span className="text-ivory font-heading font-bold">{faq.q}</span>
                                    <FiChevronDown className={`text-gold-400 transition-transform duration-300 shrink-0 ${openFaq === idx ? 'rotate-180' : ''}`} />
                                </button>
                                {openFaq === idx && (
                                    <div className="px-6 pb-6 text-dark-300 text-sm leading-relaxed animate-slide-down">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Registration Form */}
            <section id="register" className="whitespace-section bg-dark-900">
                <div className="container-custom max-w-2xl">
                    <div className="text-center mb-12">
                        <span className="text-gold-400 text-sm tracking-[0.3em] uppercase font-medium">Apply Now</span>
                        <h2 className="section-title mt-4">Become a Wholesale Partner</h2>
                        <p className="section-subtitle">Fill out the form and our team will get back to you within 24-48 hours</p>
                    </div>

                    {submitted ? (
                        <div className="card p-10 text-center animate-fade-in-up">
                            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                                <FiCheck className="text-3xl text-green-500" />
                            </div>
                            <h3 className="text-2xl font-heading font-bold text-ivory mb-4">Application Submitted!</h3>
                            <p className="text-dark-300 mb-6">Thank you for your interest in partnering with Elite Bling. Our team will review your application and contact you within 24-48 hours.</p>
                            <Link to="/" className="btn-primary">
                                Return Home
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="card p-8 md:p-10 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm tracking-wider uppercase text-dark-300 font-medium mb-2">Full Name *</label>
                                    <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-sm tracking-wider uppercase text-dark-300 font-medium mb-2">Email *</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} required className="input-field" />
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm tracking-wider uppercase text-dark-300 font-medium mb-2">Phone *</label>
                                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-sm tracking-wider uppercase text-dark-300 font-medium mb-2">Store/Business Name</label>
                                    <input type="text" name="storeName" value={formData.storeName} onChange={handleChange} className="input-field" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm tracking-wider uppercase text-dark-300 font-medium mb-2">Store Type</label>
                                <select name="storeType" value={formData.storeType} onChange={handleChange} className="input-field">
                                    <option value="">Select type...</option>
                                    <option value="boutique">Boutique</option>
                                    <option value="online">Online Store</option>
                                    <option value="social">Social Media Seller</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm tracking-wider uppercase text-dark-300 font-medium mb-2">Message (Optional)</label>
                                <textarea name="message" value={formData.message} onChange={handleChange} rows="4" className="input-field" placeholder="Tell us about your business..." />
                            </div>
                            <button type="submit" className="btn-primary w-full">
                                Submit Application
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </div>
    )
}

export default Wholesale
