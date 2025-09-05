import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        dim: "#64748b",
        line: "#e5e7eb",
        brand: {
          50:  "#f0f9ff", // Lighter blue
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9", // Main brand color
          600: "#0284c7",
          700: "#0369a1",
        },
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.05), 0 1px 3px 0 rgb(0 0 0 / 0.1)",
      },
      borderRadius: {
        xl: "0.75rem", // A bit smaller for a cleaner look
        "2xl": "1rem",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
        mono: ["var(--font-geist-mono)"],
      }
    },
  },
  plugins: [],
};
export default config;