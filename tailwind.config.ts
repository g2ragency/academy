import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette cliente (vedi CLAUDE.md): SOLO nero #000000, grigio #989898, bianco #F4F3F3.
        // Le superfici intermedie sono overlay in trasparenza derivati dai tre colori.
        white: '#F4F3F3',
        muted: '#989898',
        brand: {
          DEFAULT: '#F4F3F3',
          light: '#F4F3F3',
          dark: '#989898',
        },
        surface: {
          DEFAULT: '#000000',
          card: 'rgba(244, 243, 243, 0.04)',
          elevated: 'rgba(244, 243, 243, 0.08)',
          border: 'rgba(152, 152, 152, 0.25)',
        },
      },
      fontFamily: {
        sans: ['var(--font-aeonik)', 'system-ui', 'sans-serif'],
      },
      // Regola cliente (CLAUDE.md): tutto il sito a font-weight 400.
      // Tutte le classi font-* esistenti e future risolvono a 400.
      fontWeight: {
        thin: '400',
        extralight: '400',
        light: '400',
        normal: '400',
        medium: '400',
        semibold: '400',
        bold: '400',
        extrabold: '400',
        black: '400',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}

export default config
