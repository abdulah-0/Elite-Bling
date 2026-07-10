import { Link } from 'react-router-dom'
import { FiShield, FiAward, FiHeart, FiStar } from 'react-icons/fi'

const About = () => {
    return (
        <div className="py-16 md:py-20">
            <div className="container-custom">
                {/* Header */}
                <div className="text-center mb-20">
                    <span className="text-gold-400 text-sm tracking-[0.3em] uppercase font-medium">Our Story</span>
                    <h1 className="section-title mt-4">The Elite Bling Story</h1>
                    <p className="section-subtitle">Redefining luxury artificial jewelry for the modern reseller</p>
                </div>

                {/* Brand Story */}
                <div className="grid md:grid-cols-2 gap-16 mb-20 items-center">
                    <div className="animate-fade-in-up">
                        <h2 className="text-3xl md:text-4xl font-heading font-bold text-ivory mb-6">
                            Where <span className="gold-text">Elegance</span> Meets Affordability
                        </h2>
                        <p className="text-dark-300 mb-6 leading-relaxed">
                            Elite Bling was born from a vision to democratize luxury jewelry. We believe that 
                            elegance and sophistication should be accessible to everyone, not just a select few. 
                            Our mission is to provide premium quality artificial jewelry at wholesale prices, 
                            empowering resellers and boutique owners to offer their customers exceptional pieces 
                            without the luxury markup.
                        </p>
                        <p className="text-dark-300 mb-6 leading-relaxed">
                            Every piece in our collection is carefully curated and crafted to meet the highest 
                            standards of quality and design. From timeless classics to contemporary trends, 
                            our jewelry is designed to make every woman feel extraordinary.
                        </p>
                        <Link to="/products" className="btn-primary">
                            Explore Collection
                        </Link>
                    </div>
                    <div className="bg-dark-700/50 border border-gold-400/10 p-12 flex items-center justify-center animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                        <div className="text-center">
                            <FiStar className="text-6xl text-gold-400 mx-auto mb-4" />
                            <div className="text-5xl md:text-7xl font-heading font-bold gold-text mb-2">10+</div>
                            <p className="text-lg text-dark-200">Years of Excellence</p>
                        </div>
                    </div>
                </div>

                {/* Mission Statement */}
                <div className="relative overflow-hidden mb-20 p-12 md:p-16 text-center" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(15,15,15,1) 50%, rgba(212,175,55,0.05) 100%)', border: '1px solid rgba(212,175,55,0.2)' }}>
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/50 to-transparent" />
                    <h2 className="text-3xl md:text-4xl font-heading font-bold text-ivory mb-6">Our Mission</h2>
                    <p className="text-lg md:text-xl text-dark-200 max-w-4xl mx-auto leading-relaxed">
                        To empower resellers and boutique owners with access to premium artificial jewelry 
                        at wholesale prices, enabling them to build successful businesses while offering 
                        their customers uncompromising quality and style.
                    </p>
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/50 to-transparent" />
                </div>

                {/* Values */}
                <div className="grid md:grid-cols-3 gap-8 mb-20">
                    <div className="card p-8 text-center card-hover animate-fade-in-up">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold-400/10 border border-gold-400/20 flex items-center justify-center">
                            <FiAward className="text-2xl text-gold-400" />
                        </div>
                        <h3 className="text-xl font-heading font-bold text-ivory mb-3">Premium Quality</h3>
                        <p className="text-dark-300 text-sm leading-relaxed">
                            Every piece is handpicked and rigorously inspected to ensure consistent quality across all orders.
                        </p>
                    </div>
                    <div className="card p-8 text-center card-hover animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold-400/10 border border-gold-400/20 flex items-center justify-center">
                            <FiHeart className="text-2xl text-gold-400" />
                        </div>
                        <h3 className="text-xl font-heading font-bold text-ivory mb-3">Trusted Partnership</h3>
                        <p className="text-dark-300 text-sm leading-relaxed">
                            We build lasting relationships with our resellers through reliability, transparency, and exceptional support.
                        </p>
                    </div>
                    <div className="card p-8 text-center card-hover animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold-400/10 border border-gold-400/20 flex items-center justify-center">
                            <FiShield className="text-2xl text-gold-400" />
                        </div>
                        <h3 className="text-xl font-heading font-bold text-ivory mb-3">Wholesale Value</h3>
                        <p className="text-dark-300 text-sm leading-relaxed">
                            Unbeatable wholesale pricing that enables you to maximize your profit margins while offering premium products.
                        </p>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="border border-gold-400/10 bg-dark-800/50 p-8 md:p-12">
                    <h2 className="text-2xl md:text-3xl font-heading font-bold text-ivory mb-8 text-center">Get In Touch</h2>
                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        <div>
                            <h3 className="text-sm tracking-widest uppercase text-gold-400 font-semibold mb-2">Email</h3>
                            <p className="text-dark-200">elitebling@gmail.com</p>
                        </div>
                        <div>
                            <h3 className="text-sm tracking-widest uppercase text-gold-400 font-semibold mb-2">Phone</h3>
                            <p className="text-dark-200">+923290987690</p>
                        </div>
                        <div>
                            <h3 className="text-sm tracking-widest uppercase text-gold-400 font-semibold mb-2">Location</h3>
                            <p className="text-dark-200">House#43, Street#2, Extension Gulzar e Quaid, Rawalpindi</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default About
