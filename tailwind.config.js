/** @type {import('tailwindcss').Config} */

// ─── Brand palette ──────────────────────────────────────────────────────────
const BRAND = {
  navy:  '#006978',
  blue:  '#00BCD4',
  teal:  '#00ACC1',
  cyan:  '#26C6DA',
}

// Shared brand scale — replaces both violet and purple
const brandScale = {
  50:  '#E0F7FA',
  100: '#B2EBF2',
  200: '#80DEEA',
  300: '#26C6DA',
  400: '#00BCD4',
  500: '#00ACC1',   // focus rings
  600: '#00BCD4',   // ← PRIMARY CTA
  700: '#0097A7',   // hover on primary
  800: '#00838F',
  900: '#006064',
  950: '#004D52',
}

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans:    ['"Open Sans"', 'system-ui', 'sans-serif'],
        heading: ['"Montserrat"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: BRAND,
      },
    },

    // ─── Full-scale overrides — these REPLACE the Tailwind defaults ──────────
    // Using theme.colors (not extend) ensures the default violet/purple/zinc
    // scales are fully replaced with brand colors, no cache issues.
    colors: ({ colors }) => ({
      ...colors,                // keep all Tailwind defaults (red, green, blue, gray…)

      // violet → brand blue scale
      violet: brandScale,

      // purple → brand blue scale (same mapping)
      purple: {
        ...brandScale,
        700: BRAND.navy,   // slightly darker for purple-700
        800: '#010E35',
        900: '#010A2A',
        950: '#01071E',
      },

      // zinc → neutral dark scale — noir profond (dark mode)
      zinc: {
        50:  '#fafafa',
        100: '#f4f4f5',
        200: '#e4e4e7',
        300: '#d4d4d8',
        400: '#a1a1aa',  // muted text
        500: '#71717a',  // secondary text
        600: '#3f3f46',
        700: '#27272a',
        800: '#171717',  // inputs / secondary surfaces
        900: '#0d0d0d',  // cards / sidebar
        950: '#060606',  // page background
      },

      // brand helpers
      brand: BRAND,
    }),
  },
  plugins: [],
}
