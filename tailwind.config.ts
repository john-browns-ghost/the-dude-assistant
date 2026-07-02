import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        dude: {
          bg:        '#090604',
          surface:   '#120c07',
          card:      '#1c1209',
          border:    '#3a2010',
          gold:      '#c8952e',
          'gold-hi': '#e8b84b',
          cream:     '#f0dbb8',
          muted:     '#7a5a30',
          red:       '#8b2020',
          green:     '#2e3d22',
          user:      '#1e1509',
          assistant: '#141e10',
        },
      },
      fontFamily: {
        bebas:    ['var(--font-bebas)', 'Impact', 'sans-serif'],
        playfair: ['var(--font-playfair)', 'Georgia', 'serif'],
        serif:    ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      boxShadow: {
        'gold-glow':  '0 0 12px rgba(200, 149, 46, 0.4)',
        'red-glow':   '0 0 16px rgba(139, 32, 32, 0.6)',
        'neon-gold':  '0 0 8px rgba(232, 184, 75, 0.6), 0 0 24px rgba(200, 149, 46, 0.3)',
      },
      backgroundImage: {
        'lane': "repeating-linear-gradient(90deg, transparent 0px, transparent 59px, rgba(200,149,46,0.03) 59px, rgba(200,149,46,0.03) 60px)",
        'rug':  "repeating-linear-gradient(45deg, #8b2020 0px, #8b2020 3px, #c8952e 3px, #c8952e 6px, #1c1209 6px, #1c1209 10px, #c8952e 10px, #c8952e 13px)",
      },
    },
  },
  plugins: [],
};

export default config;
