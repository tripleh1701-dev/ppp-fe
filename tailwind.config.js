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
                accent: {
                    50: '#e6feff',
                    100: '#ccfdff',
                    200: '#99fbff',
                    300: '#66f9ff',
                    400: '#33f7ff',
                    500: '#05E9FE', // brand cyan
                    600: '#00c7d9',
                    700: '#00a5b3',
                    800: '#00838e',
                    900: '#006168',
                },
                brandBlue: '#0171EC',
                brandCyan: '#05E9FE',
                brand: {
                    blue: '#0171EC',
                    cyan: '#05E9FE',
                },
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
            // Responsive breakpoints for native 80% zoom simulation
            // These breakpoints create a denser, more content-rich layout naturally
            screens: {
                'xs': '475px',
                'sm': '640px',
                'md': '768px',
                'lg': '1024px',      // Increased for better desktop experience
                'xl': '1280px',
                '2xl': '1440px',     // Maximum content width for 80% zoom effect
                '3xl': '1600px',
                '4xl': '1920px',
                // Device-specific breakpoints
                'mobile': {'max': '1023px'},      // Mobile-first approach
                'tablet': {'min': '1024px', 'max': '1439px'}, // Tablet range
                'desktop': {'min': '1440px'},     // Desktop and above
                'retina': {'min-resolution': '2dppx'},
            },
            // Modern typography scale for professional appearance
            // Font sizes optimized for readability and consistency
            fontSize: {
                'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em' }],        // 12px
                'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.025em' }],   // 14px
                'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0.025em' }],      // 16px
                'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '0.025em' }],   // 18px
                'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '0.025em' }],    // 20px
                '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '0.025em' }],       // 24px
                '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '0.025em' }],  // 30px
                '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '0.025em' }],    // 36px
                '5xl': ['3rem', { lineHeight: '1', letterSpacing: '0.025em' }],            // 48px
                '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '0.025em' }],         // 60px
                // Responsive typography for dynamic scaling
                'responsive-xs': ['clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)', { lineHeight: '1.25rem' }],
                'responsive-sm': ['clamp(0.875rem, 0.8rem + 0.375vw, 1rem)', { lineHeight: '1.5rem' }],
                'responsive-base': ['clamp(1rem, 0.9rem + 0.5vw, 1.125rem)', { lineHeight: '1.75rem' }],
                'responsive-lg': ['clamp(1.125rem, 1rem + 0.625vw, 1.25rem)', { lineHeight: '1.75rem' }],
                'responsive-xl': ['clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)', { lineHeight: '2rem' }],
                'responsive-2xl': ['clamp(1.5rem, 1.3rem + 1vw, 2rem)', { lineHeight: '2.25rem' }],
                'responsive-3xl': ['clamp(1.875rem, 1.6rem + 1.375vw, 2.5rem)', { lineHeight: '2.5rem' }],
            },
            // Spacing scale for native 80% zoom simulation
            // Increased spacing to create denser, more content-rich layouts
            spacing: {
                '18': '4.5rem',      // 72px
                '88': '22rem',       // 352px
                '128': '32rem',      // 512px
                '144': '36rem',      // 576px
                // Additional spacing for 80% zoom effect
                '22': '5.5rem',      // 88px
                '26': '6.5rem',      // 104px
                '30': '7.5rem',      // 120px
                '34': '8.5rem',      // 136px
            },
            // Modern shadows for professional appearance
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
            // Container queries support for native 80% zoom simulation
            // Container widths optimized for denser layouts
            container: {
                center: true,
                padding: {
                    DEFAULT: '1.5rem',  // 24px - Increased for better spacing
                    sm: '2rem',          // 32px
                    lg: '3rem',          // 48px
                    xl: '4rem',          // 64px
                    '2xl': '5rem',       // 80px
                },
                // Max-widths optimized for 80% zoom effect
                screens: {
                    sm: '640px',
                    md: '768px',
                    lg: '1024px',
                    xl: '1280px',
                    '2xl': '1440px',     // Maximum width for 80% zoom simulation
                },
            },
            // Modern backdrop filters
            backdropBlur: {
                xs: '2px',
            },
        },
    },
    plugins: [
        // Custom plugin for responsive utilities and native 80% zoom simulation
        function({ addUtilities, theme }) {
            const newUtilities = {
                // Typography utilities
                '.text-responsive': {
                    fontSize: 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',
                    lineHeight: '1.5rem',
                },
                '.container-responsive': {
                    maxWidth: '1440px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    paddingLeft: '1.5rem',
                    paddingRight: '1.5rem',
                },
                // Layout utilities for 80% zoom effect
                '.layout-dense': {
                    maxWidth: '1440px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                },
                '.spacing-dense': {
                    gap: '1rem',
                },
                '.spacing-normal': {
                    gap: '1.5rem',
                },
                '.spacing-relaxed': {
                    gap: '2rem',
                },
                // Component utilities
                '.card-base': {
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                    transition: 'all 0.2s ease-in-out',
                },
                '.card-hover': {
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                },
            };
            addUtilities(newUtilities);
        },
    ],
};
