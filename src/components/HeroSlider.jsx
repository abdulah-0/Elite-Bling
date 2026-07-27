import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const slides = [
    {
        id: 1,
        title: 'Luxury Jewelry',
        subtitle: 'at Wholesale Prices',
        description: 'Premium artificial jewelry crafted for the discerning reseller',
        cta: 'Shop Collection',
        cta2: 'Become a Partner',
        cta2Link: '/wholesale',
        bgGradient: 'from-dark-900 via-dark-800 to-dark-900'
    },
    {
        id: 2,
        title: 'Timeless Elegance',
        subtitle: 'for Every Occasion',
        description: 'Discover our exclusive bridal and fashion collections',
        cta: 'Explore Collection',
        cta2: 'View Bridal Sets',
        cta2Link: '/products?category=Bridal%20Sets',
        bgGradient: 'from-dark-900 via-dark-800 to-dark-900'
    },
    {
        id: 3,
        title: 'Wholesale Excellence',
        subtitle: 'Trusted by Resellers',
        description: 'Join hundreds of boutique owners who trust Ellite Bling',
        cta: 'Shop Wholesale',
        cta2: 'Learn More',
        cta2Link: '/wholesale',
        bgGradient: 'from-dark-900 via-dark-800 to-dark-900'
    }
]

const HeroSlider = () => {
    const [currentSlide, setCurrentSlide] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length)
        }, 6000)
        return () => clearInterval(timer)
    }, [])

    const goToSlide = (index) => {
        setCurrentSlide(index)
    }

    return (
        <div className="relative h-screen min-h-[600px] max-h-[900px] overflow-hidden">
            {slides.map((slide, index) => (
                <div
                    key={slide.id}
                    className={`absolute inset-0 transition-all duration-1000 ${index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
                >
                    <div className={`h-full bg-gradient-to-br ${slide.bgGradient} flex items-center relative`}>
                        {/* Decorative elements */}
                        <div className="absolute top-20 left-10 w-32 h-32 border border-gold-400/10 rotate-45" />
                        <div className="absolute bottom-20 right-10 w-48 h-48 border border-gold-400/5 rotate-12" />
                        <div className="absolute top-1/3 right-1/4 w-0.5 h-32 bg-gradient-to-b from-transparent via-gold-400/30 to-transparent" />
                        <div className="absolute bottom-1/3 left-1/4 w-0.5 h-32 bg-gradient-to-b from-transparent via-gold-400/20 to-transparent" />

                        <div className="container-custom relative z-10">
                            <div className="max-w-3xl">
                                <div className={`transition-all duration-1000 delay-200 ${index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                                    <span className="inline-block text-gold-400 text-sm md:text-base tracking-[0.3em] uppercase mb-6 font-medium border-l-2 border-gold-400 pl-4">
                                        {slide.subtitle}
                                    </span>
                                </div>
                                <h1 className={`text-5xl md:text-7xl lg:text-8xl font-heading font-bold text-ivory mb-6 leading-tight transition-all duration-1000 delay-400 ${index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                                    {slide.title}
                                </h1>
                                <p className={`text-lg md:text-xl text-dark-200 mb-10 max-w-xl leading-relaxed transition-all duration-1000 delay-600 ${index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                                    {slide.description}
                                </p>
                                <div className={`flex flex-col sm:flex-row gap-4 transition-all duration-1000 delay-800 ${index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                                    <Link to="/products" className="btn-primary text-center">
                                        {slide.cta}
                                    </Link>
                                    <Link to={slide.cta2Link} className="btn-secondary text-center">
                                        {slide.cta2}
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Gold accent line at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/50 to-transparent" />
                    </div>
                </div>
            ))}

            {/* Slide Indicators */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 z-20">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`transition-all duration-500 ${index === currentSlide
                            ? 'w-12 h-0.5 bg-gold-400'
                            : 'w-8 h-0.5 bg-ivory/30 hover:bg-ivory/60'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    )
}

export default HeroSlider
