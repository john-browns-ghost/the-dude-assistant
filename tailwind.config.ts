import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brody: {
          bg:        '#0b1d20',
          surface:   '#10282c',
          card:      '#163438',
          border:    '#26494b',
          foam:      '#7fd6bd',
          'foam-hi': '#a5e8d3',
          sand:      '#f2e9d8',
          muted:     '#7a9a93',
          coral:     '#e08a72',
          'coral-hi':'#f0a58e',
          palm:      '#1d3d33',
          user:      '#173338',
          assistant: '#13322c',
        },
      },
      fontFamily: {
        pacifico:  ['var(--font-pacifico)', 'cursive'],
        quicksand: ['var(--font-quicksand)', 'system-ui', 'sans-serif'],
        sans:      ['var(--font-quicksand)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'foam-glow':  '0 0 14px rgba(127, 214, 189, 0.35)',
        'coral-glow': '0 0 16px rgba(224, 138, 114, 0.45)',
        'soft':       '0 4px 24px rgba(0, 0, 0, 0.35)',
      },
      backgroundImage: {
        'lagoon': 'radial-gradient(ellipse at 20% 0%, rgba(127,214,189,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(224,138,114,0.05) 0%, transparent 55%)',
      },
      borderRadius: {
        'smooth': '1.25rem',
      },
    },
  },
  plugins: [],
};

export default config;
