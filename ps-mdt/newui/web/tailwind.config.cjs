module.exports = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9'
        }
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideIn: {
          '0%': { 
            transform: 'translateY(-20px) scale(0.95)',
            opacity: '0'
          },
          '100%': { 
            transform: 'translateY(0) scale(1)',
            opacity: '1'
          }
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out',
        slideIn: 'slideIn 0.3s ease-out'
      }
    }
  },
  plugins: [],
}
