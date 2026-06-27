// @hongyishi/config - shared Tailwind preset for Hongyishi apps.
// Keep brand values sourced from packages/ui so React and static apps share one visual contract.

const tokens = require('../brand/tokens.json');

function cssVar(name, fallback) {
  return `var(${name}, ${fallback})`;
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
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
          red: cssVar('--hys-color-constructivism-red', tokens.colors.constructivismRed),
          'field-red': cssVar('--hys-color-field-red', tokens.colors.fieldRed),
          orange: cssVar('--hys-color-signal-orange', tokens.colors.signalOrange),
          blue: cssVar('--hys-color-technology-blue', tokens.colors.technologyBlue),
          cyan: cssVar('--hys-color-clinical-cyan', tokens.colors.clinicalCyan),
          navy: cssVar('--hys-color-field-navy', tokens.colors.fieldNavy),
          yellow: cssVar('--hys-color-structure-yellow', tokens.colors.structureYellow),
          ink: cssVar('--hys-color-ink', tokens.colors.ink),
          paper: cssVar('--hys-color-paper', tokens.colors.paper),
          'aged-paper': cssVar('--hys-color-aged-paper', tokens.colors.agedPaper),
          muted: cssVar('--hys-color-muted', tokens.colors.muted),
        },
        'constructivism-red': cssVar('--hys-color-constructivism-red', tokens.colors.constructivismRed),
        'constructivism-blue': cssVar('--hys-color-technology-blue', tokens.colors.technologyBlue),
        'constructivism-yellow': cssVar('--hys-color-structure-yellow', tokens.colors.structureYellow),
        'brand-orange': cssVar('--hys-color-signal-orange', tokens.colors.signalOrange),
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        'hys-card': cssVar('--hys-radius-card', tokens.radius.card),
        'hys-control': cssVar('--hys-radius-control', tokens.radius.control),
      },
      fontFamily: {
        sans: tokens.typography.sans,
        mono: tokens.typography.mono,
        display: tokens.typography.display,
      },
      letterSpacing: {
        tighter: '0',
        tight: '0',
      },
    },
  },
  plugins: [],
};
