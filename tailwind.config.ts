import type { Config } from 'tailwindcss'

export default {
  // Tailwind scanne ces fichiers pour savoir quelles classes utiliser
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],

  // Mode sombre : activé via une classe 'dark' sur le <html>
  darkMode: 'class',

  theme: {
    extend: {
      // Polices personnalisées (chargées dans index.html)
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans:  ['"DM Sans"', '"Helvetica Neue"', 'sans-serif'],
      },

      // Couleurs du thème Dutch
      colors: {
        gold:  { DEFAULT: '#d4a853', light: '#f0cb72', dim: '#a07830' },
        felt:  { DEFAULT: '#0b1e13', light: '#112b1b' },
        navy:  { DEFAULT: '#1a237e', light: '#2d3f9e' },
        cream: '#f0ebe0',
      },

      // Rayon de bordure personnalisé
      borderRadius: {
        card: '10px',
        phone: '50px',
      },

      // Animations personnalisées
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(24px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.35' },
        },
        'deal': {
          from: { transform: 'translateY(-40px) scale(0.8)', opacity: '0' },
          to:   { transform: 'translateY(0) scale(1)',       opacity: '1' },
        },
      },
      animation: {
        'slide-up':  'slide-up 0.35s ease both',
        'fade-in':   'fade-in 0.4s ease both',
        'pulse-dot': 'pulse-dot 1s ease infinite',
        'deal':      'deal 0.3s ease both',
      },
    },
  },
  plugins: [],
} satisfies Config
