/** @type {import('tailwindcss').Config} */
import hongyishiPreset from '@hongyishi/config/tailwind';

export default {
  presets: [hongyishiPreset],
  content: ['./src/**/*.{js,ts,jsx,tsx}', './stories/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        error: {
          DEFAULT: 'hsl(var(--error))',
          foreground: 'hsl(var(--error-foreground))',
        },
        hongyishi: {
          red: 'var(--hys-color-constructivism-red)',
          'field-red': 'var(--hys-color-field-red)',
          orange: 'var(--hys-color-signal-orange)',
          blue: 'var(--hys-color-technology-blue)',
          cyan: 'var(--hys-color-clinical-cyan)',
          navy: 'var(--hys-color-field-navy)',
          yellow: 'var(--hys-color-structure-yellow)',
          ink: 'var(--hys-color-ink)',
          paper: 'var(--hys-color-paper)',
          'aged-paper': 'var(--hys-color-aged-paper)',
          muted: 'var(--hys-color-muted)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        'hys-card': 'var(--hys-radius-card)',
        'hys-control': 'var(--hys-radius-control)',
      },
    },
  },
  plugins: [],
};
