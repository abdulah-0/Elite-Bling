import React from 'react'
import { FiFileText, FiBookmark, FiAlertCircle, FiTrendingUp } from 'react-icons/fi'

const TermsConditions = () => {
    return (
        <div className="bg-dark-800 text-ivory min-h-screen py-16 md:py-24 animate-fade-in">
            <div className="container-custom">
                {/* Header Section */}
                <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in-up">
                    <h1 className="text-4xl md:text-6xl font-heading font-bold mb-4">
                        Terms & <span className="gold-text">Conditions</span>
                    </h1>
                    <p className="text-dark-300 text-lg leading-relaxed">
                        Welcome to Elite Bling. By accessing our platform, you agree to comply with and be bound 
                        by the following terms of service.
                    </p>
                    <div className="gold-divider mt-8"></div>
                </div>

                {/* Content Cards */}
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Agreement to Terms */}
                    <div className="card p-8 md:p-10 animate-fade-in-up animate-delay-100">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="p-3 bg-gold-400/10 border border-gold-400/20 text-gold-400">
                                <FiFileText size={24} />
                            </div>
                            <h2 className="text-2xl font-heading font-semibold text-ivory">1. Acceptance of Terms</h2>
                        </div>
                        <div className="space-y-4 text-dark-200 leading-relaxed text-sm md:text-base">
                            <p>
                                By accessing, browsing, or placing an order on our website, you agree to be bound by these Terms and Conditions and our Privacy Policy.
                            </p>
                            <p>
                                These terms apply to all users of the site, including retail customers, wholesale partners, and content contributors. If you do not agree to these terms, please do not use our website.
                            </p>
                        </div>
                    </div>

                    {/* Intellectual Property */}
                    <div className="card p-8 md:p-10 animate-fade-in-up animate-delay-200">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="p-3 bg-gold-400/10 border border-gold-400/20 text-gold-400">
                                <FiBookmark size={24} />
                            </div>
                            <h2 className="text-2xl font-heading font-semibold text-ivory">2. Intellectual Property Rights</h2>
                        </div>
                        <div className="space-y-4 text-dark-200 leading-relaxed text-sm md:text-base">
                            <p>
                                All content on this website, including but not limited to jewelry designs, product photos, graphics, logos, text, button icons, and software, is the property of Elite Bling and is protected by copyright and intellectual property laws of Pakistan and international treaties.
                            </p>
                            <p>
                                Any unauthorized copy, reproduction, distribution, or commercial exploitation of our designs or website media is strictly prohibited.
                            </p>
                        </div>
                    </div>

                    {/* Product Info & Pricing */}
                    <div className="card p-8 md:p-10 animate-fade-in-up animate-delay-300">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="p-3 bg-gold-400/10 border border-gold-400/20 text-gold-400">
                                <FiAlertCircle size={24} />
                            </div>
                            <h2 className="text-2xl font-heading font-semibold text-ivory">3. Product & Pricing Information</h2>
                        </div>
                        <div className="space-y-4 text-dark-200 leading-relaxed text-sm md:text-base">
                            <p>
                                We make every effort to display the colors and details of our jewelry as accurately as possible. However, display colors vary by monitor, and we cannot guarantee that the visual representation will be 100% identical to the physical product.
                            </p>
                            <p>
                                All prices are listed in PKR (Pakistani Rupees). We reserve the right to modify prices, discontinue products, or update descriptions at any time without prior notice.
                            </p>
                        </div>
                    </div>

                    {/* Wholesale terms */}
                    <div className="card p-8 md:p-10 animate-fade-in-up animate-delay-400">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="p-3 bg-gold-400/10 border border-gold-400/20 text-gold-400">
                                <FiTrendingUp size={24} />
                            </div>
                            <h2 className="text-2xl font-heading font-semibold text-ivory">4. Wholesale Program Rules</h2>
                        </div>
                        <div className="space-y-4 text-dark-200 leading-relaxed text-sm md:text-base">
                            <p>
                                Authorized wholesale members agree to the following terms:
                            </p>
                            <ul className="list-disc list-inside pl-4 space-y-2 text-dark-300">
                                <li><strong>Minimum Order Value:</strong> Wholesale prices apply only when minimum order conditions are met (as listed on the Wholesale page).</li>
                                <li><strong>Resale Rights:</strong> You may resell Elite Bling jewelry in your retail stores or online platforms, but you may not represent yourself as the manufacturer.</li>
                                <li><strong>Account Termination:</strong> We reserve the right to terminate wholesale account access if policy violations, price-undercutting, or brand misrepresentations are discovered.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Governing Law */}
                    <div className="card p-8 md:p-10 animate-fade-in-up animate-delay-500">
                        <h2 className="text-2xl font-heading font-semibold text-ivory mb-6">5. Governing Law & Dispute Resolution</h2>
                        <div className="space-y-4 text-dark-200 leading-relaxed text-sm md:text-base">
                            <p>
                                These Terms and Conditions shall be governed by and construed in accordance with the laws of the Islamic Republic of Pakistan. Any dispute arising out of or in connection with the use of this website shall be subject to the exclusive jurisdiction of the competent courts in Islamabad.
                            </p>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="text-center pt-8 text-dark-300">
                        <p className="mb-2">If you have any questions or require clarifications on these Terms, please reach us at:</p>
                        <p className="text-gold-400 font-semibold font-heading">elitebling@gmail.com | +923290987690</p>
                        <p className="text-xs text-dark-400 mt-4">Last Updated: July 10, 2026</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TermsConditions
