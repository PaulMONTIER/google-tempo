import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Palette Notion-inspired with dark mode support
        notion: {
          bg: "var(--notion-bg, #ffffff)",
          sidebar: "var(--notion-sidebar, #f7f6f3)",
          text: "var(--notion-text, #37352f)",
          textLight: "var(--notion-text-light, #787774)",
          border: "var(--notion-border, #e9e9e7)",
          hover: "var(--notion-hover, #f1f1ef)",
          blue: "rgb(var(--accent-color-rgb) / <alpha-value>)",
          blueLight: "rgb(var(--accent-color-rgb) / 0.1)",
          purple: "#9065b0",
          purpleLight: "#f2ebf9",
          pink: "#e255a1",
          pinkLight: "#fde8f4",
          red: "#e03e3e",
          redLight: "#ffeaea",
          orange: "#d9730d",
          orangeLight: "#fef2e6",
          yellow: "#dfab01",
          yellowLight: "#fef5da",
          green: "#4dab9a",
          greenLight: "#e8f5f2",
        },
      },
    },
  },
  plugins: [],
};

export default config;
