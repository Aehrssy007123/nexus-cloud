/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        graphite: '#171816',
        charcoal: '#22231F',
        elevated: '#2B2C27',
        'elevated-hover': '#353630',
        orange: {
          DEFAULT: '#D97736',
          hover: '#C26325',
          light: '#E28B50',
          dark: '#A6531C',
        },
        amber: {
          DEFAULT: '#E9A65A',
          hover: '#DB9442',
          light: '#F2BE7D',
        },
        ivory: {
          DEFAULT: '#F4F0E8',
          muted: '#D8D4CC',
        },
        stone: {
          DEFAULT: '#AAA69B',
          muted: '#807D74',
          dark: '#5C5952',
        },
        sage: {
          DEFAULT: '#8EA58A',
          hover: '#7A9376',
          light: '#A7BDA3',
        },
        'soft-border': '#393A33',
        'soft-border-hover': '#4E5046',
      },
      backgroundImage: {
        'nexus-gradient': 'linear-gradient(135deg, #D97736 0%, #E9A65A 100%)',
        'nexus-gradient-hover': 'linear-gradient(135deg, #C26325 0%, #DB9442 100%)',
        'graphite-bg': 'linear-gradient(180deg, #171816 0%, #1f201c 100%)',
        'card-gradient': 'linear-gradient(180deg, #2B2C27 0%, #252622 100%)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
