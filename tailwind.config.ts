import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        // Dark theme tokens
        dark: {
          bg: '#0A0A0F',
          surface: '#111118',
          border: '#1E1E2E',
          'border-hover': '#2E2E45',
          muted: '#6B7280',
          'muted-light': '#9CA3AF',
        },
        // Light theme tokens (warm amber/cream palette)
        warm: {
          bg: '#FDF6E3',
          'bg-alt': '#FAF0D0',
          surface: '#FFF8E7',
          'surface-alt': '#FEF3C7',
          border: '#E8D5A3',
          'border-hover': '#D4B872',
          muted: '#92704A',
          'muted-light': '#B8956A',
          text: '#1C1410',
          'text-secondary': '#5C4033',
        },
        // Accent
        indigo: {
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
        },
        // Deal urgency
        urgency: {
          safe: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
        },
      },
      animation: {
        'countdown-tick': 'pulse 1s ease-in-out infinite',
        'card-in': 'cardIn 0.4s ease forwards',
        'fade-up': 'fadeUp 0.5s ease forwards',
        shimmer: 'shimmer 1.5s infinite',
      },
      keyframes: {
        cardIn: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
export default config
