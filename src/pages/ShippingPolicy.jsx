import React from 'react'
import { FiTruck, FiClock, FiMapPin, FiPackage } from 'react-icons/fi'

const ShippingPolicy = () => {
    return (
        <div className="bg-dark-800 text-ivory min-h-screen py-16 md:py-24 animate-fade-in">
            <div className="container-custom">
                {/* Header Section */}
                <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in-up">
                    <h1 className="text-4xl md:text-6xl font-heading font-bold mb-4">
                        Shipping & <span className="gold-text">Service</span>
                    </h1>
                    <p className="text-dark-300 text-lg leading-relaxed">
                        We deliver our premium artificial jewelry safely and promptly across Pakistan. 
                        Learn about our rates, timelines, and shipping options.
                    </p>
                    <div className="gold-divider mt-8"></div>
                </div>

                {/* Content Cards */}
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Processing Times */}
                    <div className="card p-8 md:p-10 animate-fade-in-up animate-delay-100">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="p-3 bg-gold-400/10 border border-gold-400/20 text-gold-400">
                                <FiClock size={24} />
                            </div>
                            <h2 className="text-2xl font-heading font-semibold text-ivory">Processing & Dispatch Times</h2>
                        </div>
                        <div className="space-y-4 text-dark-200 leading-relaxed text-sm md:text-base">
                            <p>
                                Every piece of jewelry undergoes a rigorous quality inspection before leaving our warehouse in Islamabad.
                            </p>
                            <ul className="list-disc list-inside pl-4 space-y-2 text-dark-300">
                                <li><strong>Retail Orders:</strong> Dispatched within 1–2 business days.</li>
                                <li><strong>Wholesale Orders:</strong> Dispatched within 3–5 business days, depending on order size and custom packaging requirements.</li>
                            </ul>
                            <p className="text-xs text-dark-400 italic">
                                *Note: Orders placed on Sundays or public holidays will begin processing the next business day.
                            </p>
                        </div>
                    </div>

                    {/* Delivery Timelines */}
                    <div className="card p-8 md:p-10 animate-fade-in-up animate-delay-200">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="p-3 bg-gold-400/10 border border-gold-400/20 text-gold-400">
                                <FiMapPin size={24} />
                            </div>
                            <h2 className="text-2xl font-heading font-semibold text-ivory">Delivery Estimates</h2>
                        </div>
                        <div className="space-y-4 text-dark-200 leading-relaxed text-sm md:text-base">
                            <p>
                                We partner with leading courier services in Pakistan (TCS, Leopards, Trax) to ensure secure delivery. Typical transit times after dispatch:
                            </p>
                            <ul className="list-disc list-inside pl-4 space-y-2 text-dark-300">
                                <li><strong>Twin Cities (Islamabad/Rawalpindi):</strong> 1–2 business days.</li>
                                <li><strong>Major Cities (Lahore, Karachi, Peshawar, Multan, Faisalabad, Gujranwala):</strong> 2–4 business days.</li>
                                <li><strong>Other Cities & Remote Areas:</strong> 4–7 business days.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Shipping Rates */}
                    <div className="card p-8 md:p-10 animate-fade-in-up animate-delay-300">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="p-3 bg-gold-400/10 border border-gold-400/20 text-gold-400">
                                <FiTruck size={24} />
                            </div>
                            <h2 className="text-2xl font-heading font-semibold text-ivory">Shipping Costs</h2>
                        </div>
                        <div className="space-y-4 text-dark-200 leading-relaxed text-sm md:text-base">
                            <p>
                                We offer flat-rate and value-based free shipping options:
                            </p>
                            <ul className="list-disc list-inside pl-4 space-y-2 text-dark-300">
                                <li><strong>Retail Standard Shipping:</strong> Flat rate of PKR 250 nationwide.</li>
                                <li><strong>Free Retail Shipping:</strong> Free shipping on all retail orders above PKR 3,000.</li>
                                <li><strong>Wholesale Shipping:</strong> Calculated based on weight and volume at checkout. Free shipping is provided for wholesale orders exceeding PKR 15,000.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Tracking & Damage */}
                    <div className="card p-8 md:p-10 animate-fade-in-up animate-delay-400">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="p-3 bg-gold-400/10 border border-gold-400/20 text-gold-400">
                                <FiPackage size={24} />
                            </div>
                            <h2 className="text-2xl font-heading font-semibold text-ivory">Tracking & Damaged Shipments</h2>
                        </div>
                        <div className="space-y-4 text-dark-200 leading-relaxed text-sm md:text-base">
                            <p>
                                **Tracking:** Once your order is shipped, a SMS and email containing the tracking number will be sent to you. You can monitor your package status via the respective courier's website.
                            </p>
                            <p>
                                **Transit Damage:** Although we pack all jewelry in premium boxes with bubble wrap, damage can occasionally occur. If you receive a damaged package, take photos and videos of the unopened box and the damaged product inside. Contact us within 48 hours, and we will issue a replacement or store credit.
                            </p>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="text-center pt-8 text-dark-300">
                        <p className="mb-2">Need assistance with your package or have custom service requests? We are here to help:</p>
                        <p className="text-gold-400 font-semibold font-heading">ellitebling@gmail.com | +923290987690</p>
                        <p className="text-xs text-dark-400 mt-4">Last Updated: July 10, 2026</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ShippingPolicy
