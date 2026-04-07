/** @type {import('tailwindcss').Config} */

// ─── Brand palette ──────────────────────────────────────────────────────────
const BRAND = {
  navy:  '#01154B',
  blue:  '#0A4C99',
  teal:  '#3C9FA9',
  cyan:  '#4DB0C7',
}

// Shared brand scale — replaces both violet and purple
const brandScale = {
  50:  '#E8EDF8',
  100: '#C5D2EE',
  200: '#9DB3E3',
  300: BRAND.cyan,    // #4DB0C7
  400: BRAND.teal,    // #3C9FA9
  500: BRAND.teal,    // #3C9FA9  — focus rings
  600: BRAND.blue,    // #0A4C99  ← PRIMARY CTA
  700: '#083D7D',     // hover on primary
  800: '#052B5C',
  900: BRAND.navy,    // #01154B  — brand navy
  950: '#010E35',
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

      // zinc → navy-tinted dark scale (used in dark mode only)
      zinc: {
        50:  '#F3F6FB',
        100: '#E6EDF6',
        200: '#D0DCEC',
        300: '#B0C4D8',
        400: '#8EA7C2',  // muted blue-gray — tertiary text
        500: '#6B87A8',  // secondary text
        600: '#1E4080',
        700: '#133070',
        800: '#0A1D5A',  // inputs / secondary surfaces
        900: BRAND.navy, // #01154B — cards / sidebar
        950: '#010A2A',  // page background
      },

      // brand helpers
      brand: BRAND,
    }),
  },
  plugins: [],
}
