/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#f3f4f1',
        surface: '#ffffff',
        ink: '#1a1a1a',
        muted: '#5a5a52',
        faint: '#9a9a92',
        line: '#e9e7df',
        chip: '#f0ece0',
        dark: '#1a1a1a',
        primary: { DEFAULT: '#1d5b3f', light: '#5dcaa5', soft: '#e1f5ee' },
        sand: { DEFAULT: '#e3d9c8', text: '#6b4f2a' },
        danger: { DEFAULT: '#d85a30', soft: '#faece7' },
        amber: { DEFAULT: '#ba7517', soft: '#faeeda' },
        info:  { DEFAULT: '#185fa5', soft: '#e6f1fb' },
        plum:  { DEFAULT: '#993556', soft: '#fbeaf0' },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '10px',
        lg: '14px',
        xl: '18px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
};
