import { FaWhatsapp } from 'react-icons/fa6'

const WhatsAppButton = () => {
    const phoneNumber = '923290987690'
    const message = 'Hello Ellite Bling, I would like to inquire about your wholesale and retail jewelry collection.'
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`

    return (
        <aside aria-label="Customer support WhatsApp contact">
            <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with Ellite Bling on WhatsApp"
                className="fixed bottom-6 right-6 z-40 bg-[#25D366] text-white p-3.5 rounded-full shadow-[0_4px_20px_rgba(37,211,102,0.4)] hover:shadow-[0_6px_25px_rgba(37,211,102,0.6)] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center group"
            >
                <FaWhatsapp className="text-2xl" />
                <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 text-xs font-semibold uppercase tracking-wider transition-all duration-500 ease-in-out">
                    Chat on WhatsApp
                </span>
            </a>
        </aside>
    )
}

export default WhatsAppButton
