/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#faf7f2',
                    100: '#f0e8d9',
                    200: '#e8d9b5',
                    300: '#d4af37',
                    400: '#c9a032',
                    500: '#b8962c',
                    600: '#a07d22',
                    700: '#87691a',
                    800: '#6e5513',
                    900: '#55400d',
                },
                gold: {
                    50: '#fdf9ed',
                    100: '#f9efcc',
                    200: '#f3df9a',
                    300: '#e8d9b5',
                    400: '#d4af37',
                    500: '#c9a032',
                    600: '#b8962c',
                    700: '#a07d22',
                    800: '#87691a',
                    900: '#6e5513',
                },
                dark: {
                    50: '#f5f5f5',
                    100: '#e0e0e0',
                    200: '#bfbfbf',
                    300: '#9e9e9e',
                    400: '#7d7d7d',
                    500: '#5c5c5c',
                    600: '#3b3b3b',
                    700: '#1f1f1f',
                    800: '#0f0f0f',
                    900: '#0a0a0a',
                },
                champagne: '#E8D9B5',
                ivory: '#FAF7F2',
                rosegold: '#B76E79',
            },
            fontFamily: {
                sans: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
                serif: ['Playfair Display', 'Cormorant Garamond', 'serif'],
                heading: ['Playfair Display', 'serif'],
                body: ['Inter', 'system-ui', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.6s ease-out',
                'fade-in-up': 'fadeInUp 0.6s ease-out',
                'fade-in-down': 'fadeInDown 0.6s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'slide-down': 'slideDown 0.5s ease-out',
                'slide-in-right': 'slideInRight 0.4s ease-out',
                'scale-in': 'scaleIn 0.3s ease-out',
                'glow-pulse': 'glowPulse 2s ease-in-out infinite',
                'gold-shimmer': 'goldShimmer 3s ease-in-out infinite',
                'float': 'float 6s ease-in-out infinite',
                'count-up': 'countUp 2s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(30px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeInDown: {
                    '0%': { opacity: '0', transform: 'translateY(-30px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideInRight: {
                    '0%': { transform: 'translateX(100%)' },
                    '100%': { transform: 'translateX(0)' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                glowPulse: {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)' },
                    '50%': { boxShadow: '0 0 40px rgba(212, 175, 55, 0.6)' },
                },
                goldShimmer: {
                    '0%': { backgroundPosition: '-200% center' },
                    '100%': { backgroundPosition: '200% center' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                countUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
            backgroundImage: {
                'gold-gradient': 'linear-gradient(135deg, #D4AF37, #C9A032, #B8962C)',
                'dark-gradient': 'linear-gradient(135deg, #0F0F0F, #1F1F1F)',
                'luxury-gradient': 'linear-gradient(135deg, #0F0F0F 0%, #1F1F1F 50%, #0F0F0F 100%)',
                'gold-text': 'linear-gradient(135deg, #D4AF37, #E8D9B5, #D4AF37)',
            },
        },
    },
    plugins: [],
}
