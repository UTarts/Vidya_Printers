import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#6D28D9', light: '#7C3AED', dark: '#5B21B6' },
        indigo: { DEFAULT: '#4F46E5' },
        accent: { DEFAULT: '#F59E0B', light: '#FCD34D' },
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        'surface-3': 'var(--surface-3)',
        vp: {
          bg: 'var(--bg)',
          text: 'var(--text)',
          sub: 'var(--text-2)',
          muted: 'var(--text-3)',
          border: 'var(--border)',
        },
        success: '#10B981',
        warning: '#F97316',
        danger: '#EF4444',
        info: '#06B6D4',
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: { card: '16px', chat: '20px' },
      animation: {
        'fade-in': 'fadeIn 0.3s ease',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        'scale-in': 'scaleIn 0.2s ease',
        'slide-in-right': 'slideInRight 0.3s ease',
        'pulse-glow': 'pulseGlow 2s ease infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
        slideInRight: { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        pulseGlow: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(239,68,68,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(239,68,68,0)' },
        },
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
};
export default config;