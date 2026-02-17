/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mvp: {
          dark: '#0B245C',
          card: '#0E2D6B',
          border: '#163478',
          accent: '#59D6D6',
          gold: '#ffd700',
          silver: '#c0c0c0',
          bronze: '#cd7f32',
          fire: '#ff6b35',
          electric: '#59D6D6',
          success: '#00e676',
          warning: '#ffab00',
        }
      },
      fontFamily: {
        display: ['Montserrat', 'system-ui', 'sans-serif'],
        body: ['Merriweather', 'Georgia', 'serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'count-up': 'count-up 1s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(89, 214, 214, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(89, 214, 214, 0.6)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      }
    },
  },
  plugins: [],
}
