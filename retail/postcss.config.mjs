/**
 * postcss.config.mjs — PostCSS configuration
 *
 * Uses @tailwindcss/postcss as the single PostCSS plugin.
 * This is the recommended setup for Tailwind CSS v4, which processes CSS
 * directly through PostCSS rather than requiring a tailwind.config.js file.
 * Theme customisation lives in app/globals.css via @theme inline blocks.
 */

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

export default config
