/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        zbg: '#000000',
        zcard: '#0A0A0A',
        zborder: '#222222',
        zneon: '#1DB954',
        zneonSoft: 'rgba(29,185,84,0.4)',
        ztext: '#FFFFFF',
        ztext2: '#B3B3B3',
        ztext3: '#666666',
      },
      fontFamily: {
        headline: ['Space Grotesk', 'Inter', 'sans-serif'],
        body: ['Inter', 'DM Sans', 'sans-serif'],
      },
      boxShadow: {
        neon: '0 0 20px rgba(29,185,84,0.35), 0 0 60px rgba(29,185,84,0.15)',
        neonSoft: '0 0 12px rgba(29,185,84,0.25)',
      },
      animation: {
        pulseNeon: 'pulseNeon 2.4s ease-in-out infinite',
        floatY: 'floatY 6s ease-in-out infinite',
      },
      keyframes: {
        pulseNeon: {
          '0%,100%': { boxShadow: '0 0 12px rgba(29,185,84,0.25)' },
          '50%': { boxShadow: '0 0 28px rgba(29,185,84,0.55)' },
        },
        floatY: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
};
