import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sidebar: {
          bg: '#0f1117',
          border: '#1e2130',
          text: '#8b92a5',
          active: '#ffffff',
          hover: '#1e2130',
        },
      },
    },
  },
  plugins: [],
}
export default config
