/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        aerospace: {
          950: '#06090e',
          900: '#0a1018',
          850: '#0e1724',
          800: '#131e30',
          700: '#1d2c44',
          600: '#2b3f60',
          500: '#3d5680',
          400: '#5c79a8',
          300: '#8ba2cc',
          200: '#c2d2ee',
          100: '#e5edfa',
        },
        cyanGlow: '#00f0ff',
        emeraldGlow: '#10b981',
        amberGlow: '#f59e0b',
        roseGlow: '#f43f5e',
        violetGlow: '#8b5cf6',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radar 4s linear infinite',
      },
      keyframes: {
        radar: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
}
