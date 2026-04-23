/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0d1117',
        surface: '#161b22',
        'surface-raised': '#21262d',
        primary: '#2f81f7',
        'primary-hover': '#58a6ff',
        success: '#238636',
        error: '#f85149',
        warning: '#d29922',
        border: '#30363d',
        'border-muted': '#21262d',
        text: '#c9d1d9',
        'text-muted': '#8b949e',
        'text-header': '#f0f6fc',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
