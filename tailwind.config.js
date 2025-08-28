/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#e6f3ff',
                    100: '#cfe8ff',
                    200: '#a0d0ff',
                    300: '#72b9ff',
                    400: '#44a1ff',
                    500: '#1f8cff',
                    600: '#0171EC', // brand blue
                    700: '#005fca',
                    800: '#004da8',
                    900: '#003b85',
                },
                brandBlue: '#0171EC',
                brandCyan: '#05E9FE',
                // Professional color palette
                slate: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                },
                // Status colors
                success: {
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    500: '#22c55e',
                    600: '#16a34a',
                    700: '#15803d',
                },
                warning: {
                    50: '#fffbeb',
                    100: '#fef3c7',
                    500: '#f59e0b',
                    600: '#d97706',
                    700: '#b45309',
                },
                error: {
                    50: '#fef2f2',
                    100: '#fee2e2',
                    500: '#ef4444',
                    600: '#dc2626',
                    700: '#b91c1c',
                },
            },
            backgroundImage: {
                'brand-gradient': 'linear-gradient(135deg, #0171EC 0%, #05E9FE 100%)',
                'brand-gradient-soft': 'linear-gradient(135deg, rgba(1,113,236,0.85) 0%, rgba(5,233,254,0.85) 100%)',
            },
            textColor: {
                brand: '#0171EC',
                brandCyan: '#05E9FE',
            },
            // Responsive breakpoints
            screens: {
                'xs': '475px',
                'sm': '640px',
                'md': '768px',
                'lg': '1024px',
                'xl': '1280px',
                '2xl': '1536px',
                '3xl': '1920px',
                '4xl': '2560px',
                // Device-specific breakpoints
                'mobile': {'max': '767px'},
                'tablet': {'min': '768px', 'max': '1023px'},
                'desktop': {'min': '1024px'},
                'retina': {'min-resolution': '2dppx'},
            },
            // Modern typography scale
            fontSize: {
                'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em' }],
                'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.025em' }],
                'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0.025em' }],
                'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '0.025em' }],
                'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '0.025em' }],
                '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '0.025em' }],
                '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '0.025em' }],
                '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '0.025em' }],
                '5xl': ['3rem', { lineHeight: '1', letterSpacing: '0.025em' }],
                '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '0.025em' }],
                // Responsive typography
                'responsive-xs': ['clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)', { lineHeight: '1.25rem' }],
                'responsive-sm': ['clamp(0.875rem, 0.8rem + 0.375vw, 1rem)', { lineHeight: '1.5rem' }],
                'responsive-base': ['clamp(1rem, 0.9rem + 0.5vw, 1.125rem)', { lineHeight: '1.75rem' }],
                'responsive-lg': ['clamp(1.125rem, 1rem + 0.625vw, 1.25rem)', { lineHeight: '1.75rem' }],
                'responsive-xl': ['clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)', { lineHeight: '2rem' }],
                'responsive-2xl': ['clamp(1.5rem, 1.3rem + 1vw, 2rem)', { lineHeight: '2.25rem' }],
                'responsive-3xl': ['clamp(1.875rem, 1.6rem + 1.375vw, 2.5rem)', { lineHeight: '2.5rem' }],
            },
            // Spacing scale
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
                '128': '32rem',
                '144': '36rem',
            },
            // Modern shadows
            boxShadow: {
                'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
                'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                'large': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
                'glow-lg': '0 0 40px rgba(59, 130, 246, 0.4)',
            },
            // Modern border radius
            borderRadius: {
                '4xl': '2rem',
                '5xl': '2.5rem',
            },
            // Animation durations
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'slide-down': 'slideDown 0.3s ease-out',
                'scale-in': 'scaleIn 0.2s ease-out',
                'bounce-soft': 'bounceSoft 0.6s ease-in-out',
            },
            // Keyframes
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                bounceSoft: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-5px)' },
                },
            },
            // Container queries support
            container: {
                center: true,
                padding: {
                    DEFAULT: '1rem',
                    sm: '2rem',
                    lg: '4rem',
                    xl: '5rem',
                    '2xl': '6rem',
                },
            },
            // Modern backdrop filters
            backdropBlur: {
                xs: '2px',
                },
            },
        },
    plugins: [
        // Custom plugin for responsive utilities
        function({ addUtilities, theme }) {
            const newUtilities = {
                '.text-responsive': {
                    fontSize: 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',
                    lineHeight: '1.75rem',
                },
                '.container-responsive': {
                    width: '100%',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    paddingLeft: 'max(1rem, calc((100vw - 1200px) / 2))',
                    paddingRight: 'max(1rem, calc((100vw - 1200px) / 2))',
                },
                '.aspect-video': {
                    aspectRatio: '16 / 9',
                },
                '.aspect-square': {
                    aspectRatio: '1 / 1',
                },
                '.scrollbar-hide': {
                    '-ms-overflow-style': 'none',
                    'scrollbar-width': 'none',
                    '&::-webkit-scrollbar': {
                        display: 'none',
                    },
                },
                '.text-brand-gradient': {
                    background: 'linear-gradient(135deg, #0171EC 0%, #05E9FE 100%)',
                    '-webkit-background-clip': 'text',
                    'background-clip': 'text',
                    '-webkit-text-fill-color': 'transparent',
                },
                '.bg-brand-gradient': {
                    background: 'linear-gradient(135deg, #0171EC 0%, #05E9FE 100%)',
                },
                '.ring-brand': {
                    '--tw-ring-color': '#0171EC',
                },
            };
            addUtilities(newUtilities);
        },
    ],
};
