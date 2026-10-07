import React from 'react'
import SEO from '../components/SEO'
import { FiXCircle, FiClock, FiCreditCard, FiAlertTriangle, FiPhone, FiMail } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa6'

const CancellationPolicy = () => {
    return (
        <div className="bg-dark-800 text-ivory min-h-screen py-16 md:py-24 animate-fade-in">
            <SEO
                title="Order Cancellation Policy"
                description="Review Ellite Bling's order cancellation terms, timeframes, refund process for prepaid orders, and guidelines for retail and wholesale jewelry."
                canonical="https://ellitebling.com/cancellation-policy"
            />
            <div className="container-custom">
                {/* Header Section */}
                <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in-up">
                    <h1 className="text-4xl md:text-6xl font-heading font-bold mb-4">
                        Order <span className="gold-text">Cancellation</span> Policy
                    </h1>
                    <p className="text-dark-300 text-lg leading-relaxed">
                        We strive to process and dispatch your luxury jewelry orders as swiftly as possible. 
                        Please review our cancellation guidelines, timelines, and refund process below.
                    </p>
                    <div className="gold-divider mt-8"></div>
                </div>

                {/* Content Cards */}
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Cancellation Window */}
                    <div className="card p-8 md:p-10 animate-fade-in-up animate-delay-100">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="p-3 bg-gold-400/10 border border-gold-400/20 text-gold-400">
                                <FiClock size={24} />
                            </div>
                            <h2 className="text-2xl font-heading font-semibold text-ivory">Cancellation Window & Eligibility</h2>
                        </div>
                        <div className="space-y-4 text-dark-200 leading-relaxed text-sm md:text-base">
                            <p>
                                You can cancel any standard retail order **free of charge within 12 hours of placing it**, or anytime **prior to package handover** to our logistics partners (TCS, Leopards, or Trax Courier).
                            </p>
                            <p>
                                Once your package has been assigned a tracking number and dispatched from our Rawalpindi fulfillment hub, an order cannot be cancelled in transit. Once delivered, you may request an exchange or return in accordance with our <a href="/refund-policy" className="text-gold-400 underline hover:text-gold-300">Return & Refund Policy</a>.
                            </p>
                        </div>
                    </div>

                    {/* How to Cancel */}
                    <div className="card p-8 md:p-10 animate-fade-in-up animate-delay-200">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="p-3 bg-gold-400/10 border border-gold-400/20 text-gold-400">
                                <FiXCircle size={24} />
                            </div>
                            <h2 className="text-2xl font-heading font-semibold text-ivory">How to Request a Cancellation</h2>
                        </div>
                        <div className="space-y-4 text-dark-200 leading-relaxed text-sm md:text-base">
                            <p>
                                To cancel your order, please reach out directly through our priority support channels with your **Order ID** and the **phone number used during checkout**:
                            </p>
                            <div className="grid sm:grid-cols-2 gap-4 mt-4">
                                <a
                                    href="https://wa.me/923290987690?text=Hello%20Ellite%20Bling%2C%20I%20would%20like%20to%20cancel%20my%20order."
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-4 border border-gold-400/20 bg-dark-900/60 flex items-center space-x-3 hover:border-gold-400 transition-colors"
                                >
                                    <FaWhatsapp className="text-2xl text-gold-400 shrink-0" />
                                    <div>
                                        <div className="font-semibold text-ivory text-sm">WhatsApp Concierge</div>
                                        <div className="text-gold-400 text-xs">03290987690 (Instant Response)</div>
                                    </div>
                                </a>
                                <a
                                    href="mailto:ellitebling@gmail.com?subject=Order%20Cancellation%20Request"
                                    className="p-4 border border-gold-400/20 bg-dark-900/60 flex items-center space-x-3 hover:border-gold-400 transition-colors"
                                >
                                    <FiMail className="text-2xl text-gold-400 shrink-0" />
                                    <div>
                                        <div className="font-semibold text-ivory text-sm">Email Support</div>
                                        <div className="text-gold-400 text-xs">ellitebling@gmail.com</div>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Prepaid vs Cash on Delivery */}
                    <div className="card p-8 md:p-10 animate-fade-in-up animate-delay-300">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="p-3 bg-gold-400/10 border border-gold-400/20 text-gold-400">
                                <FiCreditCard size={24} />
                            </div>
                            <h2 className="text-2xl font-heading font-semibold text-ivory">Refunds on Cancelled Orders</h2>
                        </div>
                        <div className="space-y-4 text-dark-200 leading-relaxed text-sm md:text-base">
                            <h3 className="text-lg font-semibold text-gold-400">Prepaid Orders (Cards & Online Banking via Rapid Gateway)</h3>
                            <p>
                                If your eligible prepaid order is cancelled prior to shipment, a **100% full refund** will be triggered back to your originating debit/credit card or bank account. Rapid Gateway processes the reversal within 24–48 hours, and your bank will typically credit the funds back to your account within **3 to 5 business days**.
                            </p>

                            <h3 className="text-lg font-semibold text-gold-400 pt-2">Cash on Delivery (COD) Orders</h3>
                            <p>
                                Cash on Delivery orders can be cancelled without any fees prior to courier dispatch. Please notify our team as soon as possible so our logistics team can unassign the package and prevent unnecessary courier transit charges. Repeated doorstep refusals of uncancelled COD orders may result in restriction of COD privileges on future orders.
                            </p>
                        </div>
                    </div>

                    {/* Custom, Bridal & Wholesale Orders */}
                    <div className="card p-8 md:p-10 animate-fade-in-up animate-delay-400">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="p-3 bg-gold-400/10 border border-gold-400/20 text-gold-400">
                                <FiAlertTriangle size={24} />
                            </div>
                            <h2 className="text-2xl font-heading font-semibold text-ivory">Custom, Bridal & Wholesale Orders</h2>
                        </div>
                        <div className="space-y-4 text-dark-200 leading-relaxed text-sm md:text-base">
                            <ul className="list-disc list-inside pl-4 space-y-2 text-dark-300">
                                <li>
                                    <strong className="text-ivory">Customized Bridal Sets:</strong> Custom bridal jewelry created to custom dimensions, color stones, or bespoke specifications can only be cancelled within **6 hours** of placement before goldsmith and stone-setting work begins. After production initiates, custom orders are non-cancellable.
                                </li>
                                <li>
                                    <strong className="text-ivory">Wholesale & Bulk Orders:</strong> Wholesale commercial orders confirmed with an advance deposit may be cancelled within **24 hours** of invoice creation. Beyond 24 hours, raw material procurement begins and advance deposits are non-refundable.
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Cancellations by Ellite Bling */}
                    <div className="card p-8 md:p-10 animate-fade-in-up">
                        <h2 className="text-xl font-heading font-semibold text-ivory mb-4">Cancellations Initiated by Ellite Bling</h2>
                        <div className="space-y-3 text-dark-200 text-sm md:text-base">
                            <p>
                                In rare cases, Ellite Bling reserves the right to cancel an order under the following circumstances:
                            </p>
                            <ul className="list-disc list-inside pl-4 space-y-2 text-dark-300">
                                <li>The ordered item is found to have a quality defect during pre-dispatch inspection and a replacement is unavailable.</li>
                                <li>Inaccurate or unverifiable shipping address, contact number, or failure to confirm Cash on Delivery via phone/WhatsApp.</li>
                                <li>Courier unserviceability due to adverse weather or regional delivery restrictions.</li>
                            </ul>
                            <p className="pt-2 text-dark-300">
                                In any such case, you will be notified immediately via WhatsApp/email, and any prepaid amount will be refunded in full without deduction.
                            </p>
                        </div>
                    </div>

                    {/* Contact footer banner */}
                    <div className="p-8 border border-gold-400/30 bg-dark-900/40 text-center space-y-3">
                        <h3 className="text-lg font-heading font-semibold text-gold-400">Questions about your order?</h3>
                        <p className="text-dark-300 text-sm">
                            Our customer care concierge is available 7 days a week from 10:00 AM to 10:00 PM (PKT).
                        </p>
                        <p className="text-dark-400 text-xs">
                            House#43, Street#2, Extension Gulzar e Quaid, Rawalpindi | Phone: +92 329 0987690
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CancellationPolicy
