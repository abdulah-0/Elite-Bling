import React from 'react'
import { FiRefreshCw, FiAlertTriangle, FiCheckCircle, FiDollarSign } from 'react-icons/fi'

const RefundPolicy = () => {
    return (
        <div className="bg-dark-800 text-ivory min-h-screen py-16 md:py-24 animate-fade-in">
            <div className="container-custom">
                {/* Header Section */}
                <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in-up">
                    <h1 className="text-4xl md:text-6xl font-heading font-bold mb-4">
                        Return & <span className="gold-text">Refund</span> Policy
                    </h1>
                    <p className="text-dark-300 text-lg leading-relaxed">
                        We want you to be completely satisfied with your Elite Bling pieces. 
                        Read our simple guidelines for returns, exchanges, and refunds.
                    </p>
                    <div className="gold-divider mt-8"></div>
                </div>

                {/* Content Cards */}
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* General Return Guidelines */}
                    <div className="card p-8 md:p-10 animate-fade-in-up animate-delay-100">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="p-3 bg-gold-400/10 border border-gold-400/20 text-gold-400">
                                <FiRefreshCw size={24} />
                            </div>
                            <h2 className="text-2xl font-heading font-semibold text-ivory">Return Window & Eligibility</h2>
                        </div>
                        <div className="space-y-4 text-dark-200 leading-relaxed text-sm md:text-base">
                            <p>
                                We offer a **7-day return/exchange policy** for all retail purchases, counting from the day your package is marked as delivered by the courier.
                            </p>
                            <p>
                                To be eligible for a return or exchange:
                            </p>
                            <ul className="list-disc list-inside pl-4 space-y-2 text-dark-300">
                                <li>The jewelry piece must be unused, unworn, and in the same condition that you received it.</li>
                                <li>It must be in its original premium Elite Bling packaging (box and velvet pouch).</li>
                                <li>Any price tags or product seals must remain intact and attached.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Specific Exceptions */}
                    <div className="card p-8 md:p-10 animate-fade-in-up animate-delay-200">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="p-3 bg-gold-400/10 border border-gold-400/20 text-gold-400">
                                <FiAlertTriangle size={24} />
                            </div>
                            <h2 className="text-2xl font-heading font-semibold text-ivory">Exclusions & Restrictions</h2>
                        </div>
                        <div className="space-y-4 text-dark-200 leading-relaxed text-sm md:text-base">
                            <p>
                                Due to the delicate nature of artificial jewelry and strict hygiene practices, please note the following exceptions:
                            </p>
                            <ul className="list-disc list-inside pl-4 space-y-2 text-dark-300">
                                <li><strong>Earrings:</strong> Earrings cannot be returned or exchanged due to sanitary and hygiene reasons, unless they are defective or damaged upon arrival.</li>
                                <li><strong>Custom Orders:</strong> Customized or personalized jewelry pieces are final sale and cannot be returned.</li>
                                <li><strong>Wholesale Purchases:</strong> Wholesale orders are final. However, we accept reports of transit damage or missing items within **48 hours** of delivery. Proof (photos/videos of package unboxing) is required.</li>
                            </ul>
                        </div>
                    </div>

                    {/* How to initiate return */}
                    <div className="card p-8 md:p-10 animate-fade-in-up animate-delay-300">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="p-3 bg-gold-400/10 border border-gold-400/20 text-gold-400">
                                <FiCheckCircle size={24} />
                            </div>
                            <h2 className="text-2xl font-heading font-semibold text-ivory">How to Request a Return</h2>
                        </div>
                        <div className="space-y-4 text-dark-200 leading-relaxed text-sm md:text-base">
                            <p>
                                Requesting a return is simple and straightforward:
                            </p>
                            <ol className="list-decimal list-inside pl-4 space-y-2 text-dark-300">
                                <li>Email us at <strong>elitebling@gmail.com</strong> or message us on WhatsApp with your Order ID and photos of the item you wish to return.</li>
                                <li>Our team will review your request within 24–48 hours and provide details on where to send the parcel.</li>
                                <li>Package the item securely to avoid transit damage, and ship it back to us via a tracked courier service. Return shipping costs are paid by the customer unless the return is due to our error (wrong or damaged item).</li>
                            </ol>
                        </div>
                    </div>

                    {/* Refund Process */}
                    <div className="card p-8 md:p-10 animate-fade-in-up animate-delay-400">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="p-3 bg-gold-400/10 border border-gold-400/20 text-gold-400">
                                <FiDollarSign size={24} />
                            </div>
                            <h2 className="text-2xl font-heading font-semibold text-ivory">Refund Processing</h2>
                        </div>
                        <div className="space-y-4 text-dark-200 leading-relaxed text-sm md:text-base">
                            <p>
                                Once we receive and inspect your returned jewelry, we will notify you of the approval or rejection of your refund.
                            </p>
                            <p>
                                If approved, you can choose one of the following refund methods:
                            </p>
                            <ul className="list-disc list-inside pl-4 space-y-2 text-dark-300">
                                <li><strong>Store Credit:</strong> Issued immediately as a digital coupon code for your next shopping experience.</li>
                                <li><strong>Bank Transfer:</strong> Processed directly to your Pakistani bank account or EasyPaisa/JazzCash wallet within 5–7 business days.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="text-center pt-8 text-dark-300">
                        <p className="mb-2">For any questions or support regarding returns, reach out to our team at:</p>
                        <p className="text-gold-400 font-semibold font-heading">elitebling@gmail.com | 03447224448</p>
                        <p className="text-xs text-dark-400 mt-4">Last Updated: July 10, 2026</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RefundPolicy
