import React from 'react'
import { FiLock, FiEye, FiShield, FiFileText } from 'react-icons/fi'

const PrivacyPolicy = () => {
    return (
        <div className="bg-dark-800 text-ivory min-h-screen py-16 md:py-24 animate-fade-in">
            <div className="container-custom">
                {/* Header Section */}
                <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in-up">
                    <h1 className="text-4xl md:text-6xl font-heading font-bold mb-4">
                        Privacy <span className="gold-text">Policy</span>
                    </h1>
                    <p className="text-dark-300 text-lg leading-relaxed">
                        At Elite Bling, we value your trust and are committed to protecting your personal information. 
                        This policy outlines how we collect, use, and safeguard your data.
                    </p>
                    <div className="gold-divider mt-8"></div>
                </div>

                {/* Content Cards */}
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Information Collection */}
                    <div className="card p-8 md:p-10 animate-fade-in-up animate-delay-100">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="p-3 bg-gold-400/10 border border-gold-400/20 text-gold-400">
                                <FiEye size={24} />
                            </div>
                            <h2 className="text-2xl font-heading font-semibold text-ivory">Information We Collect</h2>
                        </div>
                        <div className="space-y-4 text-dark-200 leading-relaxed text-sm md:text-base">
                            <p>
                                We collect information that you provide directly to us when visiting our website, creating an account, making a purchase, subscribing to our newsletter, or applying for our wholesale program.
                            </p>
                            <ul className="list-disc list-inside pl-4 space-y-2 text-dark-300">
                                <li><strong>Personal Identification:</strong> Name, email address, phone number, shipping and billing addresses.</li>
                                <li><strong>Account Details:</strong> Login credentials, purchase history, and wholesale program preferences.</li>
                                <li><strong>Payment Details:</strong> Transaction details are processed securely through our payment processors. We do not store full credit card information on our servers.</li>
                                <li><strong>Technical Information:</strong> IP address, browser type, device information, and interaction history on our website via cookies.</li>
                            </ul>
                        </div>
                    </div>

                    {/* How We Use Your Information */}
                    <div className="card p-8 md:p-10 animate-fade-in-up animate-delay-200">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="p-3 bg-gold-400/10 border border-gold-400/20 text-gold-400">
                                <FiFileText size={24} />
                            </div>
                            <h2 className="text-2xl font-heading font-semibold text-ivory">How We Use Your Information</h2>
                        </div>
                        <div className="space-y-4 text-dark-200 leading-relaxed text-sm md:text-base">
                            <p>
                                Elite Bling processes your information to deliver a premium luxury shopping experience. This includes:
                            </p>
                            <ul className="list-disc list-inside pl-4 space-y-2 text-dark-300">
                                <li>Processing, fulfilling, and shipping your retail and wholesale orders.</li>
                                <li>Managing your account and verifying wholesale eligibility.</li>
                                <li>Communicating with you regarding order statuses, updates, and customer support.</li>
                                <li>Sending promotional emails and exclusive offers (if you choose to subscribe).</li>
                                <li>Improving our website performance, layout, and product offerings.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Data Security */}
                    <div className="card p-8 md:p-10 animate-fade-in-up animate-delay-300">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="p-3 bg-gold-400/10 border border-gold-400/20 text-gold-400">
                                <FiShield size={24} />
                            </div>
                            <h2 className="text-2xl font-heading font-semibold text-ivory">Data Security & Protection</h2>
                        </div>
                        <div className="space-y-4 text-dark-200 leading-relaxed text-sm md:text-base">
                            <p>
                                We implement state-of-the-art security measures to maintain the safety of your personal information.
                            </p>
                            <p>
                                Our application uses secure backend database solutions (Supabase) with standard encryption protocols and row-level security (RLS) to ensure your personal data is protected against unauthorized access, modification, or disclosure. SSL encryption protects data transmitted to and from our site.
                            </p>
                        </div>
                    </div>

                    {/* Cookies and Third Party sharing */}
                    <div className="card p-8 md:p-10 animate-fade-in-up animate-delay-400">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="p-3 bg-gold-400/10 border border-gold-400/20 text-gold-400">
                                <FiLock size={24} />
                            </div>
                            <h2 className="text-2xl font-heading font-semibold text-ivory">Third-Party Disclosures</h2>
                        </div>
                        <div className="space-y-4 text-dark-200 leading-relaxed text-sm md:text-base">
                            <p>
                                We do not sell, trade, or rent your personal identification information to others.
                            </p>
                            <p>
                                We may share limited information with trusted service providers who assist us in operating our website and conducting our business, such as shipping carriers (TCS, Leopards, etc.) and payment gateway providers, as long as they agree to keep this information confidential.
                            </p>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="text-center pt-8 text-dark-300">
                        <p className="mb-2">If you have any questions regarding this Privacy Policy, please contact us at:</p>
                        <p className="text-gold-400 font-semibold font-heading">elitebling@gmail.com</p>
                        <p className="text-xs text-dark-400 mt-4">Last Updated: July 10, 2026</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PrivacyPolicy
